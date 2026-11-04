-- ORIGEN Cultural — Storage private intake foundation, STAGING ONLY.
-- Destination: Supabase Staging egujmptgnrpajgfpjjxu.
-- NEVER apply to Production. Must test transactionally before COMMIT.
-- This does NOT deploy a media promotion/attestation backend or allow pilot use.
-- Existing public post-media remains as a future server-only published destination.
BEGIN;

DO $preflight$
BEGIN
 IF (SELECT count(*) FROM auth.users) <> 0
    OR (SELECT count(*) FROM public.profiles) <> 0
    OR (SELECT count(*) FROM public.cultural_posts) <> 0
    OR (SELECT count(*) FROM storage.objects) <> 0
 THEN RAISE EXCEPTION 'Only for EMPTY isolated Staging (no users, posts, or Storage objects)'; END IF;
 IF (SELECT count(*) FROM storage.buckets WHERE id='post-media-intake') <> 0
 THEN RAISE EXCEPTION 'Private intake bucket already exists; review instead of rerunning'; END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='storage' AND tablename='objects') <> 4
 THEN RAISE EXCEPTION 'Unexpected Storage policies; do not alter unknown configuration'; END IF;
 IF NOT EXISTS (
   SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
     AND policyname='users upload own media' AND cmd='INSERT'
     AND with_check ILIKE '%post-media%'
     AND with_check ILIKE '%creator%'
 ) OR NOT EXISTS (
   SELECT 1 FROM storage.buckets WHERE id='post-media' AND public IS TRUE
 )
 THEN RAISE EXCEPTION 'Staging baseline no longer matches approved policy/bucket'; END IF;
END;
$preflight$;

-- A *new* empty private bucket, separate from public published assets.
-- Text/image/video only; same maximum as post-media so intake does not
-- inadvertently accept formats or sizes that final published bucket rejects.
INSERT INTO storage.buckets (
 id,name,public,file_size_limit,allowed_mime_types
) VALUES (
 'post-media-intake','post-media-intake',FALSE,52428800,
 ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime']::text[]
);

-- Browser accounts can no longer INSERT new files directly into public
-- post-media; eventual publishing must be through a separately reviewed
-- server-only transaction after rights/consent and owner verification.
-- Continue allowing existing avatar and cover uploads.
ALTER POLICY "users upload own media" ON storage.objects
 TO authenticated
 WITH CHECK (
   auth.uid() IS NOT NULL
   AND bucket_id IN ('avatars','covers')
   AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
 );

CREATE POLICY "origen intake creator upload" ON storage.objects
 FOR INSERT TO authenticated
 WITH CHECK (
   bucket_id='post-media-intake'
   AND auth.uid() IS NOT NULL
   AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
   AND EXISTS (
     SELECT 1 FROM public.profiles pr
     WHERE pr.id=(SELECT auth.uid()) AND pr.role='creator'
   )
 );

-- A private bucket needs explicit RLS for authenticated preview/download.
-- Never grant anon access to intake, and never produce a public URL for it.
CREATE POLICY "origen intake owner read" ON storage.objects
 FOR SELECT TO authenticated
 USING (
   bucket_id='post-media-intake'
   AND auth.uid() IS NOT NULL
   AND owner_id=(SELECT auth.uid())::text
   AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
 );

CREATE POLICY "origen intake owner cleanup" ON storage.objects
 FOR DELETE TO authenticated
 USING (
   bucket_id='post-media-intake'
   AND auth.uid() IS NOT NULL
   AND owner_id=(SELECT auth.uid())::text
   AND (storage.foldername(name))[1]=(SELECT auth.uid())::text
 );

-- No UPDATE policy grants intake editing; no INSERT policy grants public
-- post-media uploads. Published media cannot be silently overwritten.
DO $postflight$
DECLARE
 v_public boolean; ins text; ir text; iq text; iq2 text; rd text; dl text;
BEGIN
 SELECT public INTO v_public FROM storage.buckets WHERE id='post-media-intake';
 IF v_public IS DISTINCT FROM FALSE THEN RAISE EXCEPTION 'Intake must be private'; END IF;
 SELECT with_check INTO ins FROM pg_policies
 WHERE schemaname='storage' AND tablename='objects' AND policyname='users upload own media';
 SELECT with_check INTO ir FROM pg_policies
 WHERE schemaname='storage' AND tablename='objects' AND policyname='origen intake creator upload';
 SELECT qual INTO rd FROM pg_policies
 WHERE schemaname='storage' AND tablename='objects' AND policyname='origen intake owner read';
 SELECT qual INTO dl FROM pg_policies
 WHERE schemaname='storage' AND tablename='objects' AND policyname='origen intake owner cleanup';
 IF ins IS NULL OR ins ILIKE '%post-media%' OR
    ir IS NULL OR ir NOT ILIKE '%post-media-intake%' OR ir NOT ILIKE '%creator%' OR
    rd IS NULL OR rd NOT ILIKE '%owner_id%' OR
    dl IS NULL OR dl NOT ILIKE '%owner_id%' OR
    (SELECT count(*) FROM pg_policies WHERE schemaname='storage' AND tablename='objects') <> 7
 THEN RAISE EXCEPTION 'Private intake postflight mismatch'; END IF;
 -- No policy for UPDATE may name intake or post-media.
 IF EXISTS (
   SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND cmd='UPDATE'
   AND (COALESCE(qual,'') ILIKE '%post-media%' OR COALESCE(with_check,'') ILIKE '%post-media%')
 ) THEN RAISE EXCEPTION 'Media overwrites unexpectedly enabled'; END IF;
END;
$postflight$;

COMMIT;
