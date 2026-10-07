# ORIGEN Cultural — Staging Plan

Status: planned, not yet deployed
Cost target: **AUD/USD $0 hosting during controlled beta**
Last reviewed: 7 October 2026

## Decision

Use a dedicated HTTPS staging deployment before any migration of `origencultural.com`.

### Preferred option: Cloudflare Pages Free

Why:
- $0 Free plan is available for proof-of-concept/testing use;
- integrates with GitHub;
- provides HTTPS `*.pages.dev` URLs;
- supports branch/PR preview deployments;
- ORIGEN's current frontend is static HTML/CSS/JavaScript. A whitelist build copies only public runtime files into `dist/`, preventing internal Markdown, SQL and development files from being deployed.

### Not selected for Auth staging

**GitHub Pages** — acceptable for static visual previews, but not selected for real ORIGEN Auth testing because GitHub's Pages usage guidance says Pages should not be used for sensitive transactions such as sending passwords.

**Vercel Hobby** — not selected because Vercel's current Hobby terms restrict it to personal/non-commercial use.

## Proposed Cloudflare configuration

Project name suggestion:
`origen-cultural-staging`

Repository:
`AnabelBorjaS/origen-cultural-app`

Release branch to deploy:
`reconcile-main-beta-2026-10-07`

Static build configuration:
- Framework preset: None
- Build command: `npm run build:static`
- Build output directory: `dist`
- Production DNS: **do not connect `origencultural.com`**
- Use the generated `*.pages.dev` URL for controlled testing.

Turnstile public build variable (add **only after** creating the staging widget):
- `ORIGEN_TURNSTILE_SITE_KEY=<staging public Site Key>`
- This is a public identifier and is written into `dist/runtime-config.js`.
- **Never** add the Turnstile Secret Key to Cloudflare Pages build variables, GitHub, or browser runtime. The Secret Key belongs only in Supabase Auth CAPTCHA configuration.

Cloudflare Pages provides preview URLs for branches and pull requests when Git integration is enabled.

## Supabase Auth integration after staging URL exists

Once the actual HTTPS staging URL is generated:

1. Record the exact URL.
2. Add only that exact staging URL/path to the Supabase Auth redirect allow list.
3. Keep production Site URL decision separate from staging.
4. Test email confirmation on staging.
5. Test password recovery on staging.
6. Confirm the prepared Turnstile frontend renders and produces tokens with the staging Site Key.
7. Enable CAPTCHA server-side only after the frontend flow is verified.
8. Run `RELEASE_QA_RUNBOOK.md` with two real accounts.
9. Remove any obsolete staging redirect when staging is retired.

## Data safety

Initial staging may connect to the current Supabase Production project only for controlled beta testing with dedicated test accounts.

Rules:
- no real sensitive community data during QA;
- clearly identifiable test accounts/content;
- clean test records before public beta when appropriate;
- never expose service-role/database credentials;
- publishable browser key only;
- all authorization remains enforced by RLS.

Longer term, create a separate Supabase staging project when release frequency/team size justifies it.

## Exit criteria

Staging is complete only when:
- HTTPS URL works;
- CSP passes in deployed environment;
- Auth email confirmation works;
- password recovery works;
- CAPTCHA works;
- two-account RLS tests pass;
- storage negative tests pass;
- claims/reports tests pass;
- mobile/desktop QA completes;
- 0 Critical and 0 High bugs remain.

Only then can ORIGEN consider merging PR #3 into `main` and intentionally migrating the public domain.


## Pre-deployment artifact

GitHub Quality Gate now runs `npm run check:release`, which:
- validates JavaScript and smoke checks;
- builds a clean `dist/` directory from an explicit runtime whitelist;
- rejects Markdown, SQL, GitHub/agent/Replit files inside the deployable bundle;
- rejects any `service_role` reference in deployable runtime text;
- uploads the resulting static bundle as a GitHub Actions artifact for 7 days.

This artifact is release evidence only. Cloudflare should build from the same `npm run build:static` command and `dist` output directory.


## Automated deployed-staging audit

After Cloudflare creates the HTTPS `*.pages.dev` URL, run the GitHub Actions workflow **ORIGEN Staging Audit** with that exact URL.

The workflow executes `npm run audit:staging` and verifies:
- homepage returns HTTP 200 over HTTPS;
- response headers include anti-framing, `nosniff`, Referrer Policy, Permissions Policy and CSP;
- CSP includes `frame-ancestors 'none'` and `object-src 'none'`;
- core ORIGEN runtime assets are publicly available;
- internal Markdown, SQL, package metadata and GitHub workflow files are not publicly served;
- service worker is available with a JavaScript-compatible content type.

A failed staging audit is a **NO-GO** for Auth QA or release.
