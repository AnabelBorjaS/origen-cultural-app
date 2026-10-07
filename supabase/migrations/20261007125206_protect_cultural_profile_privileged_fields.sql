-- ORIGEN Cultural
-- Mirrors Supabase Production migration:
-- 20261007125206 protect_cultural_profile_privileged_fields
--
-- Purpose:
-- Cultural-profile owners may edit normal profile content, but must not be
-- able to self-assign verification/ownership/editorial state or manipulate
-- follower counters. Those fields remain controlled by ORIGEN's privileged
-- review/claim flows.

create or replace function private.protect_cultural_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if old.owner_id = (select auth.uid()) then
    if new.owner_id is distinct from old.owner_id
       or new.status is distinct from old.status
       or new.verified_at is distinct from old.verified_at
       or new.reference_source is distinct from old.reference_source
       or new.reference_source_url is distinct from old.reference_source_url
       or new.follower_count is distinct from old.follower_count
    then
      raise exception 'privileged cultural profile fields cannot be changed by profile owners';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.protect_cultural_profile_privileged_fields()
from public, anon, authenticated;

drop trigger if exists cultural_profiles_protect_privileged_fields
on public.cultural_profiles;

create trigger cultural_profiles_protect_privileged_fields
before update on public.cultural_profiles
for each row
execute function private.protect_cultural_profile_privileged_fields();
