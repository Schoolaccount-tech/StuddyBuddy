-- Wise Owl League v2 (UP): one-time name claims + Kahoot-style live games. Additive; existing tables untouched.
create table public.lg_claims (
  student_id uuid primary key references public.students(id),
  token_hash text not null unique,
  claimed_ip text,
  claimed_at timestamptz not null default now()
);
create table public.lg_games (
  id uuid primary key default gen_random_uuid(),
  pin text not null unique,
  season_id int references public.lg_seasons(id),
  host_student uuid references public.students(id),
  host_staff uuid,
  title text not null,
  subject text,
  questions jsonb not null,
  status text not null default 'lobby' check (status in ('lobby','question','reveal','finished')),
  qidx int not null default -1,
  q_started timestamptz,
  q_secs int not null default 20 check (q_secs between 5 and 60),
  counts boolean not null default true,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  check ((host_student is not null) <> (host_staff is not null))
);
create table public.lg_game_players (
  game_id uuid not null references public.lg_games(id) on delete cascade,
  student_id uuid not null references public.students(id),
  score int not null default 0,
  correct int not null default 0,
  joined_at timestamptz not null default now(),
  primary key (game_id, student_id)
);
create table public.lg_game_answers (
  game_id uuid not null references public.lg_games(id) on delete cascade,
  student_id uuid not null references public.students(id),
  qidx int not null,
  choice int not null check (choice between 0 and 3),
  ms int not null,
  points int not null,
  primary key (game_id, student_id, qidx)
);
alter table public.lg_claims enable row level security;
alter table public.lg_games enable row level security;
alter table public.lg_game_players enable row level security;
alter table public.lg_game_answers enable row level security;
revoke all on public.lg_claims, public.lg_games, public.lg_game_players, public.lg_game_answers from anon, authenticated;
create trigger lg_audit_claims after insert or delete on public.lg_claims for each row execute function public.log_change();

-- Sign-in: a claim token (set once per student) or the old student code. Only wrong guesses are logged, so live polling stays cheap.
create or replace function public.lg_resolve(p_code text) returns uuid language plpgsql security definer set search_path = public as $$
declare v_ip text; v_sid uuid; v_fails int; v_c text := lower(trim(coalesce(p_code, '')));
begin
  if length(v_c) < 4 then return null; end if;
  select c.student_id into v_sid from public.lg_claims c join public.students s on s.id = c.student_id
    where c.token_hash = encode(sha256(convert_to(v_c, 'utf8')), 'hex') and not s.archived;
  if v_sid is not null then return v_sid; end if;
  v_ip := public.lg_client_ip();
  select count(*) into v_fails from public.lg_attempts a where a.ip = v_ip and not a.ok and a.at > now() - interval '10 minutes';
  if v_fails >= 30 then return null; end if;
  select s.id into v_sid from public.students s where lower(s.student_code) = v_c and not s.archived;
  if v_sid is null then insert into public.lg_attempts(ip, ok) values (v_ip, false); end if;
  if random() < 0.02 then delete from public.lg_attempts where at < now() - interval '1 day'; end if;
  return v_sid;
end $$;

create or replace function public.lg_roster() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', public.lg_disp(s.full_name, false), 'form', f.name) order by s.full_name), '[]'::jsonb)
  from public.students s left join public.forms f on f.id = s.form_id
  where not s.archived and not exists (select 1 from public.lg_claims c where c.student_id = s.id) $$;

create or replace function public.lg_claim(p_student uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.students; v_tok text; v_ip text := public.lg_client_ip(); v_h text;
begin
  select * into s from public.students where id = p_student and not archived;
  if not found then return public.lg_err('Name not found.'); end if;
  if exists (select 1 from public.lg_claims where student_id = p_student) then return public.lg_err('That name is already taken. If this is you on a new phone, ask your teacher to reset it.'); end if;
  if (select count(*) from public.lg_claims where claimed_ip = v_ip and claimed_at > now() - interval '10 minutes') >= 60 then return public.lg_err('Too many sign-ups from this network. Try again in a few minutes.'); end if;
  v_tok := lower(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''));
  insert into public.lg_claims(student_id, token_hash, claimed_ip) values (p_student, encode(sha256(convert_to(v_tok, 'utf8')), 'hex'), v_ip);
  select h.name into v_h from public.houses h where h.id = s.house_id;
  return jsonb_build_object('ok', true, 'token', v_tok, 'name', public.lg_disp(s.full_name, false), 'house', v_h);
