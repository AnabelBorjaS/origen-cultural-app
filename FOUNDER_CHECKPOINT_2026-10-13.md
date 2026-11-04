# ORIGEN Cultural — Founder checkpoint | 13 October 2026

> Verified read-only evidence, not launch approval. This document supersedes any stale progress description for the checks below.

## Repository and automated QA

- [x] Single release candidate: PR #3, `reconcile-main-beta-2026-10-07`; still **Draft / NO-GO**, not merged into `main`.
- [x] At SHA `bf07576d51ac2b27e7ff354330edc44ced2d0959`: **Quality Gate #424 SUCCESS, CodeQL #228 SUCCESS, Browser QA #287 SUCCESS**.
- [x] A new mode-aware staging auditor distinguishes private visual-only preview from real authenticated staging, requires Cloudflare Access service credentials, and checks anonymous denial on the homepage and four public assets.
- [ ] This auditor has **not** yet been run against a real, protected Cloudflare Pages deployment because that deployment is not configured.

## Staging backend: fresh 13 October read-only audit

- Supabase Staging `egujmptgnrpajgfpjjxu` and Production `xwkjvoyicrrwjybjolld` were reported `ACTIVE_HEALTHY`; no new resources were created.
- [x] `supabase/proposals/ORIGEN_RIGHTS_STAGING_CONFIGURATION_AUDIT_READ_ONLY.sql` → **10/10 PASS**. Checks two explicit rights declarations, enabled insert/update triggers, restricted private attestation log and internal permissions.
- [x] `supabase/proposals/ORIGEN_STAGING_EDITORIAL_BYPASS_AUDIT_READ_ONLY.sql` → **13/13 PASS**. Checks creator-only RLS insertion constraints, privileged editorial fields/counters, trigger controls and anonymous-write restrictions.
- [x] `supabase/proposals/ORIGEN_STAGING_AUTH_CONFIGURATION_AUDIT_READ_ONLY.sql` → **11/11 PASS**. Checks signup trigger, SQL hook function, execution grants, server-owned legal version, RLS and **zero Auth users**.
- [x] Staging Security Advisor: one **INFO** only, `private.cultural_post_rights_events` RLS enabled without policies. This private audit table is intended to deny direct browser access; review privileges rather than creating permissive policies.
- [x] Staging Performance Advisor: fourteen `unused_index` **INFO** notices in an empty/low-traffic environment. **Do not delete indexes** without representative workload measurements.

These **34 catalog/configuration passes are NOT 34 real-user penetration or integration tests**. In particular, function presence does not prove Supabase Auth has activated the Before User Created hook, nor do table policies alone prove end-to-end behavior.

## Immediate safe order of work

1. **Private visual preview:** Connect founder-authorized Cloudflare Pages **Free** to GitHub, protect both the Pages root and preview/alias hostnames with Access, and deploy `npm run build:visual-preview` to `dist`. No live Supabase URL/key, CAPTCHA, registrations or posts. Independently audit each exact URL with `ORIGEN_STAGING_AUDIT_MODE=visual-only`.
2. **Auth hook in Staging only:** In its Supabase Dashboard, activate/verify `Authentication → Hooks → Before User Created` using `public.origen_before_user_created`. Configure email verification, exact approved redirects and Turnstile only after protecting the hostname. Do not change Production.
3. **Two synthetic users:** Test denied consent (missing/false/invalid), successful consenting signup and v1.2 legal receipt; Creator/Explorer RLS isolation, client and direct REST requests, draft visibility and Storage ownership.
4. **Cultural safety:** Test refused non-consented posts, successful atomic post+private-rights event, rollback, forged author and editorial privilege rejection; then media removal/caching, moderation, reporting and an account-deletion lifecycle.
5. **Release evidence:** independent data/media recovery, legal review, accessibility/device QA, content moderation process and no Critical/High bugs before moving PR #3 out of Draft.

## What remains explicitly prohibited

- No merge to `main` or deployment to `origencultural.com`.
- No modification or test user in Production.
- No new paid plans, trials that auto-convert, subscriptions or unapproved billing.
- No real community recruitment or public registration until security, privacy and legal gates are demonstrated.
- No real email/password or secret value in GitHub issues, artifacts or chat.

## Tracking links

- PR #3: https://github.com/AnabelBorjaS/origen-cultural-app/pull/3
- Hosting/Access P0 #5: https://github.com/AnabelBorjaS/origen-cultural-app/issues/5
- Consent P0 #6: https://github.com/AnabelBorjaS/origen-cultural-app/issues/6
- Cultural rights P0 #7: https://github.com/AnabelBorjaS/origen-cultural-app/issues/7
- Human moderation P0 #8: https://github.com/AnabelBorjaS/origen-cultural-app/issues/8
- Public media withdrawal P0 #12: https://github.com/AnabelBorjaS/origen-cultural-app/issues/12
