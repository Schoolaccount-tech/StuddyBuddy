drop function if exists public.lg_game_review(text, text);
drop function if exists public.lg_game_rematch(text, text);
drop function if exists public.lg_game_next(text);
alter table public.lg_games drop column if exists next_pin;