exception when unique_violation then return public.lg_err('That name is already taken. Ask your teacher if this is a mistake.'); end $$;

create or replace function public.lg_admin_reset_claim(p_student uuid, p_reason text) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.lg_require_admin();
  if length(trim(coalesce(p_reason, ''))) < 3 then return public.lg_err('Give a reason.'); end if;
  delete from public.lg_claims where student_id = p_student;
  perform public.lg_audit('LG_RESET_CLAIM', 'lg_claims', p_student::text, null, jsonb_build_object('reason', p_reason));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.lg_admin_students() returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.lg_require_admin();
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.full_name, 'form', f.name, 'house_id', s.house_id, 'house', h.name, 'has_code', s.student_code is not null,
      'claimed', exists (select 1 from public.lg_claims c where c.student_id = s.id),
      'points', coalesce((select sum(l.ip) from public.lg_ledger l where l.student_id = s.id), 0)) order by s.full_name)
    from public.students s left join public.forms f on f.id = s.form_id left join public.houses h on h.id = s.house_id where not s.archived), '[]'::jsonb);
end $$;

-- ───────── live games ─────────
create or replace function public.lg_game_host_ok(g public.lg_games, p_code text) returns boolean language sql stable security definer set search_path = public as $$
  select (g.host_staff is not null and auth.uid() = g.host_staff) or (g.host_student is not null and p_code is not null and public.lg_resolve(p_code) = g.host_student) $$;

