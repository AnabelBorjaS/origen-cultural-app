-- ORIGEN Cultural — temporary fail-closed cultural post publishing policy.
-- Scope: isolated Staging project egujmptgnrpajgfpjjxu ONLY.
-- NO PRODUCTION / main / public domain edits. Restore only after server-side
-- verified private-intake-to-published promotion and two-account E2E passes.
BEGIN;
DO $guard$
DECLARE p record;
BEGIN
 IF (SELECT count(*) FROM auth.users)>0
 OR (SELECT count(*) FROM public.cultural_posts)>0
 OR (SELECT count(*) FROM storage.objects)>0
 THEN RAISE EXCEPTION 'Staging no longer empty; review before changing policy'; END IF;
 IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='post-media-intake' AND public IS FALSE)
 THEN RAISE EXCEPTION 'Private media intake must already exist'; END IF;
 IF EXISTS (
   SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
   AND cmd='INSERT' AND with_check LIKE '%post-media%' AND with_check NOT LIKE '%post-media-intake%'
 ) THEN RAISE EXCEPTION 'Unexpected unrestricted public media upload'; END IF;
 SELECT * INTO p FROM pg_policies WHERE schemaname='public'
  AND tablename='cultural_posts' AND policyname='creator posts own insert';
 IF NOT FOUND OR p.cmd<>'INSERT' OR p.roles<>ARRAY['authenticated']::name[]
   OR p.with_check NOT ILIKE '%creator%'
   OR (SELECT count(*) FROM pg_policies WHERE schemaname='public'
       AND tablename='cultural_posts' AND cmd='INSERT')<>1
 THEN RAISE EXCEPTION 'Unexpected posts policy; stop and review'; END IF;
END;
$guard$;

-- No user may publish a cultural post directly to the Data API while
-- media promotion/rights attestation are not implemented. Do NOT mistake
-- a client flag for a security boundary.
ALTER POLICY "creator posts own insert" ON public.cultural_posts
 TO authenticated WITH CHECK (false);

DO $verify$
BEGIN
 IF NOT EXISTS (
 SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cultural_posts'
   AND policyname='creator posts own insert' AND cmd='INSERT'
   AND with_check='false'
 ) THEN RAISE EXCEPTION 'Post INSERT must be denied by RLS'; END IF;
END;
$verify$;
COMMIT;
