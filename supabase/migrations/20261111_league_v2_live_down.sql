-- Wise Owl League v2 (DOWN). Removes claims and live games only. Deletes live-game data and every claimed sign-in.
-- lg_resolve and lg_admin_students are restored to their v1 behaviour (student code only).
drop function if exists public.lg_game_host(text,text,text);
drop function if exists public.lg_game_finish(uuid);
drop function if exists public.lg_game_answer(text,text,int);
drop function if exists public.lg_game_state(text,text,boolean);
drop function if exists public.lg_game_join(text,text);
drop function if exists public.lg_game_create(text,text,text,jsonb,int);
drop function if exists public.lg_game_host_ok(public.lg_games,text);
drop function if exists public.lg_admin_reset_claim(uuid,text);
drop function if exists public.lg_claim(uuid);
drop function if exists public.lg_roster();
drop table if exists public.lg_game_answers, public.lg_game_players, public.lg_games, public.lg_claims cascade;
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
create or replace function public.lg_admin_students() returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.lg_require_admin();
  return coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.full_name, 'form', f.name, 'house_id', s.house_id, 'house', h.name, 'has_code', s.student_code is not null,
      'points', coalesce((select sum(l.ip) from public.lg_ledger l where l.student_id = s.id), 0)) order by s.full_name)
    from public.students s left join public.forms f on f.id = s.form_id left join public.houses h on h.id = s.house_id where not s.archived), '[]'::jsonb);
end $$;
