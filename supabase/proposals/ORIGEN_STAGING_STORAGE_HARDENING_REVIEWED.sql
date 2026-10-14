-- ORIGEN Cultural — Staging-only reviewed Storage RLS hardening.
-- PROJECT: egujmptgnrpajgfpjjxu (isolated STAGING). NEVER apply to Production.
-- This proposal deliberately leaves the post-media bucket PUBLIC until a
-- separately audited PRIVATE quarantine/promote workflow exists.
-- Apply only to the explicitly selected Staging project via Supabase MCP,
-- after a rollback dry run and empty-project preflight.
--
-- No new tables/functions/grants/service-role credentials or broad access.
-- Avatars and covers can still INSERT and UPDATE under owner-id/folder checks.
-- Cultural post-media can be INSERTed only by current profile role creator
-- and NEVER UPDATEd through browser Storage policies, even by its owner.
-- Existing owner DELETE and public SELECT policies are left unchanged.
BEGIN;

DO $preflight$
DECLARE policy_count integer;
BEGIN
  IF (SELECT count(*) FROM auth.users) <> 0
    OR (SELECT count(*) FROM public.profiles) <> 0
    OR (SELECT count(*) FROM public.cultural_posts) <> 0
    OR (SELECT count(*) FROM storage.objects WHERE bucket_id IN ('post-media','avatars','covers')) <> 0
  THEN RAISE EXCEPTION 'STAGING ONLY: expected empty Auth/Post/Storage; abort this change'; END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='storage.objects'::regclass AND relrowsecurity)
  THEN RAISE EXCEPTION 'storage.objects must have RLS enabled'; END IF;

  SELECT count(*) INTO policy_count FROM pg_policies
  WHERE schemaname='storage' AND tablename='objects';
  IF policy_count <> 4 OR
     NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
       AND policyname='users upload own media' AND cmd='INSERT' AND roles=ARRAY['authenticated']::name[]) OR
     NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
       AND policyname='users update own media' AND cmd='UPDATE' AND roles=ARRAY['authenticated']::name[]) OR
     NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
       AND policyname='users delete own media' AND cmd='DELETE') OR
     NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
       AND policyname='public media read' AND cmd='SELECT')
  THEN RAISE EXCEPTION 'Unexpected Storage RLS policy set; review before editing'; END IF;
END;
$preflight$;

ALTER POLICY "users upload own media" ON storage.objects
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    AND (
      bucket_id IN ('avatars','covers')
      OR (
        bucket_id='post-media'
        AND EXISTS (
          SELECT 1 FROM public.profiles pr
          WHERE pr.id=(SELECT auth.uid()) AND pr.role='creator'
        )
      )
    )
  );

ALTER POLICY "users update own media" ON storage.objects
  TO authenticated
  USING (
    bucket_id IN ('avatars','covers')
    AND auth.uid() IS NOT NULL
    AND owner_id=(SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id IN ('avatars','covers')
    AND auth.uid() IS NOT NULL
    AND owner_id=(SELECT auth.uid())::text
    AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
  );

DO $postflight$
DECLARE insert_rule text; update_rule text; update_check text;
BEGIN
  SELECT with_check INTO insert_rule FROM pg_policies
   WHERE schemaname='storage' AND tablename='objects' AND policyname='users upload own media';
  SELECT qual,with_check INTO update_rule,update_check FROM pg_policies
   WHERE schemaname='storage' AND tablename='objects' AND policyname='users update own media';
  IF insert_rule IS NULL OR insert_rule NOT ILIKE '%public.profiles%' OR
     insert_rule NOT ILIKE '%creator%' OR insert_rule NOT ILIKE '%post-media%' OR
     update_rule IS NULL OR update_rule ILIKE '%post-media%' OR
     update_check IS NULL OR update_check ILIKE '%post-media%' OR
     update_rule NOT ILIKE '%avatars%' OR update_rule NOT ILIKE '%covers%' OR
     update_check NOT ILIKE '%owner_id%'
  THEN RAISE EXCEPTION 'Postflight Storage policy expression mismatch'; END IF;
END;
$postflight$;

COMMIT;
