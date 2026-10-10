-- ORIGEN abuse-prevention hardening for the controlled beta.
-- These limits are deliberately conservative and can be tuned after pilot telemetry.

alter table public.profiles
  add constraint profiles_display_name_len check (char_length(display_name) <= 120) not valid,
  add constraint profiles_bio_len check (bio is null or char_length(bio) <= 2000) not valid,
  add constraint profiles_story_len check (story is null or char_length(story) <= 5000) not valid,
  add constraint profiles_location_len check (location is null or char_length(location) <= 200) not valid;

alter table public.cultural_profiles
  add constraint cultural_profiles_name_len check (char_length(name) <= 180) not valid,
  add constraint cultural_profiles_story_len check (story is null or char_length(story) <= 8000) not valid,
  add constraint cultural_profiles_short_len check (short is null or char_length(short) <= 500) not valid,
  add constraint cultural_profiles_location_len check (location is null or char_length(location) <= 250) not valid;

alter table public.cultural_posts
  add constraint cultural_posts_title_len check (title is null or char_length(title) <= 240) not valid,
  add constraint cultural_posts_body_len check (char_length(body) between 1 and 12000) not valid,
  add constraint cultural_posts_category_len check (category is null or char_length(category) <= 150) not valid,
  add constraint cultural_posts_territory_len check (territory is null or char_length(territory) <= 250) not valid;

alter table public.profile_claims
  add constraint profile_claims_name_len check (char_length(claimant_name) <= 180) not valid,
  add constraint profile_claims_role_len check (char_length(relationship_role) <= 240) not valid,
  add constraint profile_claims_email_len check (char_length(official_email) <= 320) not valid,
  add constraint profile_claims_explanation_len check (explanation is null or char_length(explanation) <= 6000) not valid;

alter table public.moderation_reports
  add constraint moderation_reports_reason_len check (char_length(reason) <= 500) not valid,
  add constraint moderation_reports_details_len check (details is null or char_length(details) <= 6000) not valid;

create or replace function private.limit_comment_spam()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare n integer;
begin
  select count(*) into n
  from public.post_comments
  where user_id = new.user_id
    and created_at > now() - interval '10 minutes';
  if n >= 15 then
    raise exception 'rate limit: too many comments';
  end if;
  return new;
end;
$$;

create or replace function private.limit_post_spam()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare n integer;
begin
  select count(*) into n
  from public.cultural_posts
  where author_id = new.author_id
    and created_at > now() - interval '1 hour';
  if n >= 5 then
    raise exception 'rate limit: too many posts';
  end if;
  return new;
end;
$$;

create or replace function private.limit_claim_spam()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare n integer;
begin
  select count(*) into n
  from public.profile_claims
  where claimant_user_id = new.claimant_user_id
    and created_at > now() - interval '24 hours';
  if n >= 3 then
    raise exception 'rate limit: too many claims';
  end if;
  return new;
end;
$$;

create or replace function private.limit_report_spam()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare n integer;
begin
  if new.reporter_user_id is null then
    raise exception 'authenticated reporter required';
  end if;
  select count(*) into n
  from public.moderation_reports
  where reporter_user_id = new.reporter_user_id
    and created_at > now() - interval '1 hour';
  if n >= 20 then
    raise exception 'rate limit: too many reports';
  end if;
  return new;
end;
$$;

revoke all on function private.limit_comment_spam() from public, anon, authenticated;
revoke all on function private.limit_post_spam() from public, anon, authenticated;
revoke all on function private.limit_claim_spam() from public, anon, authenticated;
revoke all on function private.limit_report_spam() from public, anon, authenticated;

drop trigger if exists post_comments_spam_guard on public.post_comments;
create trigger post_comments_spam_guard
before insert on public.post_comments
for each row execute function private.limit_comment_spam();

drop trigger if exists cultural_posts_spam_guard on public.cultural_posts;
create trigger cultural_posts_spam_guard
before insert on public.cultural_posts
for each row execute function private.limit_post_spam();

drop trigger if exists profile_claims_spam_guard on public.profile_claims;
create trigger profile_claims_spam_guard
before insert on public.profile_claims
for each row execute function private.limit_claim_spam();

drop trigger if exists moderation_reports_spam_guard on public.moderation_reports;
create trigger moderation_reports_spam_guard
before insert on public.moderation_reports
for each row execute function private.limit_report_spam();

drop policy if exists "reports authenticated insert" on public.moderation_reports;
create policy "reports authenticated insert"
on public.moderation_reports for insert
to authenticated
with check (reporter_user_id = (select auth.uid()));
