drop policy if exists "posts own insert" on public.cultural_posts;

create policy "creator posts own insert"
on public.cultural_posts
for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles pr
    where pr.id = (select auth.uid())
      and pr.role = 'creator'::user_role
  )
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
