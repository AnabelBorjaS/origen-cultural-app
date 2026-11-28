create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('explorer','creator','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.profile_status as enum ('reference','pending','verified');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.claim_status as enum ('pending','approved','rejected','withdrawn');
exception when duplicate_object then null; end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'explorer',
  display_name text not null default '',
  avatar_url text,
  country text,
  city text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cultural_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  slug text unique not null,
  name text not null,
  creator_type text,
  category text,
  story text,
  location text,
  cover_url text,
  avatar_url text,
  website_url text,
  status public.profile_status not null default 'reference',
  is_published boolean not null default true,
  reference_source text,
  reference_source_url text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cultural_posts (
  id uuid primary key default gen_random_uuid(),
  cultural_profile_id uuid not null references public.cultural_profiles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  body text not null,
  image_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_claims (
  id uuid primary key default gen_random_uuid(),
  cultural_profile_id uuid not null references public.cultural_profiles(id) on delete cascade,
  claimant_user_id uuid not null references public.profiles(id) on delete cascade,
  claimant_name text not null,
  relationship_role text not null,
  official_email text not null,
  official_url text,
  explanation text,
  authority_declaration boolean not null default false,
  status public.claim_status not null default 'pending',
  reviewer_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index profile_claims_one_pending_per_user_profile
on public.profile_claims(cultural_profile_id, claimant_user_id)
where status = 'pending';

create table public.follows (
  user_id uuid not null references public.profiles(id) on delete cascade,
  cultural_profile_id uuid not null references public.cultural_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, cultural_profile_id)
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  cultural_profile_id uuid not null references public.cultural_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, cultural_profile_id)
);

create table public.post_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.cultural_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.cultural_posts(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references public.profiles(id) on delete set null,
  target_type text not null check (target_type in ('profile','post','comment','claim','other')),
  target_id text,
  reason text not null,
  details text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  community_guidelines_version text,
  cultural_rights_version text,
  accepted_at timestamptz not null default now()
);

create index cultural_profiles_owner_idx on public.cultural_profiles(owner_id);
create index cultural_posts_profile_idx on public.cultural_posts(cultural_profile_id);
create index cultural_posts_author_idx on public.cultural_posts(author_id);
create index profile_claims_profile_idx on public.profile_claims(cultural_profile_id);
create index profile_claims_claimant_idx on public.profile_claims(claimant_user_id);
create index moderation_reports_reporter_idx on public.moderation_reports(reporter_user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger cultural_profiles_touch_updated_at
before update on public.cultural_profiles
for each row execute function public.touch_updated_at();

create trigger cultural_posts_touch_updated_at
before update on public.cultural_posts
for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name',''))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.approve_profile_claim(claim_id uuid, notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.profile_claims%rowtype;
begin
  if not public.is_admin() then
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

revoke all on function public.approve_profile_claim(uuid,text) from public;
grant execute on function public.approve_profile_claim(uuid,text) to authenticated;

alter table public.profiles enable row level security;
alter table public.cultural_profiles enable row level security;
alter table public.cultural_posts enable row level security;
alter table public.profile_claims enable row level security;
alter table public.follows enable row level security;
alter table public.favorites enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.legal_acceptances enable row level security;

create policy "profiles public read"
on public.profiles for select
to anon, authenticated
using (true);

create policy "profiles own update"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url, country, city, bio, updated_at) on public.profiles to authenticated;

create policy "cultural profiles public read"
on public.cultural_profiles for select
to anon, authenticated
using (is_published = true or owner_id = (select auth.uid()) or (select public.is_admin()));

create policy "cultural profiles own insert"
on public.cultural_profiles for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and status in ('pending','verified')
);

create policy "cultural profiles own update"
on public.cultural_profiles for update
to authenticated
using (owner_id = (select auth.uid()) or (select public.is_admin()))
with check (owner_id = (select auth.uid()) or (select public.is_admin()));

create policy "cultural profiles own delete"
on public.cultural_profiles for delete
to authenticated
using (owner_id = (select auth.uid()) or (select public.is_admin()));

create policy "posts public read"
on public.cultural_posts for select
to anon, authenticated
using (is_published = true or author_id = (select auth.uid()) or (select public.is_admin()));

create policy "posts owned profile insert"
on public.cultural_posts for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1 from public.cultural_profiles cp
    where cp.id = cultural_profile_id and cp.owner_id = (select auth.uid())
  )
);

create policy "posts own update"
on public.cultural_posts for update
to authenticated
using (author_id = (select auth.uid()) or (select public.is_admin()))
with check (author_id = (select auth.uid()) or (select public.is_admin()));

create policy "posts own delete"
on public.cultural_posts for delete
to authenticated
using (author_id = (select auth.uid()) or (select public.is_admin()));

create policy "claims own insert"
on public.profile_claims for insert
to authenticated
with check (
  claimant_user_id = (select auth.uid())
  and authority_declaration = true
);

create policy "claims own read"
on public.profile_claims for select
to authenticated
using (claimant_user_id = (select auth.uid()) or (select public.is_admin()));

create policy "claims own withdraw"
on public.profile_claims for update
to authenticated
using (claimant_user_id = (select auth.uid()) and status = 'pending')
with check (
  claimant_user_id = (select auth.uid())
  and status = 'withdrawn'
  and reviewed_by is null
  and reviewed_at is null
);

create policy "follows own"
on public.follows for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "favorites own"
on public.favorites for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "likes own"
on public.post_likes for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "comments public read"
on public.post_comments for select
to anon, authenticated
using (true);

create policy "comments own insert"
on public.post_comments for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "comments own update"
on public.post_comments for update
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()))
with check (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "comments own delete"
on public.post_comments for delete
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "reports authenticated insert"
on public.moderation_reports for insert
to authenticated
with check (reporter_user_id is null or reporter_user_id = (select auth.uid()));

create policy "reports own read"
on public.moderation_reports for select
to authenticated
using (reporter_user_id = (select auth.uid()) or (select public.is_admin()));

create policy "legal acceptance own insert"
on public.legal_acceptances for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "legal acceptance own read"
on public.legal_acceptances for select
to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('covers','covers',true,8388608,array['image/jpeg','image/png','image/webp']),
  ('post-media','post-media',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "public media read"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('avatars','covers','post-media'));

create policy "users upload own media"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('avatars','covers','post-media')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "users update own media"
on storage.objects for update
to authenticated
using (
  bucket_id in ('avatars','covers','post-media')
  and owner_id = (select auth.uid()::text)
)
with check (
  bucket_id in ('avatars','covers','post-media')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "users delete own media"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('avatars','covers','post-media')
  and owner_id = (select auth.uid()::text)
);
