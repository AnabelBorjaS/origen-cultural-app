# ORIGEN — Moderation staging security checkpoint (13 October 2026)

## Verified evidence (read-only)

The staging project `egujmptgnrpajgfpjjxu` was queried through the connected Supabase account. Production `xwkjvoyicrrwjybjolld` was not queried or changed. The repeatable SQL is `supabase/proposals/ORIGEN_STAGING_MODERATION_CONFIG_AUDIT_READ_ONLY.sql`. Results: **15 CONFIG_PASS, 0 CONFIG_FAIL, 1 ACTION_REQUIRED**.

Configuration checks cover: moderation-report RLS; no anonymous table grants or anonymous policies; authenticated inserts and selects; no authenticated report updates/deletes; reporter ownership constrained to the JWT; newly inserted reports remain open; own/admin read policy; rate-limit trigger with 20 reports/hour guard; status/details constraints; private admin check and profile-role escalation protection.

These are **catalog/configuration proofs only**. They are not end-to-end tests with real Supabase JWTs. The triggering account/role protections and reporting limits have not been exercised with two test users. A SQL policy that looks correct could still have runtime limitations.

## Mandatory operational gap

There is no deployed, authorized reviewer workflow with a protected case history, formal actions, decision reasoning, notification, appeals and revocation. `moderation_reports` does not expose ordinary UPDATE or DELETE to browser users. **Do not add a permissive authenticated UPDATE policy or public privileged RPC to shortcut the workflow.**

A safe implementation must specify an authorized server-only actor and an auditable decision log, link the decision to a reporter and actual target, support human review and appeal, preserve reporter privacy, and separately handle deletion or masking of public Storage media. Do not interpret report submission as automatic punishment.

## Controlled pre-pilot test steps

1. Protect both root and preview Cloudflare Pages URLs with Access and verify anonymous rejection; keep the **visual-only** bundle disconnected until Access is proven.
2. Activate/verify staging-only consent/Auth setup with no Production user data; create exactly two synthetic accounts after account signup protection is proven.
3. Test report creation as account A, inability to impersonate B, strict report reasons and lengths, anonymous denial, cross-account SELECT denial, and inability of A/B to UPDATE/DELETE decisions.
4. Test report spam guard on staging under a reversible fixture plan only, checking cleanup of synthetic data; never use reports containing personal facts.
5. Introduce reviewed server-side moderator authorization and immutable case/decision log with explicit migration review, then test approve, dismiss, hide, restore, appeal and evidence retention with two test accounts.
6. Complete real Storage withdrawal, CDN review and legal jurisdiction check before opening the pilot.

**Gate status: NO-GO for external communities.** No subscriptions, Cloudflare deploy, domain update, Production data change, or `main` merge have been made. The PR stays a draft.

Supabase documentation: https://supabase.com/docs/guides/database/postgres/row-level-security
