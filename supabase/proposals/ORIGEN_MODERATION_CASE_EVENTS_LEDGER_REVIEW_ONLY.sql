-- ORIGEN CULTURAL — REVIEW-ONLY DATABASE CHANGE PROPOSAL
-- STATUS: NOT DEPLOYED. DO NOT APPLY UNTIL server-side reviewer auth,
-- incident/retention requirements and two-account tests are approved.
-- Destination if approved: isolated Supabase STAGING only, NEVER Production.
-- APPEND-ONLY CASE AUDIT LOG: records a HUMAN REVIEW RECOMMENDATION,
-- not an instruction to hide posts, purge Storage, or punish a user.
--
-- This is an explicit proposal file, NOT an automatic migration.
-- No PUBLIC/anon/authenticated/service_role role can insert/read through
-- browser/PostgREST. Operations must later go through a separately reviewed
-- protected backend that validates the real authenticated admin, using a
-- dedicated minimally privileged DB role (not the browser's publishable key).
-- Do NOT expose a SECURITY DEFINER RPC in the public schema.

BEGIN;

CREATE TABLE private.moderation_case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.moderation_reports(id) ON DELETE RESTRICT,
  reviewer_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  idempotency_key uuid NOT NULL UNIQUE,
  event_kind text NOT NULL CHECK (event_kind IN (
    'review_started',
    'information_requested',
    'recommended_correction',
    'recommended_restriction',
    'recommended_dismissal',
    'escalated_for_review',
    'appeal_received',
    'appeal_reconsidered'
  )),
  rationale text NOT NULL CHECK (
    char_length(btrim(rationale)) BETWEEN 20 AND 2000
  ),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE private.moderation_case_events IS
  'Restricted proposed review-event audit; NOT a deployed human moderation workflow, not an automatic enforcement path.';
COMMENT ON COLUMN private.moderation_case_events.rationale IS
  'Brief non-sensitive decision explanation only; NO identity documents, secret cultural knowledge, or raw evidence.';

CREATE INDEX moderation_case_events_report_time_idx
  ON private.moderation_case_events (report_id, recorded_at DESC);

ALTER TABLE private.moderation_case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.moderation_case_events FORCE ROW LEVEL SECURITY;

-- No RLS policies intentionally: browser role access is denied.
-- Explicit REVOKE compensates for database/project default grants.
REVOKE ALL ON TABLE private.moderation_case_events
  FROM PUBLIC, anon, authenticated, service_role;

-- A defense-in-depth append-only guard: ordinary UPDATE/DELETE operations
-- are rejected even when executed with privileged table permissions.
-- DB superusers/owners can still change schema or disable triggers; this
-- is not cryptographic or absolute immutability.
CREATE FUNCTION private.reject_moderation_case_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $function$
BEGIN
  RAISE EXCEPTION 'moderation event log cannot be updated or deleted';
END;
$function$;

REVOKE ALL ON FUNCTION private.reject_moderation_case_event_mutation()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER moderation_case_events_append_only
BEFORE UPDATE OR DELETE ON private.moderation_case_events
FOR EACH ROW EXECUTE FUNCTION private.reject_moderation_case_event_mutation();

-- Deployment gate: only after architecture review, retention decisions and
-- server function validation. Do not grant SELECT/INSERT to browser roles.
COMMIT;
