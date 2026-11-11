-- Wise Owl League v3 (UP): student reviews with star ratings. Additive. Reviews appear only after a teacher approves them.
create table public.lg_reviews (
  student_id uuid primary key references public.students(id),
  stars int not null check (stars between 1 and 5),
  body text not null check (char_length(body) between 5 and 400),
  status text not null default 'pending' check (status in ('pending','approved','hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_by uuid
);
alter table public.lg_reviews enable row level security;
revoke all on public.lg_reviews from anon, authenticated;

create or replace function public.lg_reviews_public() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'count', (select count(*) from public.lg_reviews where status = 'approved'),
    'avg', (select round(avg(stars)::numeric, 2) from public.lg_reviews where status = 'approved'),
    'dist', (select jsonb_build_array(count(*) filter (where stars = 1), count(*) filter (where stars = 2), count(*) filter (where stars = 3), count(*) filter (where stars = 4), count(*) filter (where stars = 5)) from public.lg_reviews where status = 'approved'),
    'items', coalesce((select jsonb_agg(jsonb_build_object('who', public.lg_disp(s.full_name, coalesce(pv.hidden, false)), 'stars', r.stars, 'body', r.body, 'at', r.updated_at) order by r.updated_at desc)
      from (select * from public.lg_reviews where status = 'approved' order by updated_at desc limit 60) r join public.students s on s.id = r.student_id left join public.lg_privacy pv on pv.student_id = s.id), '[]'::jsonb)) $$;

create or replace function public.lg_review_mine(p_code text) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_sid uuid; r public.lg_reviews;
begin
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  select * into r from public.lg_reviews where student_id = v_sid;
  return jsonb_build_object('ok', true, 'mine', case when r.student_id is null then null else jsonb_build_object('stars', r.stars, 'body', r.body, 'status', r.status) end);
end $$;

create or replace function public.lg_review_save(p_code text, p_stars int, p_body text) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_sid uuid; v_b text := trim(coalesce(p_body, ''));
begin
  v_sid := public.lg_resolve(p_code); if v_sid is null then return public.lg_bad_code(); end if;
  if p_stars is null or p_stars not between 1 and 5 then return public.lg_err('Choose 1 to 5 stars.'); end if;
  if char_length(v_b) < 5 or char_length(v_b) > 400 then return public.lg_err('Write between 5 and 400 characters.'); end if;
  if v_b ~* '(https?://|www\.|\.com\b)' then return public.lg_err('Please do not put links in reviews.'); end if;
  insert into public.lg_reviews(student_id, stars, body) values (v_sid, p_stars, v_b)
    on conflict (student_id) do update set stars = excluded.stars, body = excluded.body, status = 'pending', updated_at = now(), decided_by = null;
  return jsonb_build_object('ok', true, 'status', 'pending');
end $$;

create or replace function public.lg_admin_reviews() returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.lg_require_staff();
  return coalesce((select jsonb_agg(jsonb_build_object('student', r.student_id, 'who', s.full_name, 'stars', r.stars, 'body', r.body, 'status', r.status, 'at', r.updated_at)
    order by (r.status = 'pending') desc, r.updated_at desc) from public.lg_reviews r join public.students s on s.id = r.student_id), '[]'::jsonb);
end $$;

create or replace function public.lg_admin_review_decide(p_student uuid, p_decision text, p_note text default null) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_s text;
begin
  perform public.lg_require_staff();
  v_s := case p_decision when 'approve' then 'approved' when 'hide' then 'hidden' else null end;
  if v_s is null then return public.lg_err('Unknown decision.'); end if;
  update public.lg_reviews set status = v_s, decided_by = auth.uid() where student_id = p_student;
  if not found then return public.lg_err('Review not found.'); end if;
  perform public.lg_audit('LG_REVIEW_' || upper(v_s), 'lg_reviews', p_student::text, null, jsonb_build_object('note', p_note));
  return jsonb_build_object('ok', true);
end $$;

do $$
declare f text;
begin
  foreach f in array array['lg_reviews_public()','lg_review_mine(text)','lg_review_save(text,int,text)'] loop
    execute format('revoke all on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
  foreach f in array array['lg_admin_reviews()','lg_admin_review_decide(uuid,text,text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
