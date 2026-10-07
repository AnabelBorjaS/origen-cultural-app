# ORIGEN Cultural — Cloudflare Turnstile Integration Plan

Status: **provider selected / activation pending staging**
Selected provider: **Cloudflare Turnstile**
Target plan for controlled beta: **Free ($0)**
Last reviewed: 8 October 2026

## Decision

ORIGEN will use **Cloudflare Turnstile** as the preferred CAPTCHA provider for the controlled Public Beta.

Reasons:
- Supabase Auth natively supports Cloudflare Turnstile for sign-up, sign-in and password reset.
- ORIGEN's Auth client already accepts optional `captchaToken` values for those three flows.
- Cloudflare Turnstile Free supports development/testing and most production applications, with up to 20 widgets and unlimited challenges.
- It aligns naturally with the planned Cloudflare Pages staging environment.
- The Free tier keeps controlled-beta bot protection at $0 while ORIGEN validates demand and operating requirements.

This is a controlled-beta decision, not a permanent commitment. Re-evaluate Enterprise if ORIGEN becomes mission-critical, high-volume, multi-domain or subject to stricter compliance/support requirements.

## Critical activation rule

**Do not enable CAPTCHA enforcement in Supabase before the frontend is successfully producing valid Turnstile tokens.**

Turning on server-side enforcement first can block legitimate registration, login and password-recovery flows.

## Activation sequence

### 1. Staging must exist first
- [ ] Deploy the release candidate to the dedicated HTTPS Cloudflare Pages staging URL.
- [ ] Record the exact `https://*.pages.dev` hostname.
- [ ] Run `ORIGEN Staging Audit`.
- [ ] Add the exact staging Auth redirect URLs to Supabase.

### 2. Create Turnstile widget
- [ ] Create a Turnstile widget specifically for ORIGEN staging.
- [ ] Use the exact staging hostname.
- [ ] Prefer **Managed** mode for the controlled beta unless testing shows a reason to change it.
- [ ] Record the **Site Key**.
- [ ] Store the **Secret Key** only in approved Supabase/Cloudflare configuration.
- [ ] Never commit the Secret Key to GitHub, frontend JavaScript, documentation or screenshots.

### 3. Frontend integration
- [ ] Add the official Turnstile client script only after the Site Key exists.
- [ ] Add only the minimum CSP permissions required for the Cloudflare challenge origin.
- [ ] Render Turnstile in registration.
- [ ] Render Turnstile in sign-in.
- [ ] Render Turnstile in password recovery.
- [ ] Send the returned token through the existing `captchaToken` parameter.
- [ ] Reset/refresh the widget after every Auth attempt.
- [ ] Provide accessible failure/retry states in ES and EN.

### 4. Staging validation before enforcement
Test:
- [ ] Human success.
- [ ] Missing token.
- [ ] Invalid token.
- [ ] Expired/reused token.
- [ ] Widget/network failure.
- [ ] Mobile.
- [ ] Desktop.
- [ ] ES.
- [ ] EN.
- [ ] Registration.
- [ ] Login.
- [ ] Password recovery.

### 5. Enable Supabase CAPTCHA protection
Only after Step 4 passes:
- [ ] Supabase Dashboard → Authentication → Bot and Abuse Protection.
- [ ] Select **Cloudflare Turnstile**.
- [ ] Enter the Secret Key.
- [ ] Enable CAPTCHA protection.
- [ ] Repeat all staging Auth tests after enforcement is live.

### 6. Production preparation
Before moving `origencultural.com`:
- [ ] Add the production hostname to the approved widget or create a dedicated production widget.
- [ ] Add exact production Supabase Auth redirects.
- [ ] Verify production Site Key.
- [ ] Verify Secret Key is not present in GitHub/runtime.
- [ ] Repeat Auth success/failure tests.
- [ ] Retire obsolete staging hostnames/redirects when no longer needed.

## CSP expectation

Turnstile requires Cloudflare challenge resources that are **not currently in ORIGEN's strict CSP**. Do not loosen CSP globally in advance. Add only the origins/directives required by the final official Turnstile embed after the staging widget exists.

## Cost guard

Controlled-beta target:
- Turnstile Free: **$0**
- Cloudflare Pages staging: **$0 target**
- Supabase: **Free**

Any upgrade to a paid Cloudflare/Turnstile/Supabase plan requires a separate cost review before authorization.
