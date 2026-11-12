-- Wise Owl League v4 (UP): anonymous 1-5 star website ratings (comments moderated) and hosts who can play their own game.
create table public.lg_site_ratings (
  device text primary key check (char_length(device) between 16 and 64),
  stars int not null check (stars between 1 and 5),
  name text check (name is null or char_length(name) <= 30),
  body text check (body is null or char_length(body) <= 300),
  shown boolean not null default false,
  ip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.lg_site_ratings enable row level security;
revoke all on public.lg_site_ratings from anon, authenticated;

create or replace function public.lg_site_ratings_public() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'count', (select count(*) from public.lg_site_ratings),
    'avg', (select round(avg(stars)::numeric, 2) from public.lg_site_ratings),
    'dist', (select jsonb_build_array(count(*) filter (where stars = 1), count(*) filter (where stars = 2), count(*) filter (where stars = 3), count(*) filter (where stars = 4), count(*) filter (where stars = 5)) from public.lg_site_ratings),
    'items', coalesce((select jsonb_agg(jsonb_build_object('who', coalesce(nullif(trim(r.name), ''), 'A visitor'), 'stars', r.stars, 'body', r.body, 'at', r.updated_at) order by r.updated_at desc)
      from (select * from public.lg_site_ratings where shown and body is not null order by updated_at desc limit 60) r), '[]'::jsonb)) $$;

create or replace function public.lg_site_rate_mine(p_device text) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('stars', stars, 'name', name, 'body', body, 'shown', shown) from public.lg_site_ratings where device = p_device), 'null'::jsonb) $$;

create or replace function public.lg_site_rate(p_device text, p_stars int, p_name text, p_body text) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ip text := public.lg_client_ip(); v_b text := nullif(trim(coalesce(p_body, '')), ''); v_n text := nullif(trim(coalesce(p_name, '')), ''); v_old public.lg_site_ratings;
begin
  if p_device is null or char_length(p_device) not between 16 and 64 then return public.lg_err('Could not save your rating. Refresh and try again.'); end if;
  if p_stars is null or p_stars not between 1 and 5 then return public.lg_err('Choose 1 to 5 stars.'); end if;
  if v_b is not null and char_length(v_b) > 300 then return public.lg_err('Keep your comment under 300 characters.'); end if;
  if v_b is not null and v_b ~* '(https?://|www\.|\.com\b)' then return public.lg_err('Please do not put links in comments.'); end if;
  if v_n is not null and (char_length(v_n) > 30 or v_n ~* '(https?://|www\.|\.com\b)') then return public.lg_err('Use a short name without links.'); end if;
  select * into v_old from public.lg_site_ratings where device = p_device;
  if not found and (select count(*) from public.lg_site_ratings where ip = v_ip and created_at > now() - interval '1 day') >= 150 then return public.lg_err('Too many ratings from this network today. Try again tomorrow.'); end if;
  insert into public.lg_site_ratings(device, stars, name, body, ip) values (p_device, p_stars, left(v_n, 30), v_b, v_ip)
    on conflict (device) do update set stars = excluded.stars, name = excluded.name, body = excluded.body, updated_at = now(),
      shown = case when excluded.body is not distinct from public.lg_site_ratings.body then public.lg_site_ratings.shown else false end;
  return jsonb_build_object('ok', true, 'pending', v_b is not null);
end $$;

create or replace function public.lg_admin_site_ratings() returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.lg_require_staff();
  return coalesce((select jsonb_agg(jsonb_build_object('device', device, 'who', coalesce(name, 'A visitor'), 'stars', stars, 'body', body, 'shown', shown, 'at', updated_at) order by (not shown) desc, updated_at desc)
    from public.lg_site_ratings where body is not null), '[]'::jsonb);
end $$;

create or replace function public.lg_admin_site_rating_decide(p_device text, p_decision text, p_note text default null) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.lg_require_staff();
  if p_decision not in ('approve', 'hide') then return public.lg_err('Unknown decision.'); end if;
  update public.lg_site_ratings set shown = (p_decision = 'approve') where device = p_device;
  if not found then return public.lg_err('Rating not found.'); end if;
  perform public.lg_audit('LG_SITE_RATING_' || upper(p_decision), 'lg_site_ratings', left(p_device, 8), null, jsonb_build_object('note', p_note));
  return jsonb_build_object('ok', true);
end $$;

-- Hosts may also play their own game.
create or replace function public.lg_game_join(p_pin text, p_code text) returns jsonb language plpgsql security definer set search_path = public as $$
declare g public.lg_games; v_sid uuid;
begin
  select * into g from public.lg_games where pin = trim(coalesce(p_pin, ''));
  if not found then return public.lg_err('No game with that PIN.'); end if;
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  if g.status = 'finished' then return public.lg_err('That game has finished.'); end if;
  if (select count(*) from public.lg_game_players where game_id = g.id) >= 100 then return public.lg_err('This game is full.'); end if;
  insert into public.lg_game_players(game_id, student_id) values (g.id, v_sid) on conflict do nothing;
  return jsonb_build_object('ok', true, 'title', g.title, 'subject', g.subject, 'host', g.host_student = v_sid);
