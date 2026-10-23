drop policy if exists "likes own" on public.post_likes;
create policy "likes own read"
on public.post_likes for select to authenticated
using (user_id = (select auth.uid()));
create policy "likes own insert"
on public.post_likes for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.cultural_posts p
    where p.id = post_likes.post_id
      and p.is_published = true
  )
);
create policy "likes own delete"
on public.post_likes for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "post saves own" on public.post_saves;
create policy "post saves own read"
on public.post_saves for select to authenticated
using (user_id = (select auth.uid()));
create policy "post saves own insert"
on public.post_saves for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.cultural_posts p
    where p.id = post_saves.post_id
      and p.is_published = true
  )
);
create policy "post saves own delete"
on public.post_saves for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "follows own" on public.follows;
create policy "follows own read"
on public.follows for select to authenticated
using (user_id = (select auth.uid()));
create policy "follows own insert"
on public.follows for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.cultural_profiles cp
    where cp.id = follows.cultural_profile_id
      and cp.is_published = true
  )
);
create policy "follows own delete"
on public.follows for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "favorites own" on public.favorites;
create policy "favorites own read"
on public.favorites for select to authenticated
using (user_id = (select auth.uid()));
create policy "favorites own insert"
on public.favorites for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.cultural_profiles cp
    where cp.id = favorites.cultural_profile_id
      and cp.is_published = true
  )
);
create policy "favorites own delete"
on public.favorites for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "comments own insert" on public.post_comments;
create policy "comments own insert"
on public.post_comments for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.cultural_posts p
    where p.id = post_comments.post_id
      and p.is_published = true
  )
);
