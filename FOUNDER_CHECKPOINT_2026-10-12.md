# ORIGEN Cultural — Founder checkpoint | 12 October 2026

> Historical planning/status files include earlier dates and may describe blockers that have already moved. This checkpoint records verified facts on 12 October; it does **not** authorize deployment, billing, beta release, or changes to Production.

## Product and release boundary
- ORIGEN is a free, mobile-first cultural social app. Agentes Culturales share authorised cultural stories; Exploradores Culturales discover, follow, save and share. No marketplace, paid promotions, subscriptions, checkout or old 80/20 revenue split in this MVP.
- Branch: `reconcile-main-beta-2026-10-07`; PR #3 **draft** (no merge to `main`).
- Never deploy to `origencultural.com`, merge, or change Supabase Production without a separate founder decision and release gates.

## Verified infrastructure (read-only, 12 October)
- **Supabase Production** project `xwkjvoyicrrwjybjolld`: `ACTIVE_HEALTHY`; not modified for this checkpoint.
- **Supabase Staging** project `egujmptgnrpajgfpjjxu`: `ACTIVE_HEALTHY`, isolated from Production, Sydney, previously created under confirmed Free/$0 conditions.
- Staging records **17 migration operations**: **14 original historical schema migrations** plus **3 isolated staging-only safety/consent experiments**. Migration history alone is not evidence that signup hooks work or policies withstand malicious clients.
- Staging Security Advisor: one informational lint for `private.cultural_post_rights_events` having RLS enabled with no policies. This private audit table is intentionally not for browser access; confirm grants and invoker paths before changing policy. Not a verified security failure.
- Current Beta browser build must remain **disconnected by default**; `npm run build:visual-preview` creates an intentionally non-functional frontend bundle without Supabase/Auth/uploads. The full test build accepts only the approved Staging URL and its **publishable** key, never Production or secrets.
- **No deployed web Staging URL exists.** The Replit app `origen-cultural-app` is present but its publishing status is `found=false`; do not imply a live app exists.
- A screenshot from the founder shows `origencultural.com` returning **HTTP 503** on 11 October; current restoration not established. Do not confuse the previous public site with the new beta.

## Real visual evidence available now
- GitHub `ORIGEN Browser QA` success run: https://github.com/AnabelBorjaS/origen-cultural-app/actions/runs/38199319845
- Founder screenshot artifact: **`origen-vista-visual-beta-279`**, artifact ID `11724123810`, generated 12 Oct 2026 and scheduled to expire 26 Oct 2026. It contains seven actual Chromium snapshots: desktop/mobile home, desktop/mobile world, Explore, mobile role selection, and Trust.
- Screenshots represent the **real beta static bundle in disconnected mode**, not a working hosted app, production community, live accounts, or completion of QA.
- At verification, the newer beta branch had Quality Gate success for SHA `b605bf80b010`; Browser QA and CodeQL were still executing for that revision. Use the Actions page for their final result; do not transfer earlier PASS status to a newer SHA.

## Next critical path
1. Obtain founder-approved **Cloudflare Pages Free** connection to the GitHub repository (the current tools cannot control Cloudflare). Use branch `reconcile-main-beta-2026-10-07`, build `npm run build:visual-preview` for an initial **visual-only** review (no live Auth), output `dist`. Keep the production domain disconnected.
2. Protect the staging root domain and preview aliases through Cloudflare Access **before any Auth/backend tests**. A `pages.dev` URL is public until Access protection is confirmed. Verify no real data or credentials in the visual-only build.
3. For authenticated staging QA, do **not** use the visual-only build. Complete protected deployment, configure only the two validated Staging publishable settings, activate/verify the **Before User Created** hook in *Staging Auth Dashboard*, then test consent, rights, RLS A/B, moderation and media removal with synthetic accounts.
4. Keep P0 issues #5, #6, #7, #8, #12 open until their end-to-end evidence is complete. Do not invite pilot users yet.
5. Check `origencultural.com` HTTP 503 through hosting/DNS logs under separate approval; unrelated to local screenshot generation.

## Canonical links
- GitHub beta PR: https://github.com/AnabelBorjaS/origen-cultural-app/pull/3
- Staging plan: `STAGING_PLAN.md`
- Hook activation: `STAGING_AUTH_HOOK_ACTIVATION.md`
- Release gate: `RELEASE_GATE.md`
- Staging deployment blocker: https://github.com/AnabelBorjaS/origen-cultural-app/issues/5

**Result:** Progress verified; code and visual captures available. Hosted Staging and Public Beta remain **NO-GO** until protected deployment and security checks pass.
