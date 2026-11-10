-- Wise Owl League v1 (UP). Additive only: new lg_* tables and functions. No existing table, row or function is changed.
-- Reverse with 20261110_league_v1_down.sql (export the lg_* tables first if you want to keep their data).
-- Houses are the existing public.houses rows (Barn, Verraux, Tawny); students are the existing public.students rows.

-- ───────── tables ─────────
create table public.lg_seasons (
  id serial primary key,
  name text not null check (length(trim(name)) between 2 and 60),
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  status text not null default 'active' check (status in ('active','closed')),
  winner_house int references public.houses(id),
  snapshot jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create unique index lg_one_active_season on public.lg_seasons ((true)) where status = 'active';

create table public.lg_rules (
  key text primary key,
  label text not null,
  ip int not null check (ip >= 0),   -- individual points per unit
  hp int not null check (hp >= 0),   -- house points per unit
  active boolean not null default true
);
insert into public.lg_rules(key, label, ip, hp) values
  ('event_correct',  'Each correct answer in a competition', 2, 2),
  ('event_complete', 'Finishing a competition', 5, 5),
  ('event_perfect',  'Full marks bonus in a competition', 10, 10),
  ('practice_quiz',  'AI practice quiz: each correct answer', 1, 1),
  ('practice_exam',  'AI practice exam question: each mark', 1, 1),
  ('mission',        'Completing a daily revision mission', 5, 5),
  ('streak',         'Studying again today (streak day)', 3, 3),
  ('practice_daily_cap', 'Daily limit on all practice, mission and streak points', 40, 40);

create table public.lg_events (
  id uuid primary key default gen_random_uuid(),
  season_id int not null references public.lg_seasons(id),
  kind text not null check (kind in ('quiz','exam','house_battle','subject','knockout','weekly','monthly')),
  title text not null check (length(trim(title)) between 3 and 80),
  subject text,
  join_code text not null unique check (join_code ~ '^[A-Z0-9]{4,8}$'),
  questions jsonb not null check (jsonb_typeof(questions) = 'array' and jsonb_array_length(questions) between 1 and 40),
  allowed uuid[],
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  auto_approve boolean not null default true,
  status text not null default 'draft' check (status in ('draft','live','closed','published')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  check (closes_at > opens_at)
);

create table public.lg_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.lg_events(id),
  student_id uuid not null references public.students(id),
  score int not null check (score >= 0),
  total int not null check (total > 0),
  answers jsonb not null,
  secs int,
  status text not null default 'pending' check (status in ('pending','approved','disputed','void')),
  note text,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, student_id)
);

create table public.lg_ledger (
  id bigserial primary key,
  season_id int not null references public.lg_seasons(id),
  student_id uuid not null references public.students(id),
  source text not null check (source in ('event','practice','mission','streak','adjustment')),
  ref text not null,
  subject text,
  ip int not null,
  hp int not null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (student_id, source, ref)          -- the same activity can never be paid twice
);
create index lg_ledger_student on public.lg_ledger(student_id, created_at);
create index lg_ledger_time on public.lg_ledger(created_at);

create table public.lg_awards (
  id bigserial primary key,
  season_id int not null references public.lg_seasons(id),
  student_id uuid references public.students(id),
  house_id int references public.houses(id),
  kind text not null check (kind in ('medal','student_of_week','house_of_week','subject_champion','individual_trophy','house_trophy')),
  tier text check (tier in ('gold','silver','bronze')),
  event_id uuid references public.lg_events(id),
  label text not null,
  subject text,
  week_start date,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique nulls not distinct (kind, season_id, student_id, house_id, event_id, subject, week_start)
);

