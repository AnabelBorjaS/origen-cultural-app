-- ORIGEN: editorial-bypass and privileged post fields audit.
-- READ-ONLY, isolated STAGING only: egujmptgnrpajgfpjjxu.
-- A passing catalog check does NOT prove that an authenticated JWT request
-- cannot bypass RLS; end-to-end A/B tests and moderation remain mandatory.
with controls as (
select 'creator-only post INSERT RLS policy exists' as test,
exists (
  select 1 from pg_policies
  where schemaname='public' and tablename='cultural_posts'
    and cmd='INSERT' and 'authenticated'=any(roles)
    and policyname='creator posts own insert'
    and with_check like '%creator%'
    and with_check like '%author_id%'
) as pass
union all select 'editorial=true forbidden on creator INSERT',
exists (
  select 1 from pg_policies
  where schemaname='public' and tablename='cultural_posts'
    and policyname='creator posts own insert'
    and with_check ilike '%is_editorial = false%'
)
union all select 'editorial source fields forbidden on creator INSERT',
exists (
  select 1 from pg_policies
  where schemaname='public' and tablename='cultural_posts'
    and policyname='creator posts own insert'
    and with_check ilike '%source_label IS NULL%'
    and with_check ilike '%source_url IS NULL%'
)
union all select 'inflated engagement counters forbidden on INSERT',
exists (
  select 1 from pg_policies
  where schemaname='public' and tablename='cultural_posts'
    and policyname='creator posts own insert'
    and with_check ilike '%like_count = 0%'
    and with_check ilike '%comment_count = 0%'
)
union all select 'own post UPDATE has author ownership check',
exists (
  select 1 from pg_policies
  where schemaname='public' and tablename='cultural_posts'
    and cmd='UPDATE' and 'authenticated'=any(roles)
    and qual ilike '%author_id%'
    and with_check ilike '%author_id%'
)
union all select 'post privileged fields trigger enabled',
exists (
  select 1 from pg_trigger
  where tgrelid='public.cultural_posts'::regclass
    and tgname='cultural_posts_protect_privileged_fields'
    and tgenabled='O'
)
union all select 'post UPDATE prevents editorial/source/counter/author changes',
exists (
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='private' and p.proname='protect_post_privileged_fields'
    and pg_get_functiondef(p.oid) like '%new.is_editorial%'
    and pg_get_functiondef(p.oid) like '%new.source_label%'
    and pg_get_functiondef(p.oid) like '%new.source_url%'
    and pg_get_functiondef(p.oid) like '%new.like_count%'
    and pg_get_functiondef(p.oid) like '%new.comment_count%'
    and pg_get_functiondef(p.oid) like '%new.author_id%'
)
union all select 'regular users cannot execute privileged guard directly',
exists (
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='private' and p.proname='protect_post_privileged_fields'
    and not has_function_privilege('anon',p.oid,'EXECUTE')
    and not has_function_privilege('authenticated',p.oid,'EXECUTE')
)
union all select 'cultural declarations mandatory when noneditorial',
exists (
  select 1 from pg_constraint
  where conrelid='public.cultural_posts'::regclass
    and conname='origen_user_post_rights_explicit'
    and pg_get_constraintdef(oid) ilike '%is_editorial IS TRUE%'
    and pg_get_constraintdef(oid) ilike '%rights_acknowledged IS TRUE%'
    and pg_get_constraintdef(oid) ilike '%cultural_acknowledged IS TRUE%'
)
union all select 'noneditorial post insert creates private audit',
exists (
  select 1 from pg_trigger
  where tgrelid='public.cultural_posts'::regclass
    and tgname='origen_post_rights_after_insert'
    and tgenabled='O'
    and pg_get_triggerdef(oid) ilike '%private.record_cultural_post_rights%'
)
union all select 'attempted rights/content edits trigger fail-closed guard',
exists (
  select 1 from pg_trigger
  where tgrelid='public.cultural_posts'::regclass
    and tgname='origen_post_rights_before_update'
    and tgenabled='O'
    and pg_get_triggerdef(oid) ilike '%private.protect_cultural_post_rights_on_update%'
)
union all select 'no anonymous write privilege to cultural posts',
not has_table_privilege('anon','public.cultural_posts','INSERT')
  and not has_table_privilege('anon','public.cultural_posts','UPDATE')
union all select 'post table row level security active',
(select relrowsecurity from pg_class where oid='public.cultural_posts'::regclass)
)
select test,pass,coalesce(bool_and(pass) over(),false) as all_checks_pass
from controls order by test;

-- Still OPEN even if all 13 pass:
-- 1. Real A/B REST/JWT tests for editorial flag spoofing, privileged updates.
-- 2. Failure transaction rollback and private rights evidence lifecycle.
-- 3. Direct table-level INSERT/UPDATE grants remain broad for authenticated;
--    consider least-privilege COLUMN GRANT redesign with client contract tests,
--    not unreviewed direct changes to a running beta.
-- 4. Legal permissions and editorial labeling/appeal/moderation protocol.
