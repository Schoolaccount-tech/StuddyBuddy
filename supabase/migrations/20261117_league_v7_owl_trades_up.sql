-- Owl trading by code (UP). Additive. A player offers an owl, gets a 6-character code; a friend enters it and either takes it as a gift or swaps one of theirs.
create table if not exists public.ow_trades (
  code text primary key, owl text not null check (owl ~ '^[a-z]{2,14}$'), secret_hash text not null, reply_owl text check (reply_owl is null or reply_owl ~ '^[a-z]{2,14}$'),
  status text not null default 'open' check (status in ('open','claimed','collected','cancelled')), ip text, created_at timestamptz not null default now(), claimed_at timestamptz);
create table if not exists public.ow_attempts (ip text not null, at timestamptz not null default now());
create index if not exists ow_attempts_ip on public.ow_attempts(ip, at);
alter table public.ow_trades enable row level security; alter table public.ow_attempts enable row level security;
revoke all on public.ow_trades, public.ow_attempts from anon, authenticated;

create or replace function public.ow_trade_offer(p_owl text, p_secret text) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_code text; v_try int := 0; v_ip text := public.lg_client_ip(); chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  if p_owl !~ '^[a-z]{2,14}$' then return public.lg_err('Pick an owl to trade.'); end if;
  if length(coalesce(p_secret, '')) < 16 then return public.lg_err('Please try again.'); end if;
  if (select count(*) from public.ow_trades where ip = v_ip and created_at > now() - interval '1 day') >= 30 then return public.lg_err('Too many trade offers today. Try again tomorrow.'); end if;
  if random() < 0.05 then delete from public.ow_trades where created_at < now() - interval '30 days'; delete from public.ow_attempts where at < now() - interval '1 day'; end if;
  loop
    v_try := v_try + 1; v_code := '';
    for i in 1..6 loop v_code := v_code || substr(chars, 1 + floor(random() * length(chars))::int, 1); end loop;
    begin
      insert into public.ow_trades(code, owl, secret_hash, ip) values (v_code, p_owl, encode(sha256(convert_to(p_secret, 'utf8')), 'hex'), v_ip); exit;
    exception when unique_violation then if v_try > 10 then return public.lg_err('Could not make a code. Try again.'); end if; end;
  end loop;
  return jsonb_build_object('ok', true, 'code', v_code);
end $$;

create or replace function public.ow_trade_peek(p_code text) returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.ow_trades; v_ip text := public.lg_client_ip();
begin
  if (select count(*) from public.ow_attempts where ip = v_ip and at > now() - interval '10 minutes') >= 40 then return public.lg_err('Too many tries. Wait a few minutes.'); end if;
  select * into t from public.ow_trades where code = upper(trim(coalesce(p_code, '')));
  if not found then insert into public.ow_attempts(ip) values (v_ip); return public.lg_err('No trade with that code.'); end if;
  return jsonb_build_object('ok', true, 'owl', t.owl, 'status', t.status);
end $$;

create or replace function public.ow_trade_accept(p_code text, p_give text default null) returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.ow_trades; v_ip text := public.lg_client_ip();
begin
  if (select count(*) from public.ow_attempts where ip = v_ip and at > now() - interval '10 minutes') >= 40 then return public.lg_err('Too many tries. Wait a few minutes.'); end if;
  if p_give is not null and p_give !~ '^[a-z]{2,14}$' then return public.lg_err('Pick one of your owls to swap.'); end if;
  update public.ow_trades set status = 'claimed', reply_owl = p_give, claimed_at = now() where code = upper(trim(coalesce(p_code, ''))) and status = 'open' returning * into t;
  if not found then insert into public.ow_attempts(ip) values (v_ip); return public.lg_err('That trade is not available. It may be taken or cancelled.'); end if;
  return jsonb_build_object('ok', true, 'owl', t.owl);
end $$;

create or replace function public.ow_trade_status(p_code text, p_secret text) returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.ow_trades;
begin
  select * into t from public.ow_trades where code = upper(trim(coalesce(p_code, ''))) and secret_hash = encode(sha256(convert_to(coalesce(p_secret, ''), 'utf8')), 'hex');
  if not found then return public.lg_err('Trade not found.'); end if;
  return jsonb_build_object('ok', true, 'status', t.status, 'owl', t.owl, 'reply_owl', t.reply_owl);
end $$;

create or replace function public.ow_trade_collect(p_code text, p_secret text) returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.ow_trades;
begin
  update public.ow_trades set status = 'collected' where code = upper(trim(coalesce(p_code, ''))) and status = 'claimed' and secret_hash = encode(sha256(convert_to(coalesce(p_secret, ''), 'utf8')), 'hex') returning * into t;
  if not found then return public.lg_err('Nothing to collect.'); end if;
  return jsonb_build_object('ok', true, 'reply_owl', t.reply_owl);
end $$;

create or replace function public.ow_trade_cancel(p_code text, p_secret text) returns jsonb language plpgsql security definer set search_path = public as $$
declare t public.ow_trades;
begin
  update public.ow_trades set status = 'cancelled' where code = upper(trim(coalesce(p_code, ''))) and status = 'open' and secret_hash = encode(sha256(convert_to(coalesce(p_secret, ''), 'utf8')), 'hex') returning * into t;
  if not found then return public.lg_err('This offer cannot be cancelled. A friend may have taken it.'); end if;
  return jsonb_build_object('ok', true);
end $$;

do $$
declare f text;
begin
  foreach f in array array['ow_trade_offer(text,text)','ow_trade_peek(text)','ow_trade_accept(text,text)','ow_trade_status(text,text)','ow_trade_collect(text,text)','ow_trade_cancel(text,text)'] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;
