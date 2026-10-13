-- ORIGEN Cultural — Staging-only READ-ONLY moderation configuration audit.
-- Catalog only: no personal report rows, no Auth users, no test inserts, no writes.
-- CONFIG_PASS means catalog evidence, NOT real-user RLS proof or pilot readiness.
-- ACTION_REQUIRED identifies a mandatory operational blocker before public beta.
WITH facts AS (
  SELECT
    (SELECT relrowsecurity FROM pg_class WHERE oid='public.moderation_reports'::regclass) AS rls_on,
    NOT (has_table_privilege('anon','public.moderation_reports','select')
      OR has_table_privilege('anon','public.moderation_reports','insert')
      OR has_table_privilege('anon','public.moderation_reports','update')
      OR has_table_privilege('anon','public.moderation_reports','delete')) AS anon_blocked,
    (has_table_privilege('authenticated','public.moderation_reports','select')
      AND has_table_privilege('authenticated','public.moderation_reports','insert')) AS auth_can_report,
    NOT (has_table_privilege('authenticated','public.moderation_reports','update')
      OR has_table_privilege('authenticated','public.moderation_reports','delete')) AS client_cannot_change_decisions,
    EXISTS (SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='moderation_reports' AND cmd='INSERT'
        AND 'authenticated'=ANY(roles)
        AND with_check ILIKE '%reporter_user_id%'
        AND with_check ILIKE '%auth.uid()%') AS reporter_bound_to_jwt,
    EXISTS (SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='moderation_reports' AND cmd='INSERT'
        AND with_check ILIKE '%status%'
        AND with_check ILIKE '%open%'
        AND with_check ILIKE '%resolved_at%') AS new_report_stays_open,
    EXISTS (SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='moderation_reports' AND cmd='SELECT'
        AND qual ILIKE '%reporter_user_id%'
        AND qual ILIKE '%auth.uid()%'
        AND qual ILIKE '%private.is_admin()%') AS reporter_or_admin_read,
    NOT EXISTS (SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename='moderation_reports'
        AND 'anon'=ANY(roles)) AS no_anon_policies,
    EXISTS (SELECT 1 FROM pg_trigger
      WHERE tgrelid='public.moderation_reports'::regclass
        AND tgname='moderation_reports_spam_guard'
        AND tgenabled IN ('O','A')) AS spam_trigger_enabled,
    EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='private' AND p.proname='limit_report_spam'
        AND p.prosecdef AND pg_get_functiondef(p.oid) ILIKE '%n >= 20%'
        AND pg_get_functiondef(p.oid) ILIKE '%interval ''1 hour''%') AS spam_hourly_threshold,
    EXISTS (SELECT 1 FROM pg_constraint
      WHERE conrelid='public.moderation_reports'::regclass
        AND conname='moderation_reports_status_check'
        AND pg_get_constraintdef(oid) ILIKE '%resolved%'
        AND pg_get_constraintdef(oid) ILIKE '%dismissed%') AS decision_status_limited,
    EXISTS (SELECT 1 FROM pg_constraint
      WHERE conrelid='public.moderation_reports'::regclass
        AND conname='moderation_reports_details_len'
        AND pg_get_constraintdef(oid) ILIKE '%6000%') AS details_max_length,
    EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='private' AND p.proname='is_admin' AND p.prosecdef
        AND pg_get_functiondef(p.oid) ILIKE '%auth.uid()%') AS private_admin_check,
    EXISTS (SELECT 1 FROM pg_trigger
      WHERE tgrelid='public.profiles'::regclass
        AND tgname='profiles_protect_privileged_fields'
        AND tgenabled IN ('O','A')) AS roles_trigger_enabled,
    EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname='private' AND p.proname='protect_profile_privileged_fields'
        AND p.prosecdef
        AND pg_get_functiondef(p.oid) ILIKE '%new.role is distinct from old.role%') AS role_change_blocked,
    (has_table_privilege('authenticated','public.moderation_reports','update')
       AND EXISTS (SELECT 1 FROM pg_policies
         WHERE schemaname='public' AND tablename='moderation_reports' AND cmd='UPDATE')) AS direct_admin_resolution_ready
)
SELECT v.check_name,
  CASE WHEN v.check_name='authorised_resolution_workflow'
    THEN CASE WHEN v.ok THEN 'NEEDS_HUMAN_E2E' ELSE 'ACTION_REQUIRED' END
    ELSE CASE WHEN v.ok THEN 'CONFIG_PASS' ELSE 'CONFIG_FAIL' END
  END AS status,
  v.reason
FROM facts f,
LATERAL (VALUES
 ('rls_enabled',f.rls_on,'RLS must be enabled'),
 ('anon_has_no_table_privileges',f.anon_blocked,'Anonymous access blocked by SQL grants'),
 ('authenticated_can_submit_and_read',f.auth_can_report,'Authenticated report access exists'),
 ('clients_cannot_update_or_delete_reports',f.client_cannot_change_decisions,'No browser authority to resolve or remove'),
 ('insert_binds_reporter_to_jwt',f.reporter_bound_to_jwt,'New reports must belong to the current user'),
 ('insert_requires_open_status',f.new_report_stays_open,'Client must not submit resolved decisions'),
 ('report_select_owner_or_admin',f.reporter_or_admin_read,'Private report read policy'),
 ('no_anonymous_moderation_policies',f.no_anon_policies,'No anon RLS policy'),
 ('spam_trigger_active',f.spam_trigger_enabled,'Report spam trigger is enabled'),
 ('spam_guard_20_per_hour',f.spam_hourly_threshold,'Function configuration limit; no behavioral test'),
 ('decision_status_constraint',f.decision_status_limited,'Decision enum is constrained'),
 ('details_length_constraint',f.details_max_length,'Details constrained to <= 6000 characters'),
 ('private_admin_helper',f.private_admin_check,'Protected admin role lookup'),
 ('profile_role_guard_active',f.roles_trigger_enabled,'Role-change protection trigger active'),
 ('profile_role_change_guard',f.role_change_blocked,'Non-admin cannot change role to admin'),
 ('authorised_resolution_workflow',f.direct_admin_resolution_ready,
  'No authorised report-resolution action/decision log E2E yet; do NOT open pilot')
) AS v(check_name,ok,reason)
ORDER BY v.check_name;
