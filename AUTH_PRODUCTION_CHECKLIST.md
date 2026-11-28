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

Provider selected for controlled beta: **Cloudflare Turnstile Free**.

Activation remains pending the exact HTTPS staging hostname, Turnstile Site Key and Secret Key. See `CAPTCHA_INTEGRATION_PLAN.md`.

Decision / activation checklist:
- [x] Select provider: **Cloudflare Turnstile Free**.
- [ ] Create provider widget/site.
- [ ] Keep the real **Secret Key** only in Supabase/provider configuration; never commit it to GitHub.
- [x] Turnstile Secret Key is explicitly excluded from the static build/runtime design.
- [x] Frontend/build supports the public Site Key through `ORIGEN_TURNSTILE_SITE_KEY`; no real key is committed.
- [x] Client API accepts CAPTCHA token for sign-up and the Turnstile widget/token source is implemented. *(Real staging Site Key still pending.)*
- [x] Client API accepts CAPTCHA token for sign-in and the Turnstile widget/token source is implemented. *(Real staging Site Key still pending.)*
- [x] Client API accepts CAPTCHA token for password recovery and the Turnstile widget/token source is implemented. *(Real staging Site Key still pending.)*
- [x] Frontend resets/refreshes the Turnstile challenge after Auth attempts.
- [ ] Test successful human flow.
- [ ] Test missing/invalid/expired CAPTCHA token.
- [ ] Test mobile and desktop.
- [ ] Only then enable CAPTCHA enforcement in Production.

**Important:** do not enable server-side CAPTCHA enforcement before the current frontend can supply the token, otherwise legitimate users can be locked out.

## Server-side legal acknowledgement (P0 — NOT IMPLEMENTED)

An 8 October 2026 Production catalog review confirmed that `private.handle_new_user()` creates the Auth user/profile without rejecting absent legal acknowledgement. The user-facing form alone cannot enforce consent against direct API callers.

- [x] Browser client requires strict `acceptedLegal === true`; automated negative tests added.
- [ ] Implement and review backend enforcement for unsupported/absent/invalid consent on new signup.
- [ ] Server-approved version identifiers must be authoritative, rather than untrusted caller-provided version strings.
- [ ] Document and test explicit alternatives for admin invitations and future identity providers.
- [ ] Prove direct API no-consent requests fail with **no persisted Auth user**, profile or acceptance.
- [ ] Document acceptance evidence, privacy retention and proportional legal review before public activation.

**Do not implement in Production before staging and validation.** See `BACKEND_CONSENT_REVIEW.md` and GitHub issue #6.

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
