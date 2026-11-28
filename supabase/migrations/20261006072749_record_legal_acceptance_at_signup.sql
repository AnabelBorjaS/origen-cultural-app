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

  if coalesce((new.raw_user_meta_data->>'accepted_legal')::boolean, false) then
    insert into public.legal_acceptances (
      user_id, terms_version, privacy_version,
      community_guidelines_version, cultural_rights_version
    )
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'terms_version','v1.2'),
      coalesce(new.raw_user_meta_data->>'privacy_version','v1.2'),
      coalesce(new.raw_user_meta_data->>'community_guidelines_version','v1.2'),
      coalesce(new.raw_user_meta_data->>'cultural_rights_version','v1.2')
    );
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
