# ORIGEN Cultural — Incident Response & Recovery Runbook

Status: **controlled-beta operational baseline**
Last reviewed: 8 October 2026
Incident contact: `info.origencultural@gmail.com`

## Purpose

This runbook defines how ORIGEN contains, investigates and recovers from security, privacy, availability or data-integrity incidents without improvising destructive actions during an emergency.

It applies to:
- GitHub source/release pipeline;
- Cloudflare Pages staging/future production hosting;
- Supabase Auth, Database and Storage;
- ORIGEN public web/PWA runtime;
- third-party security integrations such as Turnstile.

## Core rule

**Contain first. Preserve evidence. Recover from a known-safe state.**

Do not delete logs, rotate every credential blindly, restore databases, merge emergency code or modify production data until the affected surface is understood.

## Severity

### Critical
Examples:
- account takeover affecting admin/privileged access;
- service-role/database secret exposed;
- cross-user write/read vulnerability with real data exposure;
- verification/ownership bypass;
- destructive or widespread data corruption;
- malicious code served from ORIGEN-controlled infrastructure.

Action: treat Public Beta/production as **NO-GO**; contain the affected function immediately.

### High
Examples:
- Auth unavailable for legitimate users;
- unsafe uploads or Storage ownership bypass;
- claims/reporting integrity broken;
- serious XSS/CSP bypass;
- major privacy disclosure without confirmed broad compromise.

Action: disable or isolate the affected feature and investigate before continuing release.

### Medium / Low
UX, localisation, accessibility or cosmetic defects without security/data-loss implications may follow the normal issue workflow unless evidence indicates escalation.

## Incident roles

ORIGEN is currently founder-led.

- **Incident Lead:** Founder/CEO or explicitly delegated technical incident owner.
- **Technical containment:** GitHub/Supabase/hosting account owner.
- **Privacy/legal escalation:** specialist legal/privacy adviser when notification obligations may apply.
- **Public contact:** `info.origencultural@gmail.com`.

Do not publish private credentials, internal evidence, affected-user details or exploit instructions in public GitHub issues.

## Immediate containment

Choose the smallest action that stops harm:

### Web/runtime
- keep PR/release in draft;
- do not merge to `main`;
- revert hosting to last-known-good commit if a bad release is live;
- remove/disable the affected UI route only if necessary;
- preserve the suspect commit SHA and deployment evidence.

### Supabase Auth
- block public registration temporarily if signup abuse/identity risk is active;
- rotate only credentials known or reasonably suspected to be exposed;
- revoke affected sessions/accounts when available and appropriate;
- do not expose service-role/secret keys to browser tooling during incident handling.

### Database/RLS
- stop writes to the affected feature where practical;
- prefer a **forward-fix migration** over rewriting migration history;
- do not run broad DELETE/UPDATE repair SQL without a reviewed scope and evidence;
- preserve affected record IDs/timestamps before remediation.

### Storage
- block the affected upload path/bucket operation if ownership/type controls fail;
- preserve object paths and relevant metadata before cleanup;
- remember that restoring the database does not recreate deleted Storage objects.

## Evidence preservation

Record:
- UTC/local incident start time;
- reporter;
- affected environment;
- release commit SHA;
- GitHub Actions run IDs;
- Supabase migration versions;
- affected user/row/object identifiers where lawful and necessary;
- relevant logs/screenshots;
- containment actions;
- credentials rotated;
- recovery actions;
- final root cause.

Evidence containing personal data or secrets must **not** be committed to the public repository.

## Code rollback

Current release model:
- `main` = public production branch;
- release candidate = draft PR branch;
- last-known-good production commit must be recorded before each release.

For a bad frontend release:
1. stop further merges/deployments;
2. identify the last-known-good production SHA;
3. restore hosting to that exact known-good build/commit;
4. verify core anonymous/Auth routes;
5. keep the faulty commit/PR for evidence;
6. patch on a new controlled branch;
7. rerun Quality Gate, Browser QA and deployed staging audit before re-release.

Do not “fix forward directly on production” without the normal gates unless containment requires an emergency static shutdown page.

## Database rollback philosophy

ORIGEN migrations are treated as append-only release history.

Preferred recovery:
1. contain the affected feature;
2. assess whether data was actually modified;
3. create a reviewed **forward corrective migration**;
4. verify Security Advisor;
5. test the corrected policy/schema;
6. record the new migration in GitHub.

Avoid destructive down-migrations on Production unless a reviewed recovery plan proves they are safer.

## Free-plan backup reality

ORIGEN currently uses Supabase Free.

Supabase recommends Free projects regularly create their own logical database exports. Do **not** assume Point-in-Time Recovery or a guaranteed dashboard restore point is available on the current plan.

Before Public Beta:
- [ ] Create a fresh logical database backup/export.
- [ ] Store it outside the public GitHub repository.
- [ ] Encrypt/restrict access to the backup.
- [ ] Record backup date/time and database migration version.
- [ ] Test that the backup file is readable/valid without restoring over Production.
- [ ] Define a recurring backup cadence for the controlled beta.
- [ ] Reassess whether a paid backup/PITR option is justified when real-user volume/criticality grows.

**Never upload a database dump containing user data as a public GitHub artifact.**

## Storage recovery reality

Supabase database backups contain Storage metadata, not the physical Storage objects themselves.

Before material real-user media is accepted:
- [ ] define whether user-uploaded media must be independently backed up;
- [ ] define retention/deletion expectations;
- [ ] document which media is replaceable by the user versus operationally critical;
- [ ] avoid promising restoration of deleted media until an independent media-backup strategy exists.

For the controlled pilot, minimise irreplaceable sensitive media and keep participants informed that the product is beta.

## Credential response

If a secret is exposed:
1. contain public access to the secret;
2. rotate/revoke that specific credential at the provider;
3. update only approved secret stores/configuration;
4. invalidate dependent sessions if required;
5. search repository/history/runtime for remaining copies;
6. test the replacement;
7. document the exposure window.

Public publishable keys are not treated like service-role/database/Turnstile Secret keys.

## Data/privacy assessment

Determine:
- what data was exposed/altered;
- whose data;
- approximate number of affected users;
- duration;
- whether data was downloaded or merely accessible;
- jurisdictions reasonably implicated;
- whether notification to affected users/regulators is legally required.

Use specialist legal/privacy advice for notification decisions. This runbook is an operational process, not jurisdiction-specific legal advice.

## Recovery validation

A recovery is not complete until:
- containment is removed deliberately;
- Security Advisor is clean where relevant;
- Quality Gate passes;
- Browser QA passes for runtime changes;
- staging audit passes for hosting/header changes;
- two-account authorization tests are repeated for RLS/Auth incidents;
- affected data is checked for integrity;
- Critical/High issues are zero or release remains NO-GO.

## Post-incident review

Within the project record, document:
- root cause;
- why existing controls did/did not stop it;
- user/data impact;
- permanent fix;
- new regression test/control;
- whether Trust/Privacy wording must change;
- whether the release gate must change.

## Cost guard

Do not upgrade to PITR, paid backup, Enterprise security or another paid recovery service during an incident without explicit cost review, unless the account owner deliberately authorises that spend after understanding the charge.

The absence of a paid recovery feature is a reason to prepare backups **before** Public Beta, not a reason to make an unreviewed purchase during an emergency.
