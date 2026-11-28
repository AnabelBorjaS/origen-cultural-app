-- ORIGEN Cultural — P0 #7 staging rights/attestation READ-ONLY audit
-- READ-ONLY SELECT; do not add any account or cultural content.
-- This checks SCHEMA CONFIGURATION, not end-to-end Auth/RLS behavior.
-- Staging project: egujmptgnrpajgfpjjxu, distinct from Production.
-- Expected: each check PASS=true; any FAIL blocks real-user pilot.
-- Re-run after schema/security changes. Do not mistake PASS for P0 closure.
WITH checks AS (
  SELECT 'non-editorial post requires both declarations' AS check_name,
    EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'public.cultural_posts'::regclass
        AND conname = 'origen_user_post_rights_explicit'
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%rights_acknowledged IS TRUE%'
        AND pg_get_constraintdef(oid) ILIKE '%cultural_acknowledged IS TRUE%'
    ) AS pass
  UNION ALL
  SELECT 'rights boolean is NOT NULL and defaults FALSE',
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cultural_posts'
        AND column_name='rights_acknowledged'
        AND data_type='boolean' AND is_nullable='NO'
        AND column_default='false'
    )
  UNION ALL
  SELECT 'cultural boolean is NOT NULL and defaults FALSE',
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='cultural_posts'
        AND column_name='cultural_acknowledged'
        AND data_type='boolean' AND is_nullable='NO'
        AND column_default='false'
    )
  UNION ALL
  SELECT 'insert attestation trigger enabled',
    EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid='public.cultural_posts'::regclass
        AND tgname='origen_post_rights_after_insert'
        AND tgenabled='O'
        AND pg_get_triggerdef(oid) ILIKE '%AFTER INSERT%'
        AND pg_get_triggerdef(oid) ILIKE '%private.record_cultural_post_rights%'
    )
  UNION ALL
  SELECT 'content update attestation trigger enabled',
    EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgrelid='public.cultural_posts'::regclass
        AND tgname='origen_post_rights_before_update'
        AND tgenabled='O'
        AND pg_get_triggerdef(oid) ILIKE '%BEFORE UPDATE%'
        AND pg_get_triggerdef(oid) ILIKE '%private.protect_cultural_post_rights_on_update%'
    )
  UNION ALL
  SELECT 'private attestation log with RLS enabled',
    EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='private'
        AND c.relname='cultural_post_rights_events'
        AND c.relkind='r' AND c.relrowsecurity
    )
  UNION ALL
  SELECT 'browser roles cannot SELECT private attestation log',
    NOT has_table_privilege('anon','private.cultural_post_rights_events','SELECT')
      AND NOT has_table_privilege('authenticated','private.cultural_post_rights_events','SELECT')
  UNION ALL
  SELECT 'browser roles cannot INSERT private attestation log',
    NOT has_table_privilege('anon','private.cultural_post_rights_events','INSERT')
      AND NOT has_table_privilege('authenticated','private.cultural_post_rights_events','INSERT')
  UNION ALL
  SELECT 'internal trigger functions not directly executable by browser',
    COALESCE((
      SELECT count(*) = 2
         AND bool_and(p.prosecdef)
         AND bool_and(NOT has_function_privilege('anon',p.oid,'EXECUTE'))
         AND bool_and(NOT has_function_privilege('authenticated',p.oid,'EXECUTE'))
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='private'
        AND p.proname IN ('record_cultural_post_rights','protect_cultural_post_rights_on_update')
    ),false)
  UNION ALL
  SELECT 'server versions and authenticated author guard in trigger',
    COALESCE((
      SELECT pg_get_functiondef(p.oid) LIKE '%auth.uid()%'
         AND pg_get_functiondef(p.oid) LIKE '%new.author_id%'
         AND pg_get_functiondef(p.oid) LIKE '%v1.2%'
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='private' AND p.proname='record_cultural_post_rights'
    ),false)
)
SELECT check_name,pass,bool_and(pass) OVER () AS all_checks_pass
FROM checks ORDER BY check_name;

-- Separate, REQUIRED integration tests not covered here:
-- 1. With two real disposable staging Auth users, verify creator+explorer
--    RLS ownership, direct REST inserts, false/missing declaration rejection.
-- 2. Verify server-written audit event for valid creator publication,
--    transactional rollback on audit failure and disabled edit bypasses.
-- 3. Verify public media withdrawal/CDN, moderation, legal retention and
--    account deletion; review before any Production release.
