-- ORIGEN Cultural — REVIEW ONLY, UNDEPLOYED private publication request ledger.
-- Intended only for isolated Supabase STAGING egujmptgnrpajgfpjjxu.
-- IMPORTANT: This schema does NOT provide a public RPC or working backend.
-- Applying it later requires a separately reviewed restricted server database
-- adapter and true two-account JWT/Storage E2E tests.
-- Test this proposal using BEGIN/ROLLBACK only; do not COMMIT via CI.
BEGIN;

DO $preflight$
BEGIN
  IF (SELECT count(*) FROM auth.users)<>0
     OR (SELECT count(*) FROM public.cultural_posts)<>0
     OR (SELECT count(*) FROM storage.objects)<>0
  THEN RAISE EXCEPTION 'Private-ledger review requires empty STAGING'; END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='post-media-intake' AND public IS FALSE)
  THEN RAISE EXCEPTION 'Private cultural intake must exist first'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='cultural_posts' AND policyname='creator posts own insert'
    AND with_check='false')
  THEN RAISE EXCEPTION 'Cultural public publishing must remain blocked'; END IF;
  IF to_regclass('private.cultural_publication_requests') IS NOT NULL
  THEN RAISE EXCEPTION 'Request ledger already exists; reconcile manually'; END IF;
END;
$preflight$;

-- Only a trusted BACKEND will insert after verifying JWT, current creator
-- role, all private Storage object ownership + actual metadata, both consent
-- attestations and an idempotency key under a serialized lock. Browser roles
-- cannot read, write, or delete this table.
CREATE TABLE private.cultural_publication_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  idempotency_key uuid NOT NULL,
  request_payload jsonb NOT NULL CHECK (jsonb_typeof(request_payload)='object'),
  rights_statement_version text NOT NULL
    CHECK (rights_statement_version='v1.2'),
  cultural_statement_version text NOT NULL
    CHECK (cultural_statement_version='v1.2'),
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status='pending_review'),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(actor_id,idempotency_key)
);

ALTER TABLE private.cultural_publication_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.cultural_publication_requests FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.cultural_publication_requests
  FROM PUBLIC,anon,authenticated,service_role;

-- Request records are immutable. Later review decisions need separate
-- append-only events and never overwrite the original rights attestation.
CREATE FUNCTION private.reject_publication_request_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $body$
BEGIN
  RAISE EXCEPTION 'ORIGEN publication requests are immutable'
    USING ERRCODE='42501';
END;
$body$;
REVOKE ALL ON FUNCTION private.reject_publication_request_mutation()
  FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER origen_publication_requests_immutable
BEFORE UPDATE OR DELETE ON private.cultural_publication_requests
FOR EACH ROW EXECUTE FUNCTION private.reject_publication_request_mutation();

DO $postflight$
BEGIN
  IF (SELECT count(*) FROM pg_policies WHERE schemaname='private'
    AND tablename='cultural_publication_requests')<>0
  OR EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role')
    AND (has_table_privilege(rolname,'private.cultural_publication_requests','SELECT') OR
      has_table_privilege(rolname,'private.cultural_publication_requests','INSERT') OR
      has_table_privilege(rolname,'private.cultural_publication_requests','UPDATE') OR
      has_table_privilege(rolname,'private.cultural_publication_requests','DELETE'))
  )
  OR NOT EXISTS (
    SELECT 1 FROM pg_class WHERE oid='private.cultural_publication_requests'::regclass
      AND relrowsecurity AND relforcerowsecurity
  )
  THEN RAISE EXCEPTION 'Private ledger is not locked from browser roles'; END IF;
END;
$postflight$;

ROLLBACK;
