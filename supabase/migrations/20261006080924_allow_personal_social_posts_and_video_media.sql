alter table public.cultural_posts
  alter column cultural_profile_id drop not null;

drop policy if exists "posts owned profile insert" on public.cultural_posts;
create policy "posts own insert"
on public.cultural_posts for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and (
    cultural_profile_id is null
    or exists (
      select 1 from public.cultural_profiles cp
      where cp.id = cultural_profile_id
        and cp.owner_id = (select auth.uid())
    )
  )
);

drop policy if exists "posts own update" on public.cultural_posts;
create policy "posts own update"
on public.cultural_posts for update
to authenticated
using (author_id = (select auth.uid()) or (select private.is_admin()))
with check (
  (author_id = (select auth.uid()) and (
    cultural_profile_id is null
    or exists (
      select 1 from public.cultural_profiles cp
      where cp.id = cultural_profile_id
        and cp.owner_id = (select auth.uid())
    )
  ))
  or (select private.is_admin())
);

update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp',
      'video/mp4','video/webm','video/quicktime'
    ]
where id = 'post-media';
