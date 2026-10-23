# ORIGEN Cultural — Server-side signup consent review

**Date:** 8 October 2026  
**Status:** REVIEW REQUIRED / NOT DEPLOYED  
**Risk classification:** Public Beta P0 — account creation can bypass client-only legal acknowledgement  
**Environments:** live Supabase database was **read-only audited**; no Auth users, policies, functions, migrations, production data or hosting settings were modified as part of this review.

## What was actually verified in Supabase Production

The existing trigger on `auth.users`, `on_auth_user_created`, executes `private.handle_new_user()` after insertion.

Today, that trigger:
1. Creates a corresponding `public.profiles` record for a new Auth user.
2. Creates an acceptance row **only when** `raw_user_meta_data.accepted_legal` is truthy.
3. Does **not** reject new Auth users without that metadata.
4. Takes document-version identifiers from user-supplied metadata, with `v1.2` as a fallback.

A direct Auth request that bypasses the ORIGEN web form can therefore omit the consent marker; the application-level check is not an authoritative server restriction. This is a **gap in enforcement**, not evidence of a real-world incident. We have no authenticated pilot users yet.

Separately, `legal_acceptances` has `SELECT` but not `INSERT` table privileges for `authenticated` in the current catalog. That reduces arbitrary client inserts, but it does **not** resolve the missing consent condition during account creation.

Client hardening in branch `reconcile-main-beta-2026-10-07`: `supabase-client.js` requires `acceptedLegal === true`, and isolated tests check that truthy strings and other nonboolean values do not call the signup API. This client protection is **not** a substitute for the backend.

## New engineering deliverables — 8 October 2026

A review-only implementation has been added under `supabase/proposals/`:

- [`ORIGEN_BETA_SERVER_SIGNUP_CONSENT_REVIEW_ONLY.sql`](supabase/proposals/ORIGEN_BETA_SERVER_SIGNUP_CONSENT_REVIEW_ONLY.sql): Before User Created Postgres hook for the email-only beta, explicit JSON boolean acceptance, refusal of unsupported providers, and reconstructed `private.handle_new_user()` that pins legal versions on the server and fails closed if the acknowledgement is missing.
- [`ORIGEN_CONSENT_STAGING_QA_READ_ONLY.sql`](supabase/proposals/ORIGEN_CONSENT_STAGING_QA_READ_ONLY.sql): eight nonmutating test cases for the hook after it is installed in a separate staging project.
- A **Production read-only SQL predicate dry run** passed all eight corresponding test vectors on 8 October. This proves only JSON predicate semantics, **not** compilation/activation of the proposed hook or actual Auth signup behavior.
- Official Supabase reference: [Before User Created Hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook); this hook is available on the Free tier according to Supabase documentation.

**No SQL migration or hook was installed in Production or staging.** The review-only SQL files are **not** placed in the executable migration directory. Running them in Production is outside the authorized beta-release sequence. Actual activation and migrations remain P0 pending.

**Important policy distinction:** a boolean marker received from a caller is not independently verifiable evidence that a person actually reviewed the documents. The platform must still present intelligible information, timestamp acknowledgements on the server, protect logs and implement legally reviewed consent/evidence practices before any public launch.

## Preferred server-side solution for controlled beta

1. Choose and configure an Auth **Before User Created** hook, which Supabase documents as a pre-insert validation point: https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook . The hook should permit only supported account-creation paths with an **explicit boolean true** consent acknowledgement for the currently published versions, and fail closed for missing/false/invalid consent.
2. Independently change `private.handle_new_user()` in a **reviewed migration** so that consent is mandatory for the beta's supported account types. Keep existing profile-creation behaviour, and pin the acceptance document versions on the server rather than trusting caller-submitted `*_version` strings.
3. Keep the acceptance record's server timestamp, consent version, and applicable information needed to evidence user assent; agree retention, lawful basis and privacy notice with legal counsel. A client-supplied flag alone cannot prove informed consent or satisfy every jurisdiction.
4. Disable/avoid any unsupported signup mechanism (OAuth, invites, anonymous login, admin provisioning) until its separate consent pathway has been designed and tested. Do **not** silently lock out legitimate administrative invitations.
5. Validate with a disposable **staging** project/test accounts and dedicated rollback plan before touching Supabase Production.

### Minimal SQL design change to review (illustrative, not an executable migration)

Inside the existing `private.handle_new_user()` PL/pgSQL function, before any `INSERT` into `public.profiles`:

```sql
-- REVIEW ONLY. Do not execute directly in Production.
IF new.raw_user_meta_data -> 'accepted_legal' IS DISTINCT FROM 'true'::jsonb THEN
  RAISE EXCEPTION 'ORIGEN legal acknowledgement required for signup';
END IF;
```

And within the existing `INSERT INTO public.legal_acceptances`, use fixed server-approved values instead of reading arbitrary client-provided version strings:

```sql
-- REVIEW ONLY. Preserve the existing columns and referential checks.
VALUES (new.id, 'v1.2', 'v1.2', 'v1.2', 'v1.2');
```

**Important:** This draft is **not** ready to apply as-is, because the whole current trigger/function body and any administrative/invitation signups must be reviewed. Supabase notes that custom Auth hooks can reject signup before user insertion. Before rollout, confirm which approach produces the intended user-facing error handling and avoids blocking valid flows.

## Required staging tests before marking P0 complete

| Scenario | Expected |
|---|---|
| Website form with genuine consent | User created, exactly one acceptance record with server-approved versions |
| Website form without checkbox | No Auth request |
| Direct Auth API request omitting consent | Rejected server-side; no user/profile/acceptance left behind |
| Explicit `accepted_legal=false` | Rejected server-side |
| String `"true"`, number 1, null as consent | Rejected server-side |
| Caller supplies invented `terms_version` | Rejected or ignored; stored version remains server approved |
| Signup with email confirmation enabled | Account stays pending confirmation as configured; acceptance is consistent |
| Password recovery and login | Continue operating for existing users; are not mistaken for new signup |
| Admin invitation or support-controlled test user | Supported through separately reviewed consent pathway, or intentionally disabled |
| Disable/revert the hook in staging | Known rollback verified; user/profile data remain consistent |

**Release status: NO-GO.** Do not mark backend consent as enforced or tell users a server-side check has been activated until the hooks, migrations and real-account staging tests are complete.

## Dependencies

- Staging infrastructure: [issue #5](https://github.com/AnabelBorjaS/origen-cultural-app/issues/5).
- `AUTH_PRODUCTION_CHECKLIST.md`
- `RELEASE_QA_RUNBOOK.md`
- `RELEASE_GATE.md`
