# ORIGEN — Private cultural media intake foundation (14 October 2026)

**Status: Installed in isolated Supabase STAGING only**, project `egujmptgnrpajgfpjjxu`. No private HTTPS preview or real-user publishing enabled. Production, `main`, and `origencultural.com` unchanged.

## Executed and verified
- Preflight: 0 Auth users, 0 public cultural posts and 0 Storage objects across project.
- Created private bucket `post-media-intake` (`public=false`) with 50 MiB limit and allowed cultural image/video formats.
- Seven `storage.objects` policies in Staging:
  - Authenticated creators may insert files to their own `post-media-intake/<auth-id>/...` path.
  - Only authenticated owners may select and delete their intake objects.
  - No anonymous access policies are granted to private intake; public URL routes will not serve this bucket.
  - Removed authenticated direct INSERT to the public `post-media` destination. Only `avatars` and `covers` retain owner-scoped browser INSERT.
  - Existing public read of `post-media`, owner-scoped deletion of public media, and avatar/cover update rules remain unchanged.
- Executed SQL proposal `supabase/proposals/ORIGEN_STAGING_PRIVATE_INTAKE_FOUNDATION.sql` inside `BEGIN/ROLLBACK` first; postflight passed. Applied reviewed proposal to Staging only and verified `intake_public=false`, `published_public=true`, `objects=0`, `policy_count=7`, policy predicates.
- Supabase docs: https://supabase.com/docs/guides/storage/buckets/fundamentals and https://supabase.com/docs/guides/storage/security/access-control

## NO-GO limitations
1. **The current browser upload implementation still targets public `post-media`** and will be rejected in Staging. Do not invite users or suggest media publishing works yet.
2. The future authoring experience needs a secure private-media preview (authenticated download or short-lived signed URL), abort/cancel cleanup, atomic post rights attestation, and an approved server-side promotion process. Never put an intake URL into `cultural_posts.media_urls`.
3. Do not enable direct public uploads or grant `service_role` / secret access from static client. Define trusted backend credentials and permissions separately.
4. Run live two-account tests (creator/explorer, other owner's read, replace, delete, public download rejection, publication, withdrawal) only after Cloudflare Access protects all previews.
5. Public storage `post-media` still exists for reviewed, published content. Existing public URLs/CDNs do not become private retroactively.
6. No new paid service/subscription has been authorized.

The earlier **8 CONFIG_PASS / 1 ACTION_REQUIRED** audit represents the previous public-upload architecture and is no longer the metric for this new intake system; update it before reporting new counts.

**Pilot private readiness: 6/10 (60%)**. Infrastructure foundation is real, but the end-to-end upload, approval and withdrawal milestone remains incomplete.
