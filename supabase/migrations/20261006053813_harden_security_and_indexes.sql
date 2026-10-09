create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

drop policy if exists "cultural profiles public read" on public.cultural_profiles;
create policy "cultural profiles public read"
on public.cultural_profiles for select
to anon, authenticated
using (is_published = true or owner_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "cultural profiles own update" on public.cultural_profiles;
create policy "cultural profiles own update"
on public.cultural_profiles for update
to authenticated
using (owner_id = (select auth.uid()) or (select private.is_admin()))
with check (owner_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "cultural profiles own delete" on public.cultural_profiles;
create policy "cultural profiles own delete"
on public.cultural_profiles for delete
to authenticated
using (owner_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "posts public read" on public.cultural_posts;
create policy "posts public read"
on public.cultural_posts for select
to anon, authenticated
using (is_published = true or author_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "posts own update" on public.cultural_posts;
create policy "posts own update"
on public.cultural_posts for update
to authenticated
using (author_id = (select auth.uid()) or (select private.is_admin()))
with check (author_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "posts own delete" on public.cultural_posts;
create policy "posts own delete"
on public.cultural_posts for delete
to authenticated
using (author_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "claims own read" on public.profile_claims;
create policy "claims own read"
on public.profile_claims for select
to authenticated
using (claimant_user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "comments own update" on public.post_comments;
create policy "comments own update"
on public.post_comments for update
to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()))
with check (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "comments own delete" on public.post_comments;
create policy "comments own delete"
on public.post_comments for delete
to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "reports own read" on public.moderation_reports;
create policy "reports own read"
on public.moderation_reports for select
to authenticated
using (reporter_user_id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "legal acceptance own read" on public.legal_acceptances;
create policy "legal acceptance own read"
on public.legal_acceptances for select
to authenticated
using (user_id = (select auth.uid()) or (select private.is_admin()));

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name',''))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.approve_profile_claim(claim_id uuid, notes text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c public.profile_claims%rowtype;
begin
  if not private.is_admin() then
    raise exception 'not authorized';
  end if;

  select * into c from public.profile_claims where id = claim_id for update;
  if not found then
    raise exception 'claim not found';
  end if;
  if c.status <> 'pending' then
    raise exception 'claim is not pending';
  end if;

  update public.cultural_profiles
  set owner_id = c.claimant_user_id,
      status = 'verified',
      verified_at = now()
  where id = c.cultural_profile_id;

  update public.profile_claims
  set status = 'approved',
      reviewer_notes = notes,
      reviewed_by = (select auth.uid()),
      reviewed_at = now()
  where id = claim_id;

  update public.profiles
  set role = 'creator'
  where id = c.claimant_user_id and role = 'explorer';
end;
$$;

revoke all on function private.approve_profile_claim(uuid,text) from public, anon, authenticated;

drop function if exists public.approve_profile_claim(uuid,text);
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();

create index if not exists favorites_profile_idx on public.favorites(cultural_profile_id);
create index if not exists follows_profile_idx on public.follows(cultural_profile_id);
create index if not exists legal_acceptances_user_idx on public.legal_acceptances(user_id);
create index if not exists post_comments_post_idx on public.post_comments(post_id);
create index if not exists post_comments_user_idx on public.post_comments(user_id);
create index if not exists post_likes_post_idx on public.post_likes(post_id);
create index if not exists profile_claims_reviewed_by_idx on public.profile_claims(reviewed_by);
