-- ORIGEN Cultural: STAGING Auth/consent CONFIGURATION audit. READ ONLY.
-- Execute exclusively in project egujmptgnrpajgfpjjxu.
-- Does NOT prove Supabase Auth Dashboard has ACTIVATED the hook.
-- Does NOT create users or test signup over network; P0 #6 remains open.
with checks as (
 select 'auth.users has active application signup trigger' as check_name,
   exists (
     select 1 from pg_trigger t
     where t.tgrelid='auth.users'::regclass
     and t.tgname='on_auth_user_created'
     and t.tgenabled='O'
     and pg_get_triggerdef(t.oid) like '%private.handle_new_user%'
   ) as pass
 union all select 'private signup trigger is SECURITY DEFINER',
   exists (
     select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='private' and p.proname='handle_new_user'
       and p.prosecdef and p.prorettype='trigger'::regtype
   )
 union all select 'signup trigger rejects missing legal acknowledgement',
   exists (
     select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='private' and p.proname='handle_new_user'
       and position('accepted_legal' in pg_get_functiondef(p.oid))>0
       and position('IS DISTINCT FROM' in upper(pg_get_functiondef(p.oid)))>0
   )
 union all select 'signup trigger rejects anonymous and non-email provider',
   exists (
     select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='private' and p.proname='handle_new_user'
       and position('is_anonymous' in pg_get_functiondef(p.oid))>0
       and position('raw_app_meta_data' in pg_get_functiondef(p.oid))>0
   )
 union all select 'signup trigger sets legal versions on server',
   exists (
     select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='private' and p.proname='handle_new_user'
       and position('public.legal_acceptances' in pg_get_functiondef(p.oid))>0
       and position('v1.2' in pg_get_functiondef(p.oid))>0
       and position('terms_version' in pg_get_functiondef(p.oid))>0
   )
 union all select 'pre-auth consent function exists and is not SECURITY DEFINER',
   exists (
     select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname='origen_before_user_created'
       and p.pronargs=1 and not p.prosecdef
   )
 union all select 'only Supabase Auth service role can execute hook',
   coalesce((
     select has_function_privilege('supabase_auth_admin',p.oid,'EXECUTE')
       and not has_function_privilege('anon',p.oid,'EXECUTE')
       and not has_function_privilege('authenticated',p.oid,'EXECUTE')
     from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname='origen_before_user_created'
   ),false)
 union all select 'pre-auth hook checks provider consent and anonymous metadata',
   exists (
     select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname='origen_before_user_created'
       and position('accepted_legal' in pg_get_functiondef(p.oid))>0
       and position('is_anonymous' in pg_get_functiondef(p.oid))>0
       and position('app_metadata' in pg_get_functiondef(p.oid))>0
   )
 union all select 'legal acceptance table has RLS enabled',
   exists (
     select 1 from pg_class c
     where c.oid='public.legal_acceptances'::regclass and c.relrowsecurity
   )
 union all select 'client cannot directly insert legal receipt',
   not has_table_privilege('anon','public.legal_acceptances','INSERT')
   and not has_table_privilege('authenticated','public.legal_acceptances','INSERT')
 union all select 'staging contains no real users yet',
   (select count(*)=0 from auth.users)
)
select check_name,pass,coalesce(bool_and(pass) over(),false) as all_checks_pass
from checks order by check_name;

-- Outside SQL: must separately confirm Auth > Hooks > Before User Created
-- is enabled, using public.origen_before_user_created (Postgres hook), then
-- test real synthetic Auth signups/denials and email confirmation flow.
