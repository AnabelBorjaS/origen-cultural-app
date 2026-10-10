-- ORIGEN Cultural — proposed server-side signup consent controls
-- STATUS: REVIEW ONLY — NOT DEPLOYED; DO NOT RUN IN PRODUCTION.
-- Derived from read-only audit of private.handle_new_user() on 2026-10-08.
-- Server-side enforcement is currently MISSING in Production.
--
-- Staging acceptance conditions:
--   - Only email signup with boolean user_metadata.accepted_legal=true.
--   - Missing, false, string "true", number 1, null and anonymous signups rejected.
--   - Unsupported OAuth/phone/invitation paths intentionally rejected in this
--     controlled beta until a separately-reviewed consent flow exists.
--   - The acceptance record gets server-owned document versions v1.2.
--   - No user or public profile is created on rejection.
--   - Test using two real disposable staging accounts; run Security Advisor.
--
-- Recommended activation sequence (only after review, STAGING FIRST):
-- 1. In staging, inspect current Auth hooks, supported signup providers and
--    the function definition of private.handle_new_user(). Make a logical
--    backup of staging before modifying behavior.
-- 2. Install this SQL via an approved, tracked migration (not this proposal).
-- 3. In Auth > Hooks, select the public.origen_before_user_created function
--    for the Before User Created event. Creating a function alone does NOT
--    activate the Auth hook. Do not enable before staging QA is prepared.
-- 4. Exercise good/bad payloads and direct Auth API negative cases.
-- 5. Validate profile/acceptance lifecycle and server-owned versions.
-- 6. Have a rollback plan for hook setting + function changes. Document
--    invite/admin workflows before any production adoption.

-- Pre-insert blocking hook. Depends only on event JSON, no user tables.
-- Keep this function inaccessible from the browser/Data API.
create or replace function public.origen_before_user_created(event jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $origen_hook$
begin
  if event #>> '{user,app_metadata,provider}' is distinct from 'email'
     or event #> '{user,user_metadata,accepted_legal}' is distinct from 'true'::jsonb
     or event #> '{user,is_anonymous}' = 'true'::jsonb
  then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'ORIGEN signup requires explicit acceptance of the essential documents.'
      )
    );
  end if;

  return '{}'::jsonb;
end;
$origen_hook$;

revoke all on function public.origen_before_user_created(jsonb)
  from public, anon, authenticated;
grant execute on function public.origen_before_user_created(jsonb)
  to supabase_auth_admin;

-- Defence in depth for users inserted without going through this Auth hook.
-- This REPLACES the currently verified private.handle_new_user() function.
-- It keeps the existing profile data mapping, but rejects missing consent and
-- pins legal versions on the server.
-- Caution: invitations/admin provisioning without explicit acceptance will
-- fail; that is intentional during this beta until a reviewed flow exists.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $origen_user$
declare
  requested_role public.user_role;
begin
  if new.raw_user_meta_data -> 'accepted_legal'
     is distinct from 'true'::jsonb
  then
    raise exception 'ORIGEN legal acknowledgement required for signup'
      using errcode = '22023';
  end if;

  requested_role :=
    case
      when new.raw_user_meta_data->>'account_type' = 'creator'
        then 'creator'::public.user_role
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

  insert into public.legal_acceptances (
    user_id, terms_version, privacy_version,
    community_guidelines_version, cultural_rights_version
  )
  values (
    new.id, 'v1.2', 'v1.2', 'v1.2', 'v1.2'
  );

  return new;
end;
$origen_user$;

-- Permission and schema checks required in staging, not included here:
-- * Verify supabase_auth_admin can EXECUTE the public Auth hook.
-- * Verify anon/authenticated/PUBLIC cannot execute it.
-- * Confirm private.handle_new_user() still has the trigger and only intended
--   privileges. Keep SECURITY DEFINER isolated to the private schema.
-- * Confirm legal_acceptances cannot be arbitrarily INSERTed by clients.
-- * Validate signup with email confirmation on, failed request rollbacks,
--   auth password recovery, login and admin invites.
