# ORIGEN Cultural — Supabase Auth Production Checklist

Status: **release blocker**
Last reviewed: 7 October 2026

## Principle

Do not open public registration until the Auth configuration has been verified in the deployed environment. GitHub code alone cannot prove hosted Supabase Auth dashboard settings.

## Production URL configuration

- [x] Auth redirect helper enforces HTTPS outside localhost and removes query parameters before constructing callback URLs.


Target production Site URL:

`https://origencultural.com`

Before Public Beta:

- [ ] Supabase Auth **Site URL** is exactly the approved ORIGEN production URL.
- [ ] Production redirect entries use explicit ORIGEN URLs/paths.
- [ ] Remove obsolete localhost, Replit, temporary, or unknown redirect URLs from Production.
- [ ] Do not use broad production wildcards such as `https://**`.
- [ ] Add the exact staging URL only after staging exists.
- [ ] Confirm email-confirmation links return to an approved ORIGEN route.
- [ ] Confirm password-recovery links return to an approved ORIGEN route.
- [ ] Test expired/invalid confirmation and recovery links.

Supabase recommends exact redirect paths in production; wildcards are mainly useful for local development and provider preview URLs.

## Email verification

- [ ] Email/password provider enabled.
- [ ] Email confirmation required before the account is treated as verified for Public Beta.
- [ ] New signup receives the confirmation message.
- [ ] Unconfirmed account cannot complete the normal authenticated beta journey.
- [ ] Confirmed account can sign in after confirmation.
- [ ] Confirmation link works on mobile and desktop.
- [ ] Sender/template clearly identifies ORIGEN and does not promise features outside Beta scope.

## Password recovery

- [ ] “Forgot password” sends a recovery email.
- [ ] Recovery URL is allow-listed.
- [ ] User can choose a new password successfully.
- [ ] Old password no longer works afterward.
- [ ] Recovery link cannot be reused after successful reset.
- [ ] Error states are understandable in ES and EN.

## CAPTCHA / bot protection

Supabase supports hCaptcha and Cloudflare Turnstile for Auth.

Decision required before activation:
- [ ] Select provider: **Cloudflare Turnstile** or **hCaptcha**.
- [ ] Create provider widget/site.
- [ ] Keep **Secret Key** only in Supabase/provider configuration; never commit it to GitHub.
- [ ] Site Key may be used by the frontend.
- [x] Client API accepts CAPTCHA token for sign-up. *(Widget/token source still pending.)*
- [x] Client API accepts CAPTCHA token for sign-in. *(Widget/token source still pending.)*
- [x] Client API accepts CAPTCHA token for password recovery. *(Widget/token source still pending.)*
- [ ] Reset/refresh the challenge after each Auth attempt.
- [ ] Test successful human flow.
- [ ] Test missing/invalid/expired CAPTCHA token.
- [ ] Test mobile and desktop.
- [ ] Only then enable CAPTCHA enforcement in Production.

**Important:** do not enable server-side CAPTCHA enforcement before the current frontend can supply the token, otherwise legitimate users can be locked out.

## Auth abuse / rate limits

- [ ] Review hosted Auth rate limits before Public Beta.
- [ ] Test repeated signup attempts.
- [ ] Test repeated failed login attempts.
- [ ] Test repeated password-reset requests.
- [ ] Confirm user-facing messages do not expose sensitive account-enumeration information.
- [ ] Confirm ORIGEN application-level anti-spam remains active independently of Auth rate limits.

## Admin security

- [ ] GitHub owner/admin account uses 2FA.
- [ ] Supabase owner/admin account uses MFA/2FA.
- [ ] No shared admin passwords.
- [ ] No service-role key, database password or provider Secret Key in frontend/repository.
- [ ] Recovery access for critical admin accounts is documented securely outside the public repository.

## Release evidence

Record for each completed item:
- date;
- tester;
- environment;
- PASS / FAIL;
- evidence or issue reference.

This checklist is a release gate, not proof that the hosted settings are already enabled.