create table public.lg_privacy (
  student_id uuid primary key references public.students(id),
  hidden boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.lg_attempts (
  id bigserial primary key,
  ip text not null,
  ok boolean not null,
  at timestamptz not null default now()
);
create index lg_attempts_ip on public.lg_attempts(ip, at);

-- Lock every table: no direct access for anyone. All reads and writes go through the functions below.
alter table public.lg_seasons enable row level security;
alter table public.lg_rules enable row level security;
alter table public.lg_events enable row level security;
alter table public.lg_results enable row level security;
alter table public.lg_ledger enable row level security;
alter table public.lg_awards enable row level security;
alter table public.lg_privacy enable row level security;
alter table public.lg_attempts enable row level security;
revoke all on public.lg_seasons, public.lg_rules, public.lg_events, public.lg_results, public.lg_ledger, public.lg_awards, public.lg_privacy, public.lg_attempts from anon, authenticated;

-- The ledger and awards can only ever be added to. A mistake is fixed by posting a correction, never by editing history.
create or replace function public.lg_immutable() returns trigger language plpgsql as $$
begin raise exception 'The points ledger and awards are append-only. Post a correction instead.'; end $$;
create trigger lg_ledger_immutable before update or delete on public.lg_ledger for each row execute function public.lg_immutable();
create trigger lg_awards_immutable before update or delete on public.lg_awards for each row execute function public.lg_immutable();

-- Reuse the existing audit trail (public.audit_log) for everything staff can change.
create trigger lg_audit_seasons after insert or update or delete on public.lg_seasons for each row execute function public.log_change();
create trigger lg_audit_events  after insert or update or delete on public.lg_events  for each row execute function public.log_change();
create trigger lg_audit_results after insert or update or delete on public.lg_results for each row execute function public.log_change();
create trigger lg_audit_awards  after insert on public.lg_awards for each row execute function public.log_change();

-- ───────── helpers ─────────
create or replace function public.lg_disp(p_name text, p_hidden boolean) returns text language sql immutable as $$
  select case when coalesce(p_hidden, false) then 'Anonymous owl'
    else split_part(trim(p_name), ' ', 1) || coalesce(' ' || left(nullif(split_part(trim(p_name), ' ', 2), ''), 1) || '.', '') end $$;

create or replace function public.lg_day(p_ts timestamptz default now()) returns date language sql stable as $$
  select (p_ts at time zone 'Africa/Harare')::date $$;

create or replace function public.lg_period_start(p text) returns timestamptz language sql stable as $$
  select case p
    when 'week'   then date_trunc('week',  now() at time zone 'Africa/Harare') at time zone 'Africa/Harare'
    when 'month'  then date_trunc('month', now() at time zone 'Africa/Harare') at time zone 'Africa/Harare'
    when 'season' then coalesce((select s.starts_on::timestamp at time zone 'Africa/Harare' from public.lg_seasons s where s.status = 'active'), 'infinity'::timestamptz)
    else '-infinity'::timestamptz end $$;

create or replace function public.lg_season() returns int language sql stable as $$
  select id from public.lg_seasons where status = 'active' $$;

create or replace function public.lg_client_ip() returns text language plpgsql stable as $$
declare h text;
begin
  h := current_setting('request.headers', true);
  if h is null or h = '' then return 'local'; end if;
  return coalesce(nullif(split_part(coalesce((h::jsonb) ->> 'x-forwarded-for', ''), ',', 1), ''), 'unknown');
exception when others then return 'unknown'; end $$;

-- Student code check with brute-force throttle. Returns null (never raises, so the attempt is still recorded).
create or replace function public.lg_resolve(p_code text) returns uuid language plpgsql security definer set search_path = public as $$
declare v_ip text := public.lg_client_ip(); v_sid uuid; v_fails int; v_c text := lower(trim(coalesce(p_code, '')));
begin
  select count(*) into v_fails from public.lg_attempts a where a.ip = v_ip and not a.ok and a.at > now() - interval '10 minutes';
  if v_fails >= 30 then return null; end if;
  select s.id into v_sid from public.students s where length(v_c) >= 4 and lower(s.student_code) = v_c and not s.archived;
  insert into public.lg_attempts(ip, ok) values (v_ip, v_sid is not null);
  if random() < 0.02 then delete from public.lg_attempts where at < now() - interval '1 day'; end if;
  return v_sid;
end $$;

create or replace function public.lg_err(p_msg text) returns jsonb language sql immutable as $$
  select jsonb_build_object('ok', false, 'error', p_msg) $$;
create or replace function public.lg_bad_code() returns jsonb language sql immutable as $$
  select public.lg_err('That student code was not recognised, or there were too many wrong tries. Check it and try again in a few minutes.') $$;

create or replace function public.lg_audit(p_action text, p_table text, p_row text, p_old jsonb, p_new jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.audit_log(staff_id, action, table_name, row_id, old_data, new_data) values (auth.uid(), p_action, p_table, p_row, p_old, p_new) $$;

create or replace function public.lg_require_admin() returns void language plpgsql security definer set search_path = public as $$
begin if not public.is_admin() then raise exception 'Admins only.'; end if; end $$;
create or replace function public.lg_require_staff() returns void language plpgsql security definer set search_path = public as $$
begin if not public.is_staff() then raise exception 'Staff only.'; end if; end $$;

-- Turn an approved competition result into ledger points (idempotent).
create or replace function public.lg_credit_result(p_result uuid) returns void language plpgsql security definer set search_path = public as $$
declare r public.lg_results; e public.lg_events; v_ip int; v_hp int;
begin
  select * into r from public.lg_results where id = p_result;
  select * into e from public.lg_events where id = r.event_id;
  v_ip := r.score * coalesce((select x.ip from public.lg_rules x where x.key = 'event_correct' and x.active), 0)
        + coalesce((select x.ip from public.lg_rules x where x.key = 'event_complete' and x.active), 0)
        + case when r.score = r.total then coalesce((select x.ip from public.lg_rules x where x.key = 'event_perfect' and x.active), 0) else 0 end;
  v_hp := r.score * coalesce((select x.hp from public.lg_rules x where x.key = 'event_correct' and x.active), 0)
        + coalesce((select x.hp from public.lg_rules x where x.key = 'event_complete' and x.active), 0)
        + case when r.score = r.total then coalesce((select x.hp from public.lg_rules x where x.key = 'event_perfect' and x.active), 0) else 0 end;
  insert into public.lg_ledger(season_id, student_id, source, ref, subject, ip, hp, note, created_by)
    values (e.season_id, r.student_id, 'event', r.id::text, e.subject, v_ip, v_hp, e.title, auth.uid())
    on conflict (student_id, source, ref) do nothing;
  update public.lg_results set status = 'approved', decided_at = now(), decided_by = auth.uid() where id = p_result;
end $$;

-- ───────── student functions (code-based, graded here, never in the browser) ─────────
create or replace function public.lg_events_public() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('title', e.title, 'kind', e.kind, 'subject', e.subject, 'opens_at', e.opens_at, 'closes_at', e.closes_at,
    'phase', case when now() < e.opens_at then 'upcoming' when now() <= e.closes_at then 'open' else 'ended' end, 'restricted', e.allowed is not null) order by e.opens_at), '[]'::jsonb)
  from public.lg_events e where e.status = 'live' and e.closes_at > now() - interval '1 day' $$;

create or replace function public.lg_event_questions(p_code text, p_join text) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_sid uuid; e public.lg_events;
begin
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  select * into e from public.lg_events where join_code = upper(trim(coalesce(p_join, '')));
  if not found then return public.lg_err('That competition code was not recognised.'); end if;
  if e.status <> 'live' or now() < e.opens_at or now() > e.closes_at then return public.lg_err('This competition is not open right now.'); end if;
  if e.allowed is not null and not (v_sid = any(e.allowed)) then return public.lg_err('This round is only for students who qualified.'); end if;
  if exists (select 1 from public.lg_results r where r.event_id = e.id and r.student_id = v_sid) then return public.lg_err('You have already played this competition.'); end if;
  return jsonb_build_object('ok', true, 'title', e.title, 'kind', e.kind, 'subject', e.subject, 'closes_at', e.closes_at,
    'questions', (select jsonb_agg(jsonb_build_object('q', t.x ->> 'q', 'options', t.x -> 'options') order by t.o) from jsonb_array_elements(e.questions) with ordinality as t(x, o)));
