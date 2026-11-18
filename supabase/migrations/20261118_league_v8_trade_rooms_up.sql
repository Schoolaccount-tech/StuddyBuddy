-- Live trade rooms (UP). Two players join with a code, both see the offers, both accept, 5 second countdown, swap. Additive.
create table if not exists public.ow_rooms (
  code text primary key, a_hash text not null, b_hash text, a_owl text check (a_owl is null or a_owl ~ '^[a-z]{2,14}$'), b_owl text check (b_owl is null or b_owl ~ '^[a-z]{2,14}$'),
  a_ok boolean not null default false, b_ok boolean not null default false, status text not null default 'open' check (status in ('open','counting','done','cancelled')),
  ready_at timestamptz, a_got boolean not null default false, b_got boolean not null default false, ip text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
alter table public.ow_rooms enable row level security; revoke all on public.ow_rooms from anon, authenticated;

create or replace function public.ow_hash(p text) returns text language sql immutable set search_path = public as $$ select encode(sha256(convert_to(coalesce(p, ''), 'utf8')), 'hex') $$;

create or replace function public.ow_room_view(r public.ow_rooms, p_secret text) returns jsonb language plpgsql stable set search_path = public as $$
declare s text := case when r.a_hash = public.ow_hash(p_secret) then 'a' when r.b_hash = public.ow_hash(p_secret) then 'b' else null end;
begin
  if s is null then return public.lg_err('You are not in this trade.'); end if;
  return jsonb_build_object('ok', true, 'side', s, 'status', r.status, 'joined', r.b_hash is not null,
    'my_owl', case when s = 'a' then r.a_owl else r.b_owl end, 'their_owl', case when s = 'a' then r.b_owl else r.a_owl end,
    'my_ok', case when s = 'a' then r.a_ok else r.b_ok end, 'their_ok', case when s = 'a' then r.b_ok else r.a_ok end,
    'left', case when r.ready_at is null then null else greatest(0, ceil(extract(epoch from (r.ready_at - now()))))::int end,
    'got', case when s = 'a' then r.a_got else r.b_got end);
end $$;

create or replace function public.ow_room_create(p_secret text) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_code text; v_try int := 0; v_ip text := public.lg_client_ip(); chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  if length(coalesce(p_secret, '')) < 16 then return public.lg_err('Please try again.'); end if;
  if (select count(*) from public.ow_rooms where ip = v_ip and created_at > now() - interval '1 hour') >= 20 then return public.lg_err('Too many trades started. Try again soon.'); end if;
  if random() < 0.05 then delete from public.ow_rooms where created_at < now() - interval '3 days'; end if;
  loop
    v_try := v_try + 1; v_code := '';
    for i in 1..5 loop v_code := v_code || substr(chars, 1 + floor(random() * length(chars))::int, 1); end loop;
    begin insert into public.ow_rooms(code, a_hash, ip) values (v_code, public.ow_hash(p_secret), v_ip); exit;
    exception when unique_violation then if v_try > 10 then return public.lg_err('Could not make a code. Try again.'); end if; end;
  end loop;
  return jsonb_build_object('ok', true, 'code', v_code);
end $$;

create or replace function public.ow_room_join(p_code text, p_secret text) returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.ow_rooms; v_ip text := public.lg_client_ip();
begin
  if length(coalesce(p_secret, '')) < 16 then return public.lg_err('Please try again.'); end if;
  if (select count(*) from public.ow_attempts where ip = v_ip and at > now() - interval '10 minutes') >= 40 then return public.lg_err('Too many tries. Wait a few minutes.'); end if;
  select * into r from public.ow_rooms where code = upper(trim(coalesce(p_code, ''))) for update;
  if not found or r.status <> 'open' then insert into public.ow_attempts(ip) values (v_ip); return public.lg_err('No open trade with that code.'); end if;
  if r.a_hash = public.ow_hash(p_secret) or r.b_hash = public.ow_hash(p_secret) then return public.ow_room_view(r, p_secret); end if;
  if r.b_hash is not null then return public.lg_err('That trade already has two players.'); end if;
  update public.ow_rooms set b_hash = public.ow_hash(p_secret), updated_at = now() where code = r.code returning * into r;
  return public.ow_room_view(r, p_secret);
end $$;

create or replace function public.ow_room_state(p_code text, p_secret text) returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.ow_rooms;
begin
  select * into r from public.ow_rooms where code = upper(trim(coalesce(p_code, ''))) for update;
  if not found then return public.lg_err('Trade not found.'); end if;
  if r.status = 'counting' and r.ready_at <= now() then update public.ow_rooms set status = 'done', updated_at = now() where code = r.code returning * into r;
  elsif r.status in ('open', 'counting') and r.updated_at < now() - interval '20 minutes' then update public.ow_rooms set status = 'cancelled' where code = r.code returning * into r; end if;
  return public.ow_room_view(r, p_secret);
end $$;

create or replace function public.ow_room_set(p_code text, p_secret text, p_owl text) returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.ow_rooms; s text;
begin
  if p_owl is not null and p_owl !~ '^[a-z]{2,14}$' then return public.lg_err('Pick an owl.'); end if;
  select * into r from public.ow_rooms where code = upper(trim(coalesce(p_code, ''))) for update;
  if not found then return public.lg_err('Trade not found.'); end if;
  s := case when r.a_hash = public.ow_hash(p_secret) then 'a' when r.b_hash = public.ow_hash(p_secret) then 'b' end;
  if s is null then return public.lg_err('You are not in this trade.'); end if;
  if r.status not in ('open', 'counting') then return public.lg_err('This trade is finished.'); end if;
  if s = 'a' then update public.ow_rooms set a_owl = p_owl, a_ok = false, b_ok = false, status = 'open', ready_at = null, updated_at = now() where code = r.code returning * into r;
  else update public.ow_rooms set b_owl = p_owl, a_ok = false, b_ok = false, status = 'open', ready_at = null, updated_at = now() where code = r.code returning * into r; end if;
  return public.ow_room_view(r, p_secret);
end $$;

create or replace function public.ow_room_accept(p_code text, p_secret text, p_on boolean) returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.ow_rooms; s text;
begin
  select * into r from public.ow_rooms where code = upper(trim(coalesce(p_code, ''))) for update;
  if not found then return public.lg_err('Trade not found.'); end if;
  s := case when r.a_hash = public.ow_hash(p_secret) then 'a' when r.b_hash = public.ow_hash(p_secret) then 'b' end;
  if s is null then return public.lg_err('You are not in this trade.'); end if;
  if r.status not in ('open', 'counting') then return public.lg_err('This trade is finished.'); end if;
  if r.b_hash is null then return public.lg_err('Wait for your friend to join.'); end if;
  if coalesce(p_on, false) and r.a_owl is null and r.b_owl is null then return public.lg_err('Add an owl to the trade first.'); end if;
  if s = 'a' then r.a_ok := coalesce(p_on, false); else r.b_ok := coalesce(p_on, false); end if;
  if r.a_ok and r.b_ok then update public.ow_rooms set a_ok = r.a_ok, b_ok = r.b_ok, status = 'counting', ready_at = now() + interval '5 seconds', updated_at = now() where code = r.code returning * into r;
  else update public.ow_rooms set a_ok = r.a_ok, b_ok = r.b_ok, status = 'open', ready_at = null, updated_at = now() where code = r.code returning * into r; end if;
  return public.ow_room_view(r, p_secret);
end $$;

create or replace function public.ow_room_collect(p_code text, p_secret text) returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.ow_rooms; s text;
begin
  select * into r from public.ow_rooms where code = upper(trim(coalesce(p_code, ''))) for update;
  if not found then return public.lg_err('Trade not found.'); end if;
  if r.status = 'counting' and r.ready_at <= now() then r.status := 'done'; end if;
  s := case when r.a_hash = public.ow_hash(p_secret) then 'a' when r.b_hash = public.ow_hash(p_secret) then 'b' end;
  if s is null then return public.lg_err('You are not in this trade.'); end if;
  if r.status <> 'done' then return public.lg_err('The trade is not finished yet.'); end if;
  if (s = 'a' and r.a_got) or (s = 'b' and r.b_got) then return public.lg_err('Already collected.'); end if;
  if s = 'a' then update public.ow_rooms set status = 'done', a_got = true where code = r.code; else update public.ow_rooms set status = 'done', b_got = true where code = r.code; end if;
  return jsonb_build_object('ok', true, 'give', case when s = 'a' then r.a_owl else r.b_owl end, 'get', case when s = 'a' then r.b_owl else r.a_owl end);
end $$;

create or replace function public.ow_room_leave(p_code text, p_secret text) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.ow_rooms set status = 'cancelled', updated_at = now() where code = upper(trim(coalesce(p_code, ''))) and status in ('open', 'counting') and (a_hash = public.ow_hash(p_secret) or b_hash = public.ow_hash(p_secret));
  return jsonb_build_object('ok', true);
end $$;

do $$
declare f text;
begin
  foreach f in array array['ow_room_create(text)','ow_room_join(text,text)','ow_room_state(text,text)','ow_room_set(text,text,text)','ow_room_accept(text,text,boolean)','ow_room_collect(text,text)','ow_room_leave(text,text)'] loop
    execute format('revoke all on function public.%s from public', f); execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
  revoke all on function public.ow_room_view(public.ow_rooms, text) from public, anon, authenticated;
  revoke all on function public.ow_hash(text) from public, anon, authenticated;
end $$;