end $$;

create or replace function public.lg_game_state(p_pin text, p_code text, p_host boolean default false) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare g public.lg_games; v_sid uuid; v_phase text; v_left numeric := 0; v_total int; cur jsonb; qj jsonb := null; v_board jsonb; v_me jsonb := null; v_n int; v_names jsonb := '[]'::jsonb; v_ans int;
  p public.lg_game_players; a public.lg_game_answers; v_rank int; v_pts int;
begin
  select * into g from public.lg_games where pin = trim(coalesce(p_pin, ''));
  if not found then return public.lg_err('No game with that PIN.'); end if;
  if coalesce(p_host, false) then
    if not public.lg_game_host_ok(g, p_code) then return public.lg_err('This is not your game.'); end if;
    if g.host_student is not null then
      v_sid := public.lg_resolve(p_code);
      select * into p from public.lg_game_players where game_id = g.id and student_id = v_sid;
      if not found then v_sid := null; end if;
    end if;
  else
    v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
    select * into p from public.lg_game_players where game_id = g.id and student_id = v_sid;
    if not found then return public.lg_err('Join the game first.'); end if;
  end if;
  v_total := jsonb_array_length(g.questions); v_phase := g.status;
  if g.status = 'question' then
    if now() >= g.q_started + make_interval(secs => g.q_secs) then v_phase := 'reveal';
    else v_left := extract(epoch from (g.q_started + make_interval(secs => g.q_secs) - now())); end if;
  end if;
  select count(*) into v_n from public.lg_game_players where game_id = g.id;
  if g.status = 'lobby' then
    select coalesce(jsonb_agg(public.lg_disp(st.full_name, coalesce(pv.hidden, false)) order by pl.joined_at), '[]'::jsonb) into v_names
      from public.lg_game_players pl join public.students st on st.id = pl.student_id left join public.lg_privacy pv on pv.student_id = st.id where pl.game_id = g.id;
  end if;
  select count(*) into v_ans from public.lg_game_answers where game_id = g.id and qidx = g.qidx;
  if g.qidx >= 0 and v_phase in ('question', 'reveal') then
    cur := g.questions -> g.qidx; qj := jsonb_build_object('q', cur -> 'q', 'options', cur -> 'options');
    if v_phase = 'reveal' then
      qj := qj || jsonb_build_object('answer', cur -> 'answer', 'explain', cur -> 'explain', 'dist', (select jsonb_build_array(
        count(*) filter (where choice = 0), count(*) filter (where choice = 1), count(*) filter (where choice = 2), count(*) filter (where choice = 3)) from public.lg_game_answers where game_id = g.id and qidx = g.qidx));
    end if;
  end if;
  if v_phase in ('reveal', 'finished') then
    select coalesce(jsonb_agg(jsonb_build_object('who', t.who, 'score', t.score, 'correct', t.correct, 'rank', t.rk) order by t.rk, t.who), '[]'::jsonb) into v_board from (
      select public.lg_disp(st.full_name, coalesce(pv.hidden, false)) who, pl.score, pl.correct, rank() over (order by pl.score desc) rk
      from public.lg_game_players pl join public.students st on st.id = pl.student_id left join public.lg_privacy pv on pv.student_id = st.id
      where pl.game_id = g.id order by pl.score desc limit 10) t;
  end if;
  if v_sid is not null then
    select 1 + count(*) into v_rank from public.lg_game_players where game_id = g.id and score > p.score;
    select * into a from public.lg_game_answers where game_id = g.id and student_id = v_sid and qidx = g.qidx;
    v_me := jsonb_build_object('score', p.score, 'correct_total', p.correct, 'rank', v_rank, 'answered', a.student_id is not null);
    if v_phase = 'reveal' and a.student_id is not null then v_me := v_me || jsonb_build_object('choice', a.choice, 'right', a.points > 0, 'points', a.points); end if;
    if v_phase = 'finished' then
      select coalesce(sum(l.ip), 0) into v_pts from public.lg_ledger l where l.student_id = v_sid and l.ref = 'game:' || g.id::text;
      v_me := v_me || jsonb_build_object('league_points', v_pts);
    end if;
  end if;
  return jsonb_build_object('ok', true, 'title', g.title, 'subject', g.subject, 'phase', v_phase, 'qidx', g.qidx, 'total', v_total, 'secs', g.q_secs, 'left', round(v_left, 2),
    'players', v_n, 'names', v_names, 'answered', v_ans, 'question', qj, 'board', coalesce(v_board, '[]'::jsonb), 'me', v_me, 'counts', g.counts, 'hosted_by_staff', g.host_staff is not null);
end $$;

do $$
declare f text;
begin
  foreach f in array array['lg_site_ratings_public()','lg_site_rate_mine(text)','lg_site_rate(text,int,text,text)'] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
  foreach f in array array['lg_admin_site_ratings()','lg_admin_site_rating_decide(text,text,text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