end $$;

create or replace function public.lg_submit_event(p_code text, p_join text, p_answers int[], p_secs int default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_sid uuid; e public.lg_events; n int; o int := 0; x jsonb; mine int; sc int := 0; ans jsonb := '[]'::jsonb; rid uuid; v_pts int;
begin
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  select * into e from public.lg_events where join_code = upper(trim(coalesce(p_join, '')));
  if not found then return public.lg_err('That competition code was not recognised.'); end if;
  if e.status <> 'live' or now() < e.opens_at or now() > e.closes_at then return public.lg_err('This competition is not open right now.'); end if;
  if e.allowed is not null and not (v_sid = any(e.allowed)) then return public.lg_err('This round is only for students who qualified.'); end if;
  n := jsonb_array_length(e.questions);
  if p_answers is null or coalesce(array_length(p_answers, 1), 0) <> n then return public.lg_err('Answer every question.'); end if;
  for x in select t.x from jsonb_array_elements(e.questions) with ordinality as t(x, o) order by t.o loop
    o := o + 1; mine := p_answers[o]; if mine is null or mine < 0 or mine > 3 then mine := -1; end if;
    if mine = (x ->> 'answer')::int then sc := sc + 1; end if;
    ans := ans || to_jsonb(mine);
  end loop;
  begin
    insert into public.lg_results(event_id, student_id, score, total, answers, secs) values (e.id, v_sid, sc, n, ans, least(greatest(coalesce(p_secs, 0), 0), 86400)) returning id into rid;
  exception when unique_violation then return public.lg_err('You have already played this competition.'); end;
  if e.auto_approve then perform public.lg_credit_result(rid); end if;
  select l.ip into v_pts from public.lg_ledger l where l.student_id = v_sid and l.source = 'event' and l.ref = rid::text;
  return jsonb_build_object('ok', true, 'result', rid, 'score', sc, 'total', n, 'points', coalesce(v_pts, 0), 'status', case when e.auto_approve then 'approved' else 'pending' end);
end $$;

create or replace function public.lg_event_review(p_code text, p_join text) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_sid uuid; e public.lg_events; r public.lg_results;
begin
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  select * into e from public.lg_events where join_code = upper(trim(coalesce(p_join, '')));
  if not found then return public.lg_err('That competition code was not recognised.'); end if;
  if e.status = 'live' and now() <= e.closes_at then return public.lg_err('Answers are shown after the competition closes.'); end if;
  select * into r from public.lg_results where event_id = e.id and student_id = v_sid;
  if not found then return public.lg_err('You did not play this competition.'); end if;
  return jsonb_build_object('ok', true, 'score', r.score, 'total', r.total, 'review', (
    select jsonb_agg(jsonb_build_object('q', t.x ->> 'q', 'options', t.x -> 'options', 'answer', (t.x ->> 'answer')::int, 'explain', t.x ->> 'explain', 'mine', (r.answers ->> (t.o::int - 1))::int) order by t.o)
    from jsonb_array_elements(e.questions) with ordinality as t(x, o)));
end $$;

-- AI practice, missions and streaks. Reported by the browser, so they are capped per day and flagged as "practice" in the ledger.
create or replace function public.lg_report_practice(p_code text, p_kind text, p_units int, p_subject text, p_ref text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_sid uuid; v_season int := public.lg_season(); v_key text; v_src text; v_max int; v_units int; v_cap_i int; v_cap_h int; v_used_i int; v_used_h int; v_n int;
  v_ri int; v_rh int; v_pi int; v_ph int; v_id bigint;
begin
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  if v_season is null then return public.lg_err('There is no active season right now.'); end if;
  if p_ref is null or length(p_ref) < 3 or length(p_ref) > 80 then return public.lg_err('Bad reference.'); end if;
  case p_kind
    when 'quiz' then v_key := 'practice_quiz'; v_src := 'practice'; v_max := 10;
    when 'exam' then v_key := 'practice_exam'; v_src := 'practice'; v_max := 8;
    when 'mission' then v_key := 'mission'; v_src := 'mission'; v_max := 1;
    when 'streak' then v_key := 'streak'; v_src := 'streak'; v_max := 1;
    else return public.lg_err('Unknown activity.');
  end case;
  v_units := least(greatest(coalesce(p_units, 0), 0), v_max);
  if v_units = 0 then return jsonb_build_object('ok', true, 'points', 0, 'house_points', 0); end if;
  select count(*) into v_n from public.lg_ledger l where l.student_id = v_sid and l.source in ('practice','mission','streak') and public.lg_day(l.created_at) = public.lg_day();
  if v_n >= 30 then return jsonb_build_object('ok', true, 'points', 0, 'house_points', 0, 'capped', true); end if;
  select x.ip, x.hp into v_ri, v_rh from public.lg_rules x where x.key = v_key and x.active;
  if v_ri is null then return jsonb_build_object('ok', true, 'points', 0, 'house_points', 0); end if;
  select x.ip, x.hp into v_cap_i, v_cap_h from public.lg_rules x where x.key = 'practice_daily_cap' and x.active;
  select coalesce(sum(l.ip), 0), coalesce(sum(l.hp), 0) into v_used_i, v_used_h from public.lg_ledger l
    where l.student_id = v_sid and l.source in ('practice','mission','streak') and l.ip > 0 and public.lg_day(l.created_at) = public.lg_day();
  v_pi := least(v_units * v_ri, greatest(coalesce(v_cap_i, 0) - v_used_i, 0));
  v_ph := least(v_units * v_rh, greatest(coalesce(v_cap_h, 0) - v_used_h, 0));
  insert into public.lg_ledger(season_id, student_id, source, ref, subject, ip, hp, note)
    values (v_season, v_sid, v_src, p_ref, nullif(left(coalesce(p_subject, ''), 60), ''), v_pi, v_ph, 'Practice: ' || p_kind)
    on conflict (student_id, source, ref) do nothing returning id into v_id;
  if v_id is null then return jsonb_build_object('ok', true, 'points', 0, 'house_points', 0, 'duplicate', true); end if;
  return jsonb_build_object('ok', true, 'points', v_pi, 'house_points', v_ph, 'capped', v_pi < v_units * v_ri);
end $$;

create or replace function public.lg_dispute(p_code text, p_result uuid, p_note text) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_sid uuid;
begin
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  update public.lg_results set status = 'disputed', note = left(coalesce(p_note, ''), 300) where id = p_result and student_id = v_sid and status in ('pending','approved');
  if not found then return public.lg_err('That result cannot be disputed.'); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.lg_set_hidden(p_code text, p_hidden boolean) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_sid uuid;
begin
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  insert into public.lg_privacy(student_id, hidden) values (v_sid, coalesce(p_hidden, false))
    on conflict (student_id) do update set hidden = excluded.hidden, updated_at = now();
  return jsonb_build_object('ok', true, 'hidden', coalesce(p_hidden, false));
end $$;

create or replace function public.lg_me(p_code text) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_sid uuid; s public.students; v_hidden boolean; v_season int := public.lg_season(); v_rank int; v_of int; v_out jsonb;
begin
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  select * into s from public.students where id = v_sid;
  select coalesce(p.hidden, false) into v_hidden from (select 1) d left join public.lg_privacy p on p.student_id = v_sid;
  select t.rk, t.n into v_rank, v_of from (
    select l.student_id, rank() over (order by sum(l.ip) desc) rk, count(*) over () n from public.lg_ledger l
    where l.created_at >= public.lg_period_start('season') group by l.student_id having sum(l.ip) > 0) t where t.student_id = v_sid;
  v_out := jsonb_build_object('ok', true,
    'name', public.lg_disp(s.full_name, false), 'house', (select h.name from public.houses h where h.id = s.house_id), 'hidden', v_hidden,
    'season', (select x.name from public.lg_seasons x where x.id = v_season),
    'points', jsonb_build_object(
      'week',   coalesce((select sum(l.ip) from public.lg_ledger l where l.student_id = v_sid and l.created_at >= public.lg_period_start('week')), 0),
      'month',  coalesce((select sum(l.ip) from public.lg_ledger l where l.student_id = v_sid and l.created_at >= public.lg_period_start('month')), 0),
      'season', coalesce((select sum(l.ip) from public.lg_ledger l where l.student_id = v_sid and l.created_at >= public.lg_period_start('season')), 0),
      'all',    coalesce((select sum(l.ip) from public.lg_ledger l where l.student_id = v_sid), 0)),
    'rank', v_rank, 'ranked', v_of,
    'events', jsonb_build_object(
      'played', (select count(*) from public.lg_results r where r.student_id = v_sid and r.status = 'approved'),
      'avg', (select round(avg(r.score::numeric / r.total * 100)) from public.lg_results r where r.student_id = v_sid and r.status = 'approved'),
      'perfect', (select count(*) from public.lg_results r where r.student_id = v_sid and r.status = 'approved' and r.score = r.total)),
    'subjects', coalesce((select jsonb_agg(jsonb_build_object('subject', q.subject, 'points', q.pts) order by q.pts desc) from (
      select l.subject, sum(l.ip) pts from public.lg_ledger l where l.student_id = v_sid and l.subject is not null group by l.subject having sum(l.ip) > 0) q), '[]'::jsonb),
    'medals', jsonb_build_object(
      'gold', (select count(*) from public.lg_awards a where a.student_id = v_sid and a.kind = 'medal' and a.tier = 'gold'),
      'silver', (select count(*) from public.lg_awards a where a.student_id = v_sid and a.kind = 'medal' and a.tier = 'silver'),
      'bronze', (select count(*) from public.lg_awards a where a.student_id = v_sid and a.kind = 'medal' and a.tier = 'bronze')),
    'awards', coalesce((select jsonb_agg(jsonb_build_object('kind', a.kind, 'tier', a.tier, 'label', a.label) order by a.created_at desc) from public.lg_awards a where a.student_id = v_sid and a.kind <> 'medal'), '[]'::jsonb),
    'recent', coalesce((select jsonb_agg(jsonb_build_object('note', q.note, 'ip', q.ip, 'source', q.source, 'at', q.created_at) order by q.created_at desc) from (
      select l.note, l.ip, l.source, l.created_at from public.lg_ledger l where l.student_id = v_sid order by l.created_at desc limit 8) q), '[]'::jsonb),
    'practice_today', coalesce((select sum(l.ip) from public.lg_ledger l where l.student_id = v_sid and l.source in ('practice','mission','streak') and l.ip > 0 and public.lg_day(l.created_at) = public.lg_day()), 0),
    'practice_cap', coalesce((select x.ip from public.lg_rules x where x.key = 'practice_daily_cap'), 0),
    'results', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'title', q.title, 'score', q.score, 'total', q.total, 'status', q.status) order by q.created_at desc) from (
      select r.id, e.title, r.score, r.total, r.status, r.created_at from public.lg_results r join public.lg_events e on e.id = r.event_id where r.student_id = v_sid order by r.created_at desc limit 6) q), '[]'::jsonb));
  return v_out;
