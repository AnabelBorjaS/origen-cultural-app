-- Historical SQL snapshot READ FROM Supabase Staging migration history on 2026-10-10.
-- Already applied to Staging egujmptgnrpajgfpjjxu; DO NOT EXECUTE AGAIN.
-- Not a Production migration. Requires migration review and legal validation before promotion.
-- STAGING ONLY. Supabase Auth Before User Created hook candidate.
-- Creating it does NOT enable it in Auth > Hooks.
create or replace function public.origen_before_user_created(event jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $origen_pre_auth$
begin
  if event #>> '{user,app_metadata,provider}' is distinct from 'email'
     or event #> '{user,user_metadata,accepted_legal}' is distinct from 'true'::jsonb
     or event #> '{user,is_anonymous}' is distinct from 'false'::jsonb
  then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'ORIGEN requires explicit legal acknowledgement for email signup.'
      )
    );
  end if;
  return '{}'::jsonb;
end;
$origen_pre_auth$;

revoke all on function public.origen_before_user_created(jsonb)
  from public, anon, authenticated;
grant execute on function public.origen_before_user_created(jsonb)
  to supabase_auth_admin;
