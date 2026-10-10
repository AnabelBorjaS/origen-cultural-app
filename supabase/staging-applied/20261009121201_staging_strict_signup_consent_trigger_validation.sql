-- Historical SQL snapshot READ FROM Supabase Staging migration history on 2026-10-10.
-- Already applied to Staging egujmptgnrpajgfpjjxu; DO NOT EXECUTE AGAIN.
-- Not a Production migration. Requires migration review and legal validation before promotion.
-- STAGING TEST ONLY: require explicit essential-document acknowledgement.
-- Keeps the existing Auth profile trigger and role mapping.
-- No changes are authorized for ORIGEN Cultural Production.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $origen_strict_registration$
declare
  requested_role public.user_role;
begin
  if new.raw_user_meta_data -> 'accepted_legal' is distinct from 'true'::jsonb
     or new.is_anonymous is distinct from false
     or new.raw_app_meta_data->>'provider' is distinct from 'email'
  then
    raise exception 'ORIGEN requires explicit legal acknowledgement for email signup'
      using errcode = '22023';
  end if;

  requested_role :=
    case
      when new.raw_user_meta_data->>'account_type' = 'creator' then 'creator'::public.user_role
      else 'explorer'::public.user_role
    end;

  insert into public.profiles (
    id, role, display_name, location, story, categories, links
  ) values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    nullif(new.raw_user_meta_data->>'location', ''),
    nullif(new.raw_user_meta_data->>'story', ''),
    coalesce(
      array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data->'categories','[]'::jsonb))),
      '{}'::text[]
    ),
    case
      when jsonb_typeof(new.raw_user_meta_data->'links') = 'object'
      then new.raw_user_meta_data->'links'
      else '{}'::jsonb
    end
  ) on conflict (id) do nothing;

  insert into public.legal_acceptances (
    user_id, terms_version, privacy_version,
    community_guidelines_version, cultural_rights_version
  ) values (
    new.id, 'v1.2', 'v1.2', 'v1.2', 'v1.2'
  );

  return new;
end;
$origen_strict_registration$;