end $$;

-- ───────── public boards (names shown as "First L." and can be hidden by the student) ─────────
create or replace function public.lg_board(p_period text, p_subject text default null) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('rank', t.rk, 'who', t.who, 'house', t.house, 'points', t.pts, 'gold', t.g, 'silver', t.s, 'bronze', t.b) order by t.rk, t.who), '[]'::jsonb) from (
    select rank() over (order by sum(l.ip) desc) rk, public.lg_disp(st.full_name, coalesce(pv.hidden, false)) who, h.name house, sum(l.ip) pts,
      (select count(*) from public.lg_awards a where a.student_id = st.id and a.kind = 'medal' and a.tier = 'gold') g,
      (select count(*) from public.lg_awards a where a.student_id = st.id and a.kind = 'medal' and a.tier = 'silver') s,
      (select count(*) from public.lg_awards a where a.student_id = st.id and a.kind = 'medal' and a.tier = 'bronze') b
    from public.lg_ledger l join public.students st on st.id = l.student_id and not st.archived
      left join public.houses h on h.id = st.house_id left join public.lg_privacy pv on pv.student_id = st.id
    where l.created_at >= public.lg_period_start(p_period) and (nullif(p_subject, '') is null or l.subject = p_subject)
    group by st.id, st.full_name, h.name, pv.hidden having sum(l.ip) > 0 order by sum(l.ip) desc limit 50) t $$;

