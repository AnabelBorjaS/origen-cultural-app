-- ORIGEN Cultural — isolated Supabase STAGING media-policy audit.
-- READ ONLY. No user records, media names, access tokens or Storage payloads.
-- Run only against project egujmptgnrpajgfpjjxu. Failures here are launch
-- blockers or architectural reviews, never a reason to expose service secrets.
-- Catalog checks cannot replace authenticated Storage E2E tests.
WITH p AS (
  SELECT relrowsecurity AS enabled FROM pg_class
  WHERE oid='storage.objects'::regclass
),
b AS (
  SELECT id, public, file_size_limit, allowed_mime_types
  FROM storage.buckets WHERE id='post-media'
),
rules AS (
  SELECT cmd, with_check, qual, roles
  FROM pg_policies
  WHERE schemaname='storage' AND tablename='objects'
),
facts AS (
  SELECT
   (SELECT enabled FROM p) AS object_rls_enabled,
   EXISTS (SELECT 1 FROM b) AS bucket_exists,
   EXISTS (SELECT 1 FROM rules
     WHERE cmd='INSERT' AND 'authenticated'=ANY(roles)
       AND with_check ILIKE '%post-media%'
       AND with_check ILIKE '%storage.foldername(name)%'
       AND with_check ILIKE '%auth.uid()%') AS insertion_binds_owner_folder,
   NOT EXISTS (SELECT 1 FROM rules
     WHERE cmd='INSERT' AND 'anon'=ANY(roles)
       AND with_check ILIKE '%post-media%') AS no_anonymous_upload_policy,
   EXISTS (SELECT 1 FROM rules
     WHERE cmd='DELETE' AND 'authenticated'=ANY(roles)
       AND qual ILIKE '%post-media%' AND qual ILIKE '%owner_id%'
       AND qual ILIKE '%auth.uid()%') AS delete_scoped_to_owner,
   EXISTS (SELECT 1 FROM rules
     WHERE cmd='UPDATE' AND 'authenticated'=ANY(roles)
       AND (coalesce(qual,'') ILIKE '%post-media%' OR coalesce(with_check,'') ILIKE '%post-media%')) AS update_policy_includes_cultural_media,
   EXISTS (SELECT 1 FROM rules
     WHERE cmd='INSERT' AND 'authenticated'=ANY(roles)
       AND with_check ILIKE '%post-media%'
       AND (with_check ILIKE '%role = ''creator''%' OR
            with_check ILIKE '%role=''creator''%' OR
            with_check ILIKE '%private.is_creator%')) AS creator_role_explicitly_checked,
   (SELECT public FROM b) AS publicly_downloadable,
   (SELECT file_size_limit=52428800
      AND allowed_mime_types @> ARRAY['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime']::text[] FROM b)
     AS configured_mime_and_size_limits
)
SELECT name,
 CASE WHEN ok THEN 'CONFIG_PASS' ELSE 'ACTION_REQUIRED' END AS status,
 explanation
FROM facts f, LATERAL (VALUES
 ('storage_rls',f.object_rls_enabled,'storage.objects RLS must remain on'),
 ('cultural_media_bucket_exists',f.bucket_exists,'Staging-only post-media bucket exists'),
 ('media_insert_scoped_to_user_folder',f.insertion_binds_owner_folder,'Owner directory is checked at SQL policy level'),
 ('anonymous_upload_policy_absent',f.no_anonymous_upload_policy,'Do not grant anonymous upload policies'),
 ('delete_scoped_to_owner',f.delete_scoped_to_owner,'Delete must remain owned-media-only'),
 ('post_media_updates_disabled',NOT f.update_policy_includes_cultural_media,'UPDATE must not be allowed for cultural media: otherwise a published image can change without cultural re-attestation'),
 ('creator_role_on_storage_insert',f.creator_role_explicitly_checked,'Storage INSERT policy must enforce creator role: browser-only gating is bypassable'),
 ('post_media_not_public_before_commit',NOT f.publicly_downloadable,'Current public bucket serves uploaded objects before any cultural-post attestation; assess private/quarantine design, no quick SQL-only fix'),
 ('media_mime_and_size',f.configured_mime_and_size_limits,'Server bucket MIME/size restrictions must remain in force')
) v(name,ok,explanation)
ORDER BY name;
