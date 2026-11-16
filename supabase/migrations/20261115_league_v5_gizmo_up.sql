-- Wise Owl League v5 (UP): Gizmo-style live games. Additive: new columns, one table, new functions. Existing live games keep working.
alter table public.lg_games add column if not exists host_blind boolean not null default false;
alter table public.lg_games add column if not exists bets_on boolean not null default false;
create table if not exists public.lg_game_bets (
  game_id uuid not null references public.lg_games(id) on delete cascade,
  bettor uuid not null references public.students(id),
  qidx int not null,
  target uuid not null references public.students(id),
  predict boolean not null,
  stake int not null check (stake in (100, 250, 500)),
  result int,
  placed_at timestamptz not null default now(),
  primary key (game_id, bettor, qidx),
  check (bettor <> target)
);
alter table public.lg_game_bets enable row level security;

create or replace function public.lg_game_create_g(p_code text, p_title text, p_subject text, p_questions jsonb, p_secs int, p_blind boolean, p_bets boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  r := public.lg_game_create(p_code, p_title, p_subject, p_questions, p_secs);
  if coalesce((r ->> 'ok')::boolean, false) then
    update public.lg_games set host_blind = coalesce(p_blind, false), bets_on = coalesce(p_bets, false) where pin = r ->> 'pin';
  end if;
  return r;
end $$;

-- Settle every open bet for one question exactly once: right prediction wins the stake, wrong loses it (never below 0).
create or replace function public.lg_settle_bets(p_game uuid, p_q int) returns void language plpgsql security definer set search_path = public as $$
declare r record; v_hit boolean; v_score int; v_res int;
begin
  for r in select * from public.lg_game_bets where game_id = p_game and qidx = p_q and result is null for update loop
    v_hit := exists (select 1 from public.lg_game_answers a where a.game_id = p_game and a.student_id = r.target and a.qidx = p_q and a.points > 0);
    select score into v_score from public.lg_game_players where game_id = p_game and student_id = r.bettor;
    v_res := case when v_hit = r.predict then r.stake else -least(r.stake, coalesce(v_score, 0)) end;
    update public.lg_game_bets set result = v_res where game_id = p_game and bettor = r.bettor and qidx = p_q;
    update public.lg_game_players set score = greatest(0, score + v_res) where game_id = p_game and student_id = r.bettor;
  end loop;
end $$;

create or replace function public.lg_game_bet(p_pin text, p_code text, p_seat int, p_predict boolean, p_stake int) returns jsonb language plpgsql security definer set search_path = public as $$
declare g public.lg_games; v_sid uuid; v_target uuid; v_score int; v_n int;
begin
  if p_stake not in (100, 250, 500) or p_predict is null then return public.lg_err('Pick a stake and a prediction.'); end if;
  select * into g from public.lg_games where pin = trim(coalesce(p_pin, ''));
  if not found then return public.lg_err('No game with that PIN.'); end if;
  if not g.bets_on then return public.lg_err('Betting is off in this game.'); end if;
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  select score into v_score from public.lg_game_players where game_id = g.id and student_id = v_sid;
  if not found then return public.lg_err('Join the game first.'); end if;
  if g.status <> 'question' or now() >= g.q_started + make_interval(secs => g.q_secs) then return public.lg_err('Betting is closed.'); end if;
  if p_stake > greatest(100, v_score) then return public.lg_err('You can only bet up to your score (or 100).'); end if;
  select t.student_id into v_target from (select student_id, row_number() over (order by joined_at, student_id) seat from public.lg_game_players where game_id = g.id) t where t.seat = p_seat;
  if v_target is null then return public.lg_err('Pick a player to bet on.'); end if;
  if v_target = v_sid then return public.lg_err('You cannot bet on yourself.'); end if;
  if exists (select 1 from public.lg_game_answers where game_id = g.id and student_id = v_target and qidx = g.qidx) then return public.lg_err('That player already answered. Pick someone else.'); end if;
  insert into public.lg_game_bets(game_id, bettor, qidx, target, predict, stake) values (g.id, v_sid, g.qidx, v_target, p_predict, p_stake) on conflict do nothing;
  get diagnostics v_n = row_count;
  if v_n = 0 then return public.lg_err('You already placed a bet on this question.'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- One call for the whole screen: the normal game state plus the Gizmo extras (first to answer, live feed, seats, bets).
create or replace function public.lg_game_state_g(p_pin text, p_code text, p_host boolean default false) returns jsonb language plpgsql security definer set search_path = public as $$
declare g public.lg_games; r jsonb; v_sid uuid; v_phase text; v_gz jsonb; v_seats jsonb := '[]'::jsonb; v_feed jsonb := '[]'::jsonb; v_first jsonb := null; v_fast jsonb := null; v_bet jsonb := null; v_bets jsonb := '[]'::jsonb; v_my int := null;
begin
  select * into g from public.lg_games where pin = trim(coalesce(p_pin, ''));
  if not found then return public.lg_err('No game with that PIN.'); end if;
  v_phase := g.status;
  if g.status = 'question' and now() >= g.q_started + make_interval(secs => g.q_secs) then v_phase := 'reveal'; end if;
  if v_phase = 'reveal' and g.bets_on and g.qidx >= 0 then perform public.lg_settle_bets(g.id, g.qidx); end if;
  r := public.lg_game_state(p_pin, p_code, p_host);
  if not coalesce((r ->> 'ok')::boolean, false) then return r; end if;
  if p_code is not null then v_sid := public.lg_resolve(p_code); end if;
  if g.qidx >= 0 and v_phase in ('question', 'reveal') then
    select coalesce(jsonb_agg(jsonb_build_object('who', x.who, 'ms', x.ms) order by x.ms), '[]'::jsonb) into v_feed from (
      select public.lg_disp(st.full_name, coalesce(pv.hidden, false)) who, a.ms from public.lg_game_answers a join public.students st on st.id = a.student_id left join public.lg_privacy pv on pv.student_id = st.id
      where a.game_id = g.id and a.qidx = g.qidx order by a.ms limit 8) x;
    v_first := (v_feed -> 0);
    if v_phase = 'reveal' then
      select jsonb_build_object('who', public.lg_disp(st.full_name, coalesce(pv.hidden, false)), 'ms', a.ms) into v_fast from public.lg_game_answers a join public.students st on st.id = a.student_id left join public.lg_privacy pv on pv.student_id = st.id
        where a.game_id = g.id and a.qidx = g.qidx and a.points > 0 order by a.ms limit 1;
    end if;
  end if;
  if v_phase = 'question' then
    select coalesce(jsonb_agg(jsonb_build_object('seat', t.seat, 'who', t.who, 'answered', t.answered) order by t.seat), '[]'::jsonb) into v_seats from (
      select row_number() over (order by pl.joined_at, pl.student_id) seat, public.lg_disp(st.full_name, coalesce(pv.hidden, false)) who,
        exists (select 1 from public.lg_game_answers a where a.game_id = g.id and a.student_id = pl.student_id and a.qidx = g.qidx) answered
      from public.lg_game_players pl join public.students st on st.id = pl.student_id left join public.lg_privacy pv on pv.student_id = st.id where pl.game_id = g.id) t;
  end if;
  if v_sid is not null then
    select t.seat into v_my from (select student_id, row_number() over (order by joined_at, student_id) seat from public.lg_game_players where game_id = g.id) t where t.student_id = v_sid;
    select jsonb_build_object('who', public.lg_disp(st.full_name, coalesce(pv.hidden, false)), 'predict', b.predict, 'stake', b.stake, 'result', b.result) into v_bet
      from public.lg_game_bets b join public.students st on st.id = b.target left join public.lg_privacy pv on pv.student_id = st.id where b.game_id = g.id and b.bettor = v_sid and b.qidx = g.qidx;
  end if;
  if v_phase = 'reveal' and g.bets_on then
    select coalesce(jsonb_agg(jsonb_build_object('by', x.bywho, 'on', x.on_, 'predict', x.predict, 'stake', x.stake, 'result', x.result) order by abs(coalesce(x.result, 0)) desc), '[]'::jsonb) into v_bets from (
      select public.lg_disp(s1.full_name, coalesce(p1.hidden, false)) bywho, public.lg_disp(s2.full_name, coalesce(p2.hidden, false)) on_, b.predict, b.stake, b.result
      from public.lg_game_bets b join public.students s1 on s1.id = b.bettor left join public.lg_privacy p1 on p1.student_id = s1.id join public.students s2 on s2.id = b.target left join public.lg_privacy p2 on p2.student_id = s2.id
      where b.game_id = g.id and b.qidx = g.qidx order by abs(coalesce(b.result, 0)) desc limit 12) x;
  end if;
  v_gz := jsonb_build_object('blind', g.host_blind, 'bets_on', g.bets_on, 'first', v_first, 'fastest_right', v_fast, 'feed', v_feed, 'seats', v_seats, 'my_seat', v_my, 'bet', v_bet, 'bets', v_bets);
  -- A blind host does not see the question unless they are also playing.
  if g.host_blind and coalesce(p_host, false) and (r -> 'me') = 'null'::jsonb then r := r || jsonb_build_object('question', null); end if;
  return r || jsonb_build_object('gz', v_gz);
end $$;

do $$
declare f text;
begin
  execute 'revoke all on function public.lg_settle_bets(uuid,int) from public, anon, authenticated';
  foreach f in array array['lg_game_create_g(text,text,text,jsonb,int,boolean,boolean)','lg_game_bet(text,text,int,boolean,int)','lg_game_state_g(text,text,boolean)'] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;