create or replace function public.lg_house_board(p_period text) returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('house', t.name, 'colour', t.colour, 'points', t.pts, 'players', t.players, 'students', t.students) order by t.pts desc, t.name), '[]'::jsonb) from (
    select h.name, h.colour, coalesce(sum(l.hp), 0) pts, count(distinct l.student_id) players,
      (select count(*) from public.students x where x.house_id = h.id and not x.archived) students
    from public.houses h left join public.students st on st.house_id = h.id and not st.archived
      left join public.lg_ledger l on l.student_id = st.id and l.created_at >= public.lg_period_start(p_period)
    group by h.id, h.name, h.colour) t $$;

create or replace function public.lg_subjects() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(q.subject order by q.subject), '[]'::jsonb) from (select distinct l.subject from public.lg_ledger l where l.subject is not null) q $$;

create or replace function public.lg_trophies() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('kind', q.kind, 'tier', q.tier, 'label', q.label, 'who', q.who, 'house', q.house, 'subject', q.subject, 'week', q.week_start, 'season', q.season) order by q.created_at desc), '[]'::jsonb) from (
    select a.kind, a.tier, a.label, a.subject, a.week_start, a.created_at, sn.name season,
      case when a.student_id is null then null else public.lg_disp(st.full_name, coalesce(pv.hidden, false)) end who,
      coalesce(h.name, (select h2.name from public.houses h2 where h2.id = st.house_id)) house
    from public.lg_awards a join public.lg_seasons sn on sn.id = a.season_id
      left join public.students st on st.id = a.student_id left join public.lg_privacy pv on pv.student_id = a.student_id
      left join public.houses h on h.id = a.house_id
    where a.kind <> 'medal' order by a.created_at desc limit 60) q $$;

create or replace function public.lg_hall() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('season', s.name, 'ended', s.closed_at, 'winner', (select h.name from public.houses h where h.id = s.winner_house), 'snapshot', s.snapshot) order by s.closed_at desc), '[]'::jsonb)
  from public.lg_seasons s where s.status = 'closed' $$;

create or replace function public.lg_rules_public() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('key', r.key, 'label', r.label, 'ip', r.ip, 'hp', r.hp, 'active', r.active) order by r.key), '[]'::jsonb) from public.lg_rules r $$;

create or replace function public.lg_season_public() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('name', s.name, 'starts_on', s.starts_on, 'ends_on', s.ends_on) from public.lg_seasons s where s.status = 'active'), 'null'::jsonb) $$;

-- ───────── staff and admin functions ─────────
create or replace function public.lg_admin_overview() returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.lg_require_staff();
  return jsonb_build_object(
    'admin', public.is_admin(),
    'season', (select to_jsonb(s) - 'snapshot' from public.lg_seasons s where s.status = 'active'),
    'seasons', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'status', s.status, 'starts_on', s.starts_on, 'ends_on', s.ends_on) order by s.id desc) from public.lg_seasons s), '[]'::jsonb),
    'rules', coalesce((select jsonb_agg(to_jsonb(r) order by r.key) from public.lg_rules r), '[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'kind', e.kind, 'title', e.title, 'subject', e.subject, 'join_code', e.join_code, 'status', e.status,
      'opens_at', e.opens_at, 'closes_at', e.closes_at, 'auto_approve', e.auto_approve, 'questions', jsonb_array_length(e.questions), 'restricted', e.allowed is not null,
      'played', (select count(*) from public.lg_results r where r.event_id = e.id)) order by e.created_at desc) from public.lg_events e), '[]'::jsonb),
    'pending', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'who', st.full_name, 'event', e.title, 'score', r.score, 'total', r.total, 'status', r.status, 'note', r.note, 'at', r.created_at) order by r.created_at)
      from public.lg_results r join public.students st on st.id = r.student_id join public.lg_events e on e.id = r.event_id where r.status in ('pending','disputed')), '[]'::jsonb),
    'audit', coalesce((select jsonb_agg(to_jsonb(a) order by a.at desc) from (select at, action, table_name, row_id from public.audit_log
      where table_name like 'lg\_%' or action like 'LG\_%' order by at desc limit 40) a), '[]'::jsonb),
    'counts', jsonb_build_object('students', (select count(*) from public.students where not archived),
      'no_house', (select count(*) from public.students where not archived and house_id is null),
      'no_code', (select count(*) from public.students where not archived and student_code is null)));
end $$;

create or replace function public.lg_admin_students() returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.lg_require_admin();
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.full_name, 'form', f.name, 'house_id', s.house_id, 'house', h.name, 'has_code', s.student_code is not null,
      'points', coalesce((select sum(l.ip) from public.lg_ledger l where l.student_id = s.id), 0)) order by s.full_name)
    from public.students s left join public.forms f on f.id = s.form_id left join public.houses h on h.id = s.house_id where not s.archived), '[]'::jsonb);
end $$;

