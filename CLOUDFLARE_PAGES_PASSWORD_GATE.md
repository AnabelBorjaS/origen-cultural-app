# Cloudflare Pages password gate for the ORIGEN visual preview

This is a temporary, $0 access gate for the **visual-only staging preview**. It is not a replacement for Cloudflare Access or production authentication. It uses one shared HTTP Basic Auth password, has no per-person audit trail, and should not protect personal or confidential data.

## What the middleware does

- Runs before static assets for every path.
- Returns 503 if the Cloudflare secret is missing or shorter than 20 characters.
- Returns 401 and asks for Basic Auth if credentials are missing or incorrect.
- Serves the preview only when the username is `origen-review` and the supplied password matches the Cloudflare secret.
- Disables caching and search indexing on responses.
- Does not store the password in GitHub or the build output.

## Cloudflare setup (account owner)

1. In Workers & Pages, open `origen-cultural-staging` → **Settings** → **Variables and secrets**.
2. Add a **Secret** named `ORIGEN_STAGING_PASSWORD`. Generate a unique password of at least 20 characters; do not reuse an account password or send it in chat.
3. Add it to both **Production** and **Preview** environments. If Cloudflare only shows one environment at a time, switch the environment selector and repeat.
4. Keep **Fail open/closed** set to **Fail closed** under **Settings** → **Runtime**.
5. Merge the reviewed password-gate change into the Pages production branch only after the secret is saved. Cloudflare will build and deploy automatically.
6. Test the base `*.pages.dev` hostname in a private browser window. It must challenge for a password. Use username `origen-review` and the secret saved in Cloudflare. Test a random path and a static asset URL too.
7. Test a preview deployment URL as well. If the secret was not configured for Preview, the middleware must return 503, never the site.
8. Do not share the URL or invite other reviewers until both environments have been checked.

## Security and cost limits

This middleware is intended only for an internal, visual-only demo without Supabase connections, registrations, uploads, or real user data. A shared password is weaker than individual Cloudflare Access identities. Cloudflare Pages Functions consume the account's Workers/Pages Functions request quota; monitor usage and keep the project on its $0 plan. Do not enter payment details or choose a paid plan to complete this setup. If Cloudflare requires payment details, stop and leave the preview closed.
