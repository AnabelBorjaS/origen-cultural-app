# ORIGEN Cultural — Security & Abuse Baseline

Status: controlled beta hardening
Last reviewed: 6 October 2026

## Security principle
No web or mobile platform can be guaranteed to be impossible to attack. ORIGEN uses layered controls to reduce likelihood, limit impact, detect abuse and recover safely.

## Controls already implemented
- Trigger-only public helper functions are not exposed as callable browser RPCs; direct EXECUTE on `public.touch_updated_at()` is revoked from public client roles.

- Globe tooltips and cultural-card HTML escape external/profile text before insertion, and micro-story links pass through an http/https/hash allow-list.

- External globe dependencies are version-pinned; mutable `@master`/unversioned runtime URLs were removed, and the unused raw GitHub CSP origin was dropped.

- Service worker caching is limited to same-origin public static assets/navigation, bypasses cross-origin and Authorization requests, rejects private/no-store/error responses, and does not cache arbitrary future same-origin endpoints.

- Explorer profile rows are not publicly enumerable through the Data API; only Cultural Agent (`creator`) profiles are public, while each authenticated user retains access to their own row.
- Managed profile media replacement uses UID-scoped Storage paths and can remove the previous owned avatar/cover only after a successful profile save.

- Profile role self-escalation is blocked at the database layer; normal users cannot change their own `role` to `admin`.
- Post counters/editorial metadata are protected from author manipulation.
- Social interactions are scoped to published posts/profiles and social table grants follow least privilege.

- Runtime JavaScript does not rely on inline event attributes, inline script blocks, `eval`, `new Function` or `javascript:` URLs; this remains compatible with the strict script CSP.
- User-editable profile text is HTML-escaped in dynamic directory/search/Mundo surfaces.
- Dynamic persisted media URLs are protocol-allow-listed before being inserted into image/video attributes.

- Legacy local auth/session and profile-follow state has been removed from Mundo Cultural; account state comes from Supabase/ORIGEN_API.
- Static hosting security headers are defined in `_headers` for Cloudflare Pages, including anti-framing, MIME sniffing protection, referrer policy, permissions policy and CSP.
- Auth redirect construction requires HTTPS outside localhost and strips query parameters before email-confirmation/password-recovery redirects.
- The Supabase client accepts optional CAPTCHA tokens for signup, password login and password recovery; provider/widget enforcement remains disabled until staging is ready.
- Privileged cultural-profile fields (ownership, verification status/source and follower counters) are protected from owner self-modification by a database trigger.
- Supabase Auth instead of locally stored passwords.
- PostgreSQL Row Level Security on public application tables.
- User-controlled fields separated from privileged verification/ownership fields.
- Storage ownership policies and file-size/type restrictions.
- Server-side constraints on user-generated text lengths.
- Server-side anti-spam limits:
  - posts: maximum 5 per user per hour;
  - comments: maximum 15 per user per 10 minutes;
  - profile claims: maximum 3 per user per 24 hours;
  - moderation reports: maximum 20 per user per hour.
- Claims can target only unowned reference profiles and do not grant ownership automatically.
- External profile links are restricted to approved URL schemes.
- Content Security Policy added to the web client.
- Public frontend uses only the Supabase publishable key. Service-role keys and database secrets must never be shipped to browsers/apps.
- Security Advisor is checked after database security changes.

## Launch blockers
- Enable CAPTCHA/bot protection for auth.
- Enable/verify email confirmation.
- Configure approved production redirect URLs.
- Review auth rate limits.
- Enable MFA/2FA for administrative accounts.
- Run cross-account authorization tests.
- Test malicious/oversized uploads and unsupported MIME types.
- Test XSS payloads in profile names, bios, posts, comments and links.
- Validate CSP after deployment.
- Incident-response/recovery runbook exists (`INCIDENT_RECOVERY_RUNBOOK.md`). Before Public Beta, create and verify an off-repository logical database backup and confirm account-recovery/admin contacts.

## Cookies and browser storage
ORIGEN should use the minimum browser storage required for core operation. Optional analytics, advertising and cross-site tracking must remain off until they are deliberately approved, documented and consented to where required.

The technical inventory must distinguish:
- cookies;
- localStorage/sessionStorage;
- authentication tokens;
- service-worker/PWA caches;
- third-party SDK/network requests.

A cookie banner must reflect the technology actually deployed. Do not show a misleading consent interface for optional trackers that are not present. If optional analytics/advertising is later activated, those technologies must not run before the relevant choice is made where consent is required.

## Incident response
For suspected compromise:
1. contain affected account/function;
2. revoke/rotate relevant credentials;
3. preserve logs/evidence;
4. assess exposed data and affected users;
5. restore from a known-safe state;
6. make legally required notifications;
7. document root cause and prevention actions.

## Review cadence
Re-run security checks before each public release and after changes to Auth, RLS, Storage, analytics, payments, messaging, third-party SDKs or mobile clients.


## Recovery baseline
- Operational incident/rollback procedure: **documented**.
- Code rollback source: last-known-good GitHub commit/build.
- Database recovery principle: contain first; prefer reviewed forward-fix migrations.
- Current Supabase Free plan: do not assume PITR/dashboard restore availability; maintain an independent logical backup.
- Storage objects require a separate recovery/retention strategy because database backups do not restore deleted physical Storage objects.
- Actual pre-beta backup export/validation: **pending release evidence**.