create or replace function public.lg_admin_set_house(p_student uuid, p_house int, p_reason text) returns jsonb language plpgsql security definer set search_path = public as $$
declare s public.students;
begin
  perform public.lg_require_admin();
  if length(trim(coalesce(p_reason, ''))) < 5 then return public.lg_err('Give a reason (at least 5 letters).'); end if;
  if not exists (select 1 from public.houses where id = p_house) then return public.lg_err('Unknown house.'); end if;
  select * into s from public.students where id = p_student; if not found then return public.lg_err('Unknown student.'); end if;
  perform public.lg_audit('LG_SET_HOUSE', 'students', p_student::text, jsonb_build_object('house_id', s.house_id), jsonb_build_object('house_id', p_house, 'reason', trim(p_reason)));
  update public.students set house_id = p_house where id = p_student;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.lg_admin_start_season(p_name text, p_starts date, p_ends date) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id int;
begin
  perform public.lg_require_admin();
  if public.lg_season() is not null then return public.lg_err('A season is already running. End it first.'); end if;
  if p_ends < p_starts then return public.lg_err('The end date is before the start date.'); end if;
  insert into public.lg_seasons(name, starts_on, ends_on) values (trim(p_name), p_starts, p_ends) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

create or replace function public.lg_admin_close_season() returns jsonb language plpgsql security definer set search_path = public as $$
declare v_s public.lg_seasons; v_houses jsonb; v_top jsonb; v_win int; v_tie boolean := false; v_p1 bigint; v_p2 bigint; v_r record;
begin
  perform public.lg_require_admin();
  select * into v_s from public.lg_seasons where status = 'active'; if not found then return public.lg_err('There is no active season.'); end if;
  if exists (select 1 from public.lg_events e where e.season_id = v_s.id and e.status in ('live','closed')) then return public.lg_err('Publish or finish every competition first.'); end if;
  if exists (select 1 from public.lg_results r join public.lg_events e on e.id = r.event_id where e.season_id = v_s.id and r.status in ('pending','disputed')) then return public.lg_err('Decide every pending or disputed result first.'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('house', t.name, 'points', t.pts, 'players', t.players) order by t.pts desc, t.name), '[]'::jsonb) into v_houses from (
    select h.name, coalesce(sum(l.hp), 0) pts, count(distinct l.student_id) players from public.houses h
      left join public.students st on st.house_id = h.id and not st.archived left join public.lg_ledger l on l.student_id = st.id and l.season_id = v_s.id group by h.id, h.name) t;
  select coalesce(jsonb_agg(jsonb_build_object('rank', q.rk, 'who', q.who, 'house', q.house, 'points', q.pts) order by q.rk, q.who), '[]'::jsonb) into v_top from (
    select rank() over (order by sum(l.ip) desc) rk, public.lg_disp(st.full_name, coalesce(pv.hidden, false)) who, h.name house, sum(l.ip) pts
    from public.lg_ledger l join public.students st on st.id = l.student_id left join public.houses h on h.id = st.house_id left join public.lg_privacy pv on pv.student_id = st.id
    where l.season_id = v_s.id group by st.id, st.full_name, h.name, pv.hidden having sum(l.ip) > 0 order by sum(l.ip) desc limit 10) q;
  v_p1 := (v_houses -> 0 ->> 'points')::bigint; v_p2 := (v_houses -> 1 ->> 'points')::bigint;
  if v_p1 > 0 and (v_p2 is null or v_p1 > v_p2) then select h.id into v_win from public.houses h where h.name = v_houses -> 0 ->> 'house'; elsif v_p1 > 0 then v_tie := true; end if;
  if v_win is not null then
    insert into public.lg_awards(season_id, house_id, kind, label) values (v_s.id, v_win, 'house_trophy', 'House Champions: ' || v_s.name) on conflict do nothing;
  end if;
  for v_r in select st.id, sum(l.ip) pts from public.lg_ledger l join public.students st on st.id = l.student_id where l.season_id = v_s.id and not st.archived group by st.id having sum(l.ip) > 0 order by sum(l.ip) desc limit 1 loop
    insert into public.lg_awards(season_id, student_id, kind, label) values (v_s.id, v_r.id, 'individual_trophy', 'Individual Champion: ' || v_s.name) on conflict do nothing;
  end loop;
  for v_r in select distinct on (l.subject) l.subject, l.student_id, sum(l.ip) pts from public.lg_ledger l join public.students st on st.id = l.student_id and not st.archived
      where l.season_id = v_s.id and l.subject is not null group by l.subject, l.student_id having sum(l.ip) > 0 order by l.subject, sum(l.ip) desc loop
    insert into public.lg_awards(season_id, student_id, kind, label, subject) values (v_s.id, v_r.student_id, 'subject_champion', v_r.subject || ' Champion: ' || v_s.name, v_r.subject) on conflict do nothing;
  end loop;
  update public.lg_seasons set status = 'closed', closed_at = now(), winner_house = v_win, snapshot = jsonb_build_object('houses', v_houses, 'top', v_top, 'tie', v_tie) where id = v_s.id;
  return jsonb_build_object('ok', true, 'winner', (select name from public.houses where id = v_win), 'tie', v_tie);
end $$;

