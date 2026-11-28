drop policy if exists "profiles public read" on public.profiles;

create policy "profiles creator public own admin read"
on public.profiles
for select
to anon, authenticated
using (
  role = 'creator'::user_role
  or id = (select auth.uid())
  or (select private.is_admin())
);
