-- Wise Owl League v4 (DOWN). Removes site ratings. Deletes all stored ratings.
-- lg_game_join and lg_game_state go back to their v2 versions (hosts cannot play): re-run those two functions from 20261111_league_v2_live_up.sql.
drop function if exists public.lg_admin_site_rating_decide(text,text,text);
drop function if exists public.lg_admin_site_ratings();
drop function if exists public.lg_site_rate(text,int,text,text);
drop function if exists public.lg_site_rate_mine(text);
drop function if exists public.lg_site_ratings_public();
drop table if exists public.lg_site_ratings;