create or replace function public.lg_game_create(p_code text, p_title text, p_subject text, p_questions jsonb, p_secs int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_sid uuid; v_staff uuid; v_pin text; v_try int := 0; v_clean jsonb; v_id uuid; v_season int := public.lg_season(); q jsonb; i int := 0; v_secs int := least(greatest(coalesce(p_secs, 20), 5), 60);
begin
  if auth.uid() is not null and public.is_staff() then v_staff := auth.uid();
  else
    v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
    if (select count(*) from public.lg_games where host_student = v_sid and created_at > now() - interval '1 day') >= 12 then return public.lg_err('You have hosted a lot of games today. Try again tomorrow.'); end if;
  end if;
  if length(trim(coalesce(p_title, ''))) < 2 then return public.lg_err('Give the game a title.'); end if;
  if jsonb_typeof(p_questions) <> 'array' or jsonb_array_length(p_questions) not between 1 and 30 then return public.lg_err('Add between 1 and 30 questions.'); end if;
  for q in select value from jsonb_array_elements(p_questions) loop
    i := i + 1;
    if length(coalesce(q ->> 'q', '')) < 3 or jsonb_typeof(q -> 'options') <> 'array' or jsonb_array_length(q -> 'options') <> 4 or coalesce((q ->> 'answer')::int, -1) not between 0 and 3 then
      return public.lg_err('Question ' || i || ' needs text, 4 options and one correct answer.'); end if;
  end loop;
  select jsonb_agg(jsonb_build_object('q', left(x ->> 'q', 300), 'options', (select jsonb_agg(left(o, 120)) from jsonb_array_elements_text(x -> 'options') o), 'answer', (x ->> 'answer')::int, 'explain', left(coalesce(x ->> 'explain', ''), 300)) order by ord)
    into v_clean from jsonb_array_elements(p_questions) with ordinality t(x, ord);
  if random() < 0.05 then delete from public.lg_games where created_at < now() - interval '3 days'; end if;
  loop
    v_try := v_try + 1; v_pin := lpad(floor(random() * 1000000)::int::text, 6, '0');
    begin
      insert into public.lg_games(pin, season_id, host_student, host_staff, title, subject, questions, q_secs, counts)
        values (v_pin, v_season, v_sid, v_staff, left(trim(p_title), 80), nullif(left(coalesce(p_subject, ''), 60), ''), v_clean, v_secs, v_season is not null) returning id into v_id;
      exit;
    exception when unique_violation then if v_try > 10 then return public.lg_err('Could not make a PIN. Try again.'); end if; end;
  end loop;
  return jsonb_build_object('ok', true, 'pin', v_pin, 'id', v_id);
end $$;

create or replace function public.lg_game_join(p_pin text, p_code text) returns jsonb language plpgsql security definer set search_path = public as $$
declare g public.lg_games; v_sid uuid;
begin
  select * into g from public.lg_games where pin = trim(coalesce(p_pin, ''));
  if not found then return public.lg_err('No game with that PIN.'); end if;
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  if g.status = 'finished' then return public.lg_err('That game has finished.'); end if;
  if g.host_student = v_sid then return public.lg_err('You are hosting this game.'); end if;
  if (select count(*) from public.lg_game_players where game_id = g.id) >= 100 then return public.lg_err('This game is full.'); end if;
  insert into public.lg_game_players(game_id, student_id) values (g.id, v_sid) on conflict do nothing;
  return jsonb_build_object('ok', true, 'title', g.title, 'subject', g.subject);
end $$;

create or replace function public.lg_game_state(p_pin text, p_code text, p_host boolean default false) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare g public.lg_games; v_sid uuid; v_phase text; v_left numeric := 0; v_total int; cur jsonb; qj jsonb := null; v_board jsonb; v_me jsonb := null; v_n int; v_names jsonb := '[]'::jsonb; v_ans int;
  p public.lg_game_players; a public.lg_game_answers; v_rank int; v_pts int;
begin
  select * into g from public.lg_games where pin = trim(coalesce(p_pin, ''));
  if not found then return public.lg_err('No game with that PIN.'); end if;
  if coalesce(p_host, false) then
    if not public.lg_game_host_ok(g, p_code) then return public.lg_err('This is not your game.'); end if;
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

create or replace function public.lg_game_answer(p_pin text, p_code text, p_choice int) returns jsonb language plpgsql security definer set search_path = public as $$
declare g public.lg_games; v_sid uuid; cur jsonb; v_ms int; v_ok boolean; v_pts int; v_n int;
begin
  if p_choice is null or p_choice not between 0 and 3 then return public.lg_err('Pick one of the four answers.'); end if;
  select * into g from public.lg_games where pin = trim(coalesce(p_pin, ''));
  if not found then return public.lg_err('No game with that PIN.'); end if;
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  if not exists (select 1 from public.lg_game_players where game_id = g.id and student_id = v_sid) then return public.lg_err('Join the game first.'); end if;
  if g.status <> 'question' or now() >= g.q_started + make_interval(secs => g.q_secs) then return public.lg_err('Time is up.'); end if;
  cur := g.questions -> g.qidx;
  v_ms := least(g.q_secs * 1000, floor(extract(epoch from (now() - g.q_started)) * 1000)::int);
  v_ok := p_choice = (cur ->> 'answer')::int;
  v_pts := case when v_ok then 500 + round(500 * (1 - v_ms::numeric / (g.q_secs * 1000)))::int else 0 end;
  insert into public.lg_game_answers(game_id, student_id, qidx, choice, ms, points) values (g.id, v_sid, g.qidx, p_choice, v_ms, v_pts) on conflict do nothing;
  get diagnostics v_n = row_count;
  if v_n = 0 then return public.lg_err('You already answered this question.'); end if;
  update public.lg_game_players set score = score + v_pts, correct = correct + case when v_ok then 1 else 0 end where game_id = g.id and student_id = v_sid;
  return jsonb_build_object('ok', true, 'locked', true);
end $$;

-- Internal: close a game and credit league points once. Staff-hosted games use the competition rules; student-hosted games are practice (needs 3+ players, daily cap).
create or replace function public.lg_game_finish(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare g public.lg_games; r record; v_total int; v_ip int; v_hp int; v_season int := public.lg_season(); v_players int; v_ri int; v_rh int; v_units int;
begin
  select * into g from public.lg_games where id = p_id for update;
  if g.status = 'finished' then return; end if;
  update public.lg_games set status = 'finished', finished_at = now() where id = p_id;
  if not g.counts or v_season is null then return; end if;
  v_total := jsonb_array_length(g.questions); select count(*) into v_players from public.lg_game_players where game_id = p_id;
  for r in select pl.student_id, pl.correct, (select count(*) from public.lg_game_answers x where x.game_id = p_id and x.student_id = pl.student_id) ans from public.lg_game_players pl where pl.game_id = p_id loop
    if g.host_staff is not null then
      v_ip := r.correct * coalesce((select x.ip from public.lg_rules x where x.key = 'event_correct' and x.active), 0) + case when r.ans > 0 then coalesce((select x.ip from public.lg_rules x where x.key = 'event_complete' and x.active), 0) else 0 end
            + case when r.correct = v_total then coalesce((select x.ip from public.lg_rules x where x.key = 'event_perfect' and x.active), 0) else 0 end;
      v_hp := r.correct * coalesce((select x.hp from public.lg_rules x where x.key = 'event_correct' and x.active), 0) + case when r.ans > 0 then coalesce((select x.hp from public.lg_rules x where x.key = 'event_complete' and x.active), 0) else 0 end
            + case when r.correct = v_total then coalesce((select x.hp from public.lg_rules x where x.key = 'event_perfect' and x.active), 0) else 0 end;
      if v_ip > 0 or v_hp > 0 then
        insert into public.lg_ledger(season_id, student_id, source, ref, subject, ip, hp, note) values (v_season, r.student_id, 'event', 'game:' || p_id::text, g.subject, v_ip, v_hp, 'Live game: ' || g.title) on conflict do nothing; end if;
    elsif v_players >= 3 and r.correct > 0 then
      -- Classmate-hosted games: no daily cap, and they do not use up the AI-practice cap. Needs 3+ players; one payment per game.
      select x.ip, x.hp into v_ri, v_rh from public.lg_rules x where x.key = 'practice_quiz' and x.active;
      v_units := least(r.correct, 10);
      v_ip := v_units * coalesce(v_ri, 0); v_hp := v_units * coalesce(v_rh, 0);
      if v_ip > 0 or v_hp > 0 then
        insert into public.lg_ledger(season_id, student_id, source, ref, subject, ip, hp, note) values (v_season, r.student_id, 'event', 'game:' || p_id::text, g.subject, v_ip, v_hp, 'Classmate-hosted game: ' || g.title) on conflict do nothing; end if;
    end if;
  end loop;
end $$;

create or replace function public.lg_game_host(p_pin text, p_code text, p_action text) returns jsonb language plpgsql security definer set search_path = public as $$
declare g public.lg_games; v_total int;
begin
  select * into g from public.lg_games where pin = trim(coalesce(p_pin, '')) for update;
  if not found then return public.lg_err('No game with that PIN.'); end if;
  if not public.lg_game_host_ok(g, p_code) then return public.lg_err('This is not your game.'); end if;
  v_total := jsonb_array_length(g.questions);
  if g.status = 'finished' then return public.lg_err('This game has finished.'); end if;
  case p_action
    when 'start' then
      if g.status <> 'lobby' then return public.lg_err('Already started.'); end if;
      if not exists (select 1 from public.lg_game_players where game_id = g.id) then return public.lg_err('Wait for at least one player to join.'); end if;
      update public.lg_games set status = 'question', qidx = 0, q_started = now() where id = g.id;
    when 'reveal' then
      if g.status = 'question' then update public.lg_games set status = 'reveal' where id = g.id; end if;
    when 'next' then
      if g.status = 'lobby' then return public.lg_err('Start the game first.'); end if;
      if g.qidx + 1 >= v_total then perform public.lg_game_finish(g.id);
      else update public.lg_games set status = 'question', qidx = g.qidx + 1, q_started = now() where id = g.id; end if;
    when 'end' then perform public.lg_game_finish(g.id);
    else return public.lg_err('Unknown action.');
  end case;
  return jsonb_build_object('ok', true);
end $$;

do $$
declare f text;
begin
  foreach f in array array['lg_game_host_ok(public.lg_games,text)','lg_game_finish(uuid)'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
  end loop;
  foreach f in array array['lg_roster()','lg_claim(uuid)','lg_game_create(text,text,text,jsonb,int)','lg_game_join(text,text)','lg_game_state(text,text,boolean)','lg_game_answer(text,text,int)','lg_game_host(text,text,text)'] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
  execute 'revoke all on function public.lg_admin_reset_claim(uuid,text) from public, anon';
  execute 'grant execute on function public.lg_admin_reset_claim(uuid,text) to authenticated';
  execute 'revoke all on function public.lg_resolve(text) from public, anon, authenticated';
end $$;