create or replace function public.lg_admin_save_event(p_event jsonb) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid := nullif(p_event ->> 'id', '')::uuid; v_season int := public.lg_season(); v_code text := upper(trim(coalesce(p_event ->> 'join_code', ''))); q jsonb; v_old public.lg_events; i int := 0;
begin
  perform public.lg_require_staff();
  if v_season is null then return public.lg_err('Start a season first.'); end if;
  if jsonb_typeof(p_event -> 'questions') <> 'array' or jsonb_array_length(p_event -> 'questions') not between 1 and 40 then return public.lg_err('Add between 1 and 40 questions.'); end if;
  for q in select value from jsonb_array_elements(p_event -> 'questions') loop
    i := i + 1;
    if length(coalesce(q ->> 'q', '')) < 3 or jsonb_typeof(q -> 'options') <> 'array' or jsonb_array_length(q -> 'options') <> 4
       or coalesce((q ->> 'answer')::int, -1) not between 0 and 3 then return public.lg_err('Question ' || i || ' needs text, 4 options and an answer 0 to 3.'); end if;
  end loop;
  if v_code = '' then v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)); end if;
  if v_id is null then
    insert into public.lg_events(season_id, kind, title, subject, join_code, questions, allowed, opens_at, closes_at, auto_approve)
    values (v_season, p_event ->> 'kind', trim(p_event ->> 'title'), nullif(trim(coalesce(p_event ->> 'subject', '')), ''), v_code, p_event -> 'questions',
      case when jsonb_typeof(p_event -> 'allowed') = 'array' then (select array_agg(x::uuid) from jsonb_array_elements_text(p_event -> 'allowed') x) end,
      (p_event ->> 'opens_at')::timestamptz, (p_event ->> 'closes_at')::timestamptz, coalesce((p_event ->> 'auto_approve')::boolean, true)) returning id into v_id;
  else
    select * into v_old from public.lg_events where id = v_id; if not found then return public.lg_err('Unknown competition.'); end if;
    if v_old.status <> 'draft' and (exists (select 1 from public.lg_results r where r.event_id = v_id)) then return public.lg_err('Players have already taken part, so the questions are locked.'); end if;
    update public.lg_events set kind = p_event ->> 'kind', title = trim(p_event ->> 'title'), subject = nullif(trim(coalesce(p_event ->> 'subject', '')), ''), questions = p_event -> 'questions',
      opens_at = (p_event ->> 'opens_at')::timestamptz, closes_at = (p_event ->> 'closes_at')::timestamptz, auto_approve = coalesce((p_event ->> 'auto_approve')::boolean, true) where id = v_id;
  end if;
  return jsonb_build_object('ok', true, 'id', v_id, 'join_code', (select join_code from public.lg_events where id = v_id));
exception when unique_violation then return public.lg_err('That join code is already used. Leave it blank for a new one.');
         when check_violation then return public.lg_err('Check the kind, title and dates (closing must be after opening).'); end $$;

create or replace function public.lg_admin_event_status(p_id uuid, p_status text) returns jsonb language plpgsql security definer set search_path = public as $$
declare e public.lg_events;
begin
  perform public.lg_require_staff();
  select * into e from public.lg_events where id = p_id; if not found then return public.lg_err('Unknown competition.'); end if;
  if not ((e.status = 'draft' and p_status = 'live') or (e.status = 'live' and p_status = 'closed') or (e.status = 'live' and p_status = 'draft' and not exists (select 1 from public.lg_results r where r.event_id = p_id))) then
    return public.lg_err('That change is not allowed from ' || e.status || '.'); end if;
  update public.lg_events set status = p_status where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.lg_admin_decide_result(p_result uuid, p_decision text, p_note text default null) returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.lg_results; v_ip int; v_hp int;
begin
  perform public.lg_require_admin();
  select * into r from public.lg_results where id = p_result; if not found then return public.lg_err('Unknown result.'); end if;
  if p_decision = 'approve' then
    if r.status = 'void' then return public.lg_err('A voided result cannot be approved. Post an adjustment instead.'); end if;
    perform public.lg_credit_result(p_result);
    update public.lg_results set note = coalesce(nullif(left(p_note, 300), ''), note) where id = p_result;
  elsif p_decision = 'void' then
    if r.status = 'void' then return public.lg_err('Already voided.'); end if;
    select coalesce(sum(l.ip), 0), coalesce(sum(l.hp), 0) into v_ip, v_hp from public.lg_ledger l where l.student_id = r.student_id and l.source = 'event' and l.ref = r.id::text;
    if v_ip <> 0 or v_hp <> 0 then
      insert into public.lg_ledger(season_id, student_id, source, ref, subject, ip, hp, note, created_by)
        select e.season_id, r.student_id, 'adjustment', 'void:' || r.id::text, e.subject, -v_ip, -v_hp, 'Result voided: ' || coalesce(left(p_note, 120), ''), auth.uid() from public.lg_events e where e.id = r.event_id
        on conflict (student_id, source, ref) do nothing;
    end if;
    update public.lg_results set status = 'void', note = coalesce(nullif(left(p_note, 300), ''), note), decided_by = auth.uid(), decided_at = now() where id = p_result;
  else return public.lg_err('Decision must be approve or void.'); end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.lg_admin_adjust(p_student uuid, p_ip int, p_hp int, p_reason text, p_subject text default null) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_season int := public.lg_season();
begin
  perform public.lg_require_admin();
  if v_season is null then return public.lg_err('There is no active season.'); end if;
  if length(trim(coalesce(p_reason, ''))) < 5 then return public.lg_err('A correction needs a reason (at least 5 letters).'); end if;
  if abs(coalesce(p_ip, 0)) > 500 or abs(coalesce(p_hp, 0)) > 500 then return public.lg_err('Corrections are limited to 500 points at a time.'); end if;
  if not exists (select 1 from public.students where id = p_student and not archived) then return public.lg_err('Unknown student.'); end if;
  insert into public.lg_ledger(season_id, student_id, source, ref, subject, ip, hp, note, created_by)
    values (v_season, p_student, 'adjustment', 'adj:' || gen_random_uuid()::text, nullif(trim(coalesce(p_subject, '')), ''), coalesce(p_ip, 0), coalesce(p_hp, 0), 'Correction: ' || trim(p_reason), auth.uid());
  perform public.lg_audit('LG_ADJUST', 'lg_ledger', p_student::text, null, jsonb_build_object('ip', p_ip, 'hp', p_hp, 'reason', trim(p_reason)));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.lg_admin_set_rule(p_key text, p_ip int, p_hp int, p_active boolean) returns jsonb language plpgsql security definer set search_path = public as $$
