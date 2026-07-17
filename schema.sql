-- Esquema inicial sugerido para migrar el prototipo a Supabase.
create extension if not exists "pgcrypto";

create type public.user_role as enum ('explorer', 'creator', 'admin');
create type public.verification_status as enum ('not_requested', 'pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'explorer',
  display_name text not null,
  avatar_url text,
  country text,
  city text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cultural_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text unique not null,
  name text not null,
  creator_type text not null,
  category text not null,
  story text not null,
  location text,
  cover_url text,
  verification public.verification_status not null default 'not_requested',
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.cultural_posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.cultural_profiles(id) on delete cascade,
  title text not null,
  body text not null,
  image_url text,
  published_at timestamptz not null default now()
);

create table public.profile_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.cultural_profiles(id) on delete cascade,
  label text not null,
  url text not null,
  sort_order integer not null default 0
);

create table public.follows (
  explorer_id uuid references public.profiles(id) on delete cascade,
  cultural_profile_id uuid references public.cultural_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (explorer_id, cultural_profile_id)
);

create table public.favorites (
  explorer_id uuid references public.profiles(id) on delete cascade,
  cultural_profile_id uuid references public.cultural_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (explorer_id, cultural_profile_id)
);

create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  cultural_profile_id uuid not null references public.cultural_profiles(id) on delete cascade,
  evidence jsonb not null default '{}'::jsonb,
  status public.verification_status not null default 'pending',
  reviewer_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.cultural_profiles enable row level security;
alter table public.cultural_posts enable row level security;
alter table public.follows enable row level security;
alter table public.favorites enable row level security;

create policy "Published cultural profiles are public" on public.cultural_profiles for select using (is_published = true or owner_id = auth.uid());
create policy "Owners manage cultural profiles" on public.cultural_profiles for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Users read own profile" on public.profiles for select using (id = auth.uid());
create policy "Users update own profile" on public.profiles for update using (id = auth.uid());
create policy "Users manage own follows" on public.follows for all using (explorer_id = auth.uid()) with check (explorer_id = auth.uid());
create policy "Users manage own favorites" on public.favorites for all using (explorer_id = auth.uid()) with check (explorer_id = auth.uid());
