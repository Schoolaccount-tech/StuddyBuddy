-- Wise Owl League v6 (UP): "Start round 2" with the same group, and "Your answers" review. Additive only.
alter table public.lg_games add column if not exists next_pin text;

create or replace function public.lg_game_next(p_pin text) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('ok', true, 'next_pin', (select next_pin from public.lg_games where pin = trim(coalesce(p_pin, '')))) $$;

-- Host starts another round: same title, same questions in a new random order, same players already inside, new PIN.
create or replace function public.lg_game_rematch(p_pin text, p_code text) returns jsonb language plpgsql security definer set search_path = public as $$
declare g public.lg_games; v_pin text; v_try int := 0; v_id uuid; v_q jsonb;
begin
  select * into g from public.lg_games where pin = trim(coalesce(p_pin, '')) for update;
  if not found then return public.lg_err('No game with that PIN.'); end if;
  if not public.lg_game_host_ok(g, p_code) then return public.lg_err('This is not your game.'); end if;
  if g.status <> 'finished' then return public.lg_err('Finish this round first.'); end if;
  if g.next_pin is not null then return jsonb_build_object('ok', true, 'pin', g.next_pin); end if;
  if g.host_student is not null and (select count(*) from public.lg_games where host_student = g.host_student and created_at > now() - interval '1 day') >= 24 then return public.lg_err('You have hosted a lot of games today. Try again tomorrow.'); end if;
  select jsonb_agg(x order by random()) into v_q from jsonb_array_elements(g.questions) x;
  loop
    v_try := v_try + 1; v_pin := lpad(floor(random() * 1000000)::int::text, 6, '0');
    begin
      insert into public.lg_games(pin, season_id, host_student, host_staff, title, subject, questions, q_secs, counts, host_blind, bets_on)
        values (v_pin, public.lg_season(), g.host_student, g.host_staff, g.title, g.subject, v_q, g.q_secs, public.lg_season() is not null, g.host_blind, g.bets_on) returning id into v_id;
      exit;
    exception when unique_violation then if v_try > 10 then return public.lg_err('Could not make a PIN. Try again.'); end if; end;
  end loop;
  insert into public.lg_game_players(game_id, student_id) select v_id, student_id from public.lg_game_players where game_id = g.id on conflict do nothing;
  update public.lg_games set next_pin = v_pin where id = g.id;
  return jsonb_build_object('ok', true, 'pin', v_pin);
end $$;

-- After the game, a player sees every question with their own choice and the right answer.
create or replace function public.lg_game_review(p_pin text, p_code text) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare g public.lg_games; v_sid uuid;
begin
  select * into g from public.lg_games where pin = trim(coalesce(p_pin, ''));
  if not found then return public.lg_err('No game with that PIN.'); end if;
  if g.status <> 'finished' then return public.lg_err('The game is not over yet.'); end if;
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  if not exists (select 1 from public.lg_game_players where game_id = g.id and student_id = v_sid) then return public.lg_err('You did not play this game.'); end if;
  return jsonb_build_object('ok', true, 'subject', g.subject, 'items', coalesce((
    select jsonb_agg(jsonb_build_object('q', x.q ->> 'q', 'options', x.q -> 'options', 'answer', (x.q ->> 'answer')::int, 'explain', x.q ->> 'explain',
      'choice', a.choice, 'points', coalesce(a.points, 0), 'ms', a.ms) order by x.i)
    from (select value q, ord - 1 i from jsonb_array_elements(g.questions) with ordinality t(value, ord)) x
    left join public.lg_game_answers a on a.game_id = g.id and a.student_id = v_sid and a.qidx = x.i), '[]'::jsonb));
end $$;

do $$
declare f text;
begin
  foreach f in array array['lg_game_next(text)','lg_game_rematch(text,text)','lg_game_review(text,text)'] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;