declare o public.lg_rules;
begin
  perform public.lg_require_admin();
  select * into o from public.lg_rules where key = p_key; if not found then return public.lg_err('Unknown rule.'); end if;
  if p_ip not between 0 and 200 or p_hp not between 0 and 200 then return public.lg_err('Points must be between 0 and 200.'); end if;
  perform public.lg_audit('LG_RULE', 'lg_rules', p_key, to_jsonb(o), jsonb_build_object('ip', p_ip, 'hp', p_hp, 'active', p_active));
  update public.lg_rules set ip = p_ip, hp = p_hp, active = coalesce(p_active, active) where key = p_key;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.lg_admin_publish_event(p_id uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare e public.lg_events; r record; v_tier text; v_pos int := 0;
begin
  perform public.lg_require_admin();
  select * into e from public.lg_events where id = p_id; if not found then return public.lg_err('Unknown competition.'); end if;
  if e.status <> 'closed' then return public.lg_err('Close the competition first.'); end if;
  if exists (select 1 from public.lg_results x where x.event_id = p_id and x.status in ('pending','disputed')) then return public.lg_err('Decide every pending or disputed result first.'); end if;
  for r in select x.student_id, x.score from public.lg_results x where x.event_id = p_id and x.status = 'approved' order by x.score desc, x.created_at asc limit 3 loop
    v_pos := v_pos + 1; v_tier := case v_pos when 1 then 'gold' when 2 then 'silver' else 'bronze' end;
    insert into public.lg_awards(season_id, student_id, kind, tier, event_id, label) values (e.season_id, r.student_id, 'medal', v_tier, p_id, e.title) on conflict do nothing;
  end loop;
  update public.lg_events set status = 'published', published_at = now() where id = p_id;
  return jsonb_build_object('ok', true, 'medals', v_pos);
end $$;

create or replace function public.lg_admin_weekly_awards() returns jsonb language plpgsql security definer set search_path = public as $$
declare v_season int := public.lg_season(); v_from timestamptz := public.lg_period_start('week') - interval '7 days'; v_to timestamptz := public.lg_period_start('week'); v_wk date; v_sid uuid; v_hid int; v_sp bigint; v_hp bigint;
begin
  perform public.lg_require_admin();
  if v_season is null then return public.lg_err('There is no active season.'); end if;
  v_wk := public.lg_day(v_from);
  select l.student_id, sum(l.ip) into v_sid, v_sp from public.lg_ledger l join public.students st on st.id = l.student_id and not st.archived where l.created_at >= v_from and l.created_at < v_to group by l.student_id having sum(l.ip) > 0 order by sum(l.ip) desc, l.student_id limit 1;
  select h.id, sum(l.hp) into v_hid, v_hp from public.lg_ledger l join public.students st on st.id = l.student_id and not st.archived join public.houses h on h.id = st.house_id where l.created_at >= v_from and l.created_at < v_to group by h.id having sum(l.hp) > 0 order by sum(l.hp) desc, h.id limit 1;
  if v_sid is not null then insert into public.lg_awards(season_id, student_id, kind, label, week_start) values (v_season, v_sid, 'student_of_week', 'Student of the Week', v_wk) on conflict do nothing; end if;
  if v_hid is not null then insert into public.lg_awards(season_id, house_id, kind, label, week_start) values (v_season, v_hid, 'house_of_week', 'House of the Week', v_wk) on conflict do nothing; end if;
  return jsonb_build_object('ok', true, 'student_points', v_sp, 'house_points', v_hp, 'week', v_wk);
end $$;

create or replace function public.lg_admin_advance(p_event uuid, p_top int, p_title text, p_questions jsonb, p_opens timestamptz, p_closes timestamptz) returns jsonb
language plpgsql security definer set search_path = public as $$
declare e public.lg_events; v_ids uuid[]; v_new jsonb;
begin
  perform public.lg_require_staff();
  select * into e from public.lg_events where id = p_event; if not found then return public.lg_err('Unknown competition.'); end if;
  if e.status not in ('closed','published') then return public.lg_err('Close the first round before starting the next one.'); end if;
  select array_agg(q.student_id) into v_ids from (select x.student_id from public.lg_results x where x.event_id = p_event and x.status = 'approved' order by x.score desc, x.created_at asc limit greatest(least(coalesce(p_top, 8), 64), 2)) q;
  if v_ids is null then return public.lg_err('Nobody qualified.'); end if;
  v_new := public.lg_admin_save_event(jsonb_build_object('kind', 'knockout', 'title', p_title, 'subject', e.subject, 'questions', p_questions, 'opens_at', p_opens, 'closes_at', p_closes, 'auto_approve', true));
  if (v_new ->> 'ok')::boolean then update public.lg_events set allowed = v_ids where id = (v_new ->> 'id')::uuid; end if;
  return v_new || jsonb_build_object('qualified', array_length(v_ids, 1));
end $$;

-- ───────── who may call what ─────────
do $$
declare f text;
begin
  -- internal helpers: nobody outside the database
  foreach f in array array['lg_immutable()','lg_resolve(text)','lg_credit_result(uuid)','lg_audit(text,text,text,jsonb,jsonb)','lg_require_admin()','lg_require_staff()','lg_client_ip()'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
  end loop;
  -- students and the public (through the browser, no account needed)
  foreach f in array array['lg_events_public()','lg_event_questions(text,text)','lg_submit_event(text,text,int[],int)','lg_event_review(text,text)','lg_report_practice(text,text,int,text,text)','lg_dispute(text,uuid,text)',
      'lg_set_hidden(text,boolean)','lg_me(text)','lg_board(text,text)','lg_house_board(text)','lg_subjects()','lg_trophies()','lg_hall()','lg_rules_public()','lg_season_public()'] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
  -- staff and admins (signed in; each function also checks the role itself)
  foreach f in array array['lg_admin_overview()','lg_admin_students()','lg_admin_set_house(uuid,int,text)','lg_admin_start_season(text,date,date)','lg_admin_close_season()','lg_admin_save_event(jsonb)','lg_admin_event_status(uuid,text)',
      'lg_admin_decide_result(uuid,text,text)','lg_admin_adjust(uuid,int,int,text,text)','lg_admin_set_rule(text,int,int,boolean)','lg_admin_publish_event(uuid)','lg_admin_weekly_awards()','lg_admin_advance(uuid,int,text,jsonb,timestamptz,timestamptz)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
