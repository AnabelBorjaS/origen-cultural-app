# ORIGEN - Staging read-only A/B Auth-RLS QA

Status: Code ready; NOT YET executed with real disposable test accounts.

This script only connects to the exact ORIGEN isolated Supabase Staging host. It never creates users, writes posts, uploads media or changes RLS.

Prerequisites: first close/validate P0 #6 server signup legal acceptance, and prepare TWO disposable accounts (Explorer and Creator) with their own server-recorded v1.2 legal acceptances. Seed a private Explorer post_saves fixture and an unpublished Creator cultural_posts fixture only in Staging, after completing consent and moderation safety gates. Never use real people, real cultural data, or production content.

Required environment variables (never commit values or expose passwords in issues):
- ORIGEN_STAGING_SUPABASE_URL must equal https://egujmptgnrpajgfpjjxu.supabase.co
- ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY: staging sb_publishable_... only
- ORIGEN_QA_EXPLORER_EMAIL and ORIGEN_QA_EXPLORER_PASSWORD
- ORIGEN_QA_CREATOR_EMAIL and ORIGEN_QA_CREATOR_PASSWORD
- ORIGEN_QA_PRIVATE_SAVE_ID: pre-existing Explorer post_saves.id
- ORIGEN_QA_PRIVATE_DRAFT_ID: pre-existing Creator unpublished cultural_posts.id

Command: npm run qa:staging:auth:readonly

The only POST is password sign-in to pre-existing accounts; all Data API checks are GET. It verifies server roles, owner-only legal receipts, private save owner isolation, nonpublished story isolation (including anonymous access) and private cultural log invisibility. Missing credentials/fixtures are errors, never synthetic PASS. No staging users or fixtures have been created by this work.

Limitations: does not test CREATE/UPDATE/DELETE, rejection of false legal/cultural flags, atomic audit events, public Storage URL withdrawal, or Auth hook activation. Issues #5, #6, #7, #8 and #12 remain P0 until real end-to-end evidence and legal review.

Offline safety checks are executed as part of npm run check through tests/staging-auth-qa-safety.mjs.