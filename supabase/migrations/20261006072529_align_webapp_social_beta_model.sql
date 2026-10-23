-- Extend the beta schema so the browser app and future mobile clients share the same model.

alter table public.profiles
  add column if not exists location text,
  add column if not exists story text,
  add column if not exists categories text[] not null default '{}',
  add column if not exists links jsonb not null default '{}'::jsonb,
  add column if not exists cover_url text;

alter table public.cultural_profiles
  add column if not exists short text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists links jsonb not null default '{}'::jsonb,
  add column if not exists follower_count integer not null default 0 check (follower_count >= 0);

alter table public.cultural_posts
  alter column author_id drop not null,
  add column if not exists post_type text not null default 'text'
    check (post_type in ('text','photo','carousel','video')),
  add column if not exists media_urls text[] not null default '{}',
  add column if not exists category text,
  add column if not exists territory text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists is_editorial boolean not null default false,
  add column if not exists source_label text,
  add column if not exists source_url text,
  add column if not exists like_count integer not null default 0 check (like_count >= 0),
  add column if not exists comment_count integer not null default 0 check (comment_count >= 0);

create table if not exists public.post_saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.cultural_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.post_saves enable row level security;

drop policy if exists "post saves own" on public.post_saves;
create policy "post saves own"
on public.post_saves for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create index if not exists post_saves_post_idx on public.post_saves(post_id);

-- New users are populated only from allow-listed signup metadata.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_role public.user_role;
begin
  requested_role :=
    case
      when new.raw_user_meta_data->>'account_type' = 'creator' then 'creator'::public.user_role
      else 'explorer'::public.user_role
    end;

  insert into public.profiles (
    id, role, display_name, location, story, categories, links
  )
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data->>'display_name',''),
    nullif(new.raw_user_meta_data->>'location',''),
    nullif(new.raw_user_meta_data->>'story',''),
    coalesce(
      array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'categories','[]'::jsonb))),
      '{}'::text[]
    ),
    case
      when jsonb_typeof(new.raw_user_meta_data->'links') = 'object'
      then new.raw_user_meta_data->'links'
      else '{}'::jsonb
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

-- A creator can create only a pending profile for themselves.
drop policy if exists "cultural profiles own insert" on public.cultural_profiles;
create policy "cultural profiles own insert"
on public.cultural_profiles for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and status = 'pending'
);

-- Owners may edit content, but cannot self-verify or change ownership/status.
revoke update on public.cultural_profiles from authenticated;
grant update (
  slug, name, creator_type, category, story, location,
  cover_url, avatar_url, website_url, is_published, short, tags, links, updated_at
) on public.cultural_profiles to authenticated;

-- Claims can only target an unowned reference profile.
drop policy if exists "claims own insert" on public.profile_claims;
create policy "claims own insert"
on public.profile_claims for insert
to authenticated
with check (
  claimant_user_id = (select auth.uid())
  and authority_declaration = true
  and exists (
    select 1
    from public.cultural_profiles cp
    where cp.id = cultural_profile_id
      and cp.owner_id is null
      and cp.status = 'reference'
  )
);

-- Interaction counters are maintained server-side.
create or replace function private.update_cultural_follower_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update public.cultural_profiles
    set follower_count = follower_count + 1
    where id = new.cultural_profile_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.cultural_profiles
    set follower_count = greatest(follower_count - 1, 0)
    where id = old.cultural_profile_id;
    return old;
  end if;
  return null;
end;
$$;

revoke all on function private.update_cultural_follower_count() from public, anon, authenticated;

drop trigger if exists follows_update_counter on public.follows;
create trigger follows_update_counter
after insert or delete on public.follows
for each row execute function private.update_cultural_follower_count();

create or replace function private.update_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update public.cultural_posts set like_count = like_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.cultural_posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

revoke all on function private.update_post_like_count() from public, anon, authenticated;

drop trigger if exists post_likes_update_counter on public.post_likes;
create trigger post_likes_update_counter
after insert or delete on public.post_likes
for each row execute function private.update_post_like_count();

create or replace function private.update_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    update public.cultural_posts set comment_count = comment_count + 1 where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.cultural_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

revoke all on function private.update_post_comment_count() from public, anon, authenticated;

drop trigger if exists post_comments_update_counter on public.post_comments;
create trigger post_comments_update_counter
after insert or delete on public.post_comments
for each row execute function private.update_post_comment_count();

-- Explicit API grants for the browser/mobile clients.
grant select on public.profiles, public.cultural_profiles, public.cultural_posts, public.post_comments to anon, authenticated;
grant select, insert, delete on public.follows, public.favorites, public.post_likes, public.post_saves to authenticated;
grant select, insert, update, delete on public.post_comments to authenticated;
grant select, insert, update on public.profile_claims to authenticated;
grant select, insert on public.moderation_reports, public.legal_acceptances to authenticated;
grant insert on public.cultural_profiles, public.cultural_posts to authenticated;
grant update, delete on public.cultural_posts to authenticated;

-- User profile edits: keep authorization fields server-controlled.
revoke update on public.profiles from authenticated;
grant update (
  display_name, avatar_url, country, city, bio, location, story,
  categories, links, cover_url, updated_at
) on public.profiles to authenticated;
