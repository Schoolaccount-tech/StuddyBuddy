drop function if exists public.lg_game_state_g(text,text,boolean), public.lg_game_bet(text,text,int,boolean,int), public.lg_settle_bets(uuid,int), public.lg_game_create_g(text,text,text,jsonb,int,boolean,boolean);
drop table if exists public.lg_game_bets;
alter table public.lg_games drop column if exists host_blind, drop column if exists bets_on;
