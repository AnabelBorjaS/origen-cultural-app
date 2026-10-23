create or replace function private.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if old.id = (select auth.uid()) then
    if new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.created_at is distinct from old.created_at
    then
      raise exception 'privileged profile fields cannot be changed by profile owner';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_profile_privileged_fields() from public, anon, authenticated;

drop trigger if exists profiles_protect_privileged_fields on public.profiles;
create trigger profiles_protect_privileged_fields
before update on public.profiles
for each row
execute function private.protect_profile_privileged_fields();

create or replace function private.protect_post_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.author_id = (select auth.uid()) then
    if new.author_id is distinct from old.author_id
       or new.like_count is distinct from old.like_count
       or new.comment_count is distinct from old.comment_count
       or new.is_editorial is distinct from old.is_editorial
       or new.source_label is distinct from old.source_label
       or new.source_url is distinct from old.source_url
       or new.created_at is distinct from old.created_at
    then
      raise exception 'privileged post fields cannot be changed by post author';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_post_privileged_fields() from public, anon, authenticated;

drop trigger if exists cultural_posts_protect_privileged_fields on public.cultural_posts;
create trigger cultural_posts_protect_privileged_fields
before update on public.cultural_posts
for each row
execute function private.protect_post_privileged_fields();

drop policy if exists "posts own insert" on public.cultural_posts;
create policy "posts own insert"
on public.cultural_posts
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and is_editorial = false
  and source_label is null
  and source_url is null
  and like_count = 0
  and comment_count = 0
  and (
    cultural_profile_id is null
    or exists (
      select 1
      from public.cultural_profiles cp
      where cp.id = cultural_posts.cultural_profile_id
        and cp.owner_id = (select auth.uid())
    )
  )
);

create or replace function private.protect_comment_identity()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if old.user_id = (select auth.uid()) then
    if new.user_id is distinct from old.user_id
       or new.post_id is distinct from old.post_id
       or new.created_at is distinct from old.created_at
    then
      raise exception 'comment identity fields cannot be changed by comment owner';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_comment_identity() from public, anon, authenticated;

drop trigger if exists post_comments_protect_identity on public.post_comments;
create trigger post_comments_protect_identity
before update on public.post_comments
for each row
execute function private.protect_comment_identity();

drop policy if exists "comments public read" on public.post_comments;
create policy "comments scoped read"
on public.post_comments
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.cultural_posts p
    where p.id = post_comments.post_id
      and p.is_published = true
  )
  or user_id = (select auth.uid())
  or (select private.is_admin())
);

revoke all on table public.profiles from anon;
grant select on table public.profiles to anon;
revoke all on table public.profiles from authenticated;
grant select, update on table public.profiles to authenticated;

revoke all on table public.cultural_posts from anon;
grant select on table public.cultural_posts to anon;
revoke all on table public.cultural_posts from authenticated;
grant select, insert, update, delete on table public.cultural_posts to authenticated;

revoke all on table public.post_comments from anon;
grant select on table public.post_comments to anon;
revoke all on table public.post_comments from authenticated;
grant select, insert, update, delete on table public.post_comments to authenticated;

revoke all on table public.post_likes from anon;
revoke all on table public.post_likes from authenticated;
grant select, insert, delete on table public.post_likes to authenticated;

revoke all on table public.post_saves from anon;
revoke all on table public.post_saves from authenticated;
grant select, insert, delete on table public.post_saves to authenticated;

revoke all on table public.follows from anon;
revoke all on table public.follows from authenticated;
grant select, insert, delete on table public.follows to authenticated;

revoke all on table public.favorites from anon;
revoke all on table public.favorites from authenticated;
grant select, insert, delete on table public.favorites to authenticated;

revoke all on table public.legal_acceptances from anon;
revoke all on table public.legal_acceptances from authenticated;
grant select on table public.legal_acceptances to authenticated;
