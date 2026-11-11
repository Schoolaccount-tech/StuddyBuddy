-- Wise Owl League v3 (DOWN). Removes reviews only. Deletes all stored reviews.
drop function if exists public.lg_admin_review_decide(uuid,text,text);
drop function if exists public.lg_admin_reviews();
drop function if exists public.lg_review_save(text,int,text);
drop function if exists public.lg_review_mine(text);
drop function if exists public.lg_reviews_public();
drop table if exists public.lg_reviews;
