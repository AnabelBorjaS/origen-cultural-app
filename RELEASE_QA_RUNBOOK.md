# ORIGEN Cultural — Public Beta QA Runbook

Status: **NO-GO until Critical/High checks pass**
Candidate branch: `reconcile-main-beta-2026-10-07`
Release PR: **#3**
Last updated: 8 October 2026

## Test accounts

Use two independent real test accounts:

- **Account A:** Explorer
- **Account B:** Agente Cultural / Cultural Agent

Never reuse the same browser session to prove cross-account isolation. Use separate browser profiles/devices where practical.

## P0 — Auth and session

| Test | Expected result | Status |
|---|---|---|
| A signs up with explicit legal consent | Signup accepted; legal acceptance recorded | ⬜ |
| Signup without legal consent | Client refuses signup | ⬜ |
| Email confirmation | Confirmation succeeds only via approved redirect | ⬜ |
| Login before/after confirmation | Matches configured verification policy | ⬜ |
| Logout | Session removed | ⬜ |
| Password recovery | Approved recovery link works | ⬜ |
| Session on second device | Same account/data available after login | ⬜ |
| Invalid/expired links | Safe error; no session created | ⬜ |

## P0 — Registro completado vs fallos posteriores

Una cuenta creada con éxito no debe registrarse por segunda vez si fallan una imagen opcional o un paso de configuración.

| Prueba | Resultado esperado | Estado |
|---|---|---|
| Signup sin imágenes | Cuenta creada y redirección correcta | ⬜ staging |
| Signup con avatar y portada válidos (sin email confirmation pendiente) | Medios guardados y asociados únicamente al nuevo usuario | ⬜ staging |
| Signup con avatar inválido/error de Storage | Cuenta existente; aviso de foto opcional; no se vuelve a llamar a signup | ✅ navegador simulado #85; ⬜ staging real |
| Avatar se sube y luego falla portada o guardado de perfil | Archivos subidos sin asociar se limpian o se registra incidencia; cuenta sigue existente | ⬜ staging |
| Email confirmation requerida | No intentar uploads antes de confirmar; explicar cómo añadir fotos después | ⬜ staging |
| Cargar perfil tras signup falla | Mostrar cuenta creada sin prometer perfil preparado; permitir iniciar sesión | ⬜ staging |

La prueba de navegador `tests/browser-smoke.mjs` usa un cliente simulado: **no** equivale a un test de Storage/RLS real.

## P0 — CAPTCHA / bot protection

Provider: **Cloudflare Turnstile**

| Test | Expected result | Status |
|---|---|---|
| Signup with valid token | Auth request succeeds subject to normal validation | ⬜ |
| Signup without token after enforcement | Rejected safely | ⬜ |
| Login with valid token | Auth request succeeds subject to credentials | ⬜ |
| Login without/invalid token | Rejected safely | ⬜ |
| Password recovery with valid token | Recovery request accepted | ⬜ |
| Expired/reused token | Rejected; user can retry | ⬜ |
| Widget/network failure | Accessible retry/error state; no silent lockout | ⬜ |
| ES/EN challenge/error state | Understandable in both languages | ⬜ |

Do not mark this section PASS until the widget is tested **before and after** Supabase CAPTCHA enforcement.

## P0 — RLS / cross-user isolation

With A and B authenticated separately:

| Attempt | Expected result | Status |
|---|---|---|
| A edits A profile | Allowed | ⬜ |
| A edits B user-owned data | Denied / zero rows changed | ⬜ |
| B edits B normal cultural profile fields | Allowed | ⬜ |
| B changes own `status` to verified | **Denied** | ⬜ |
| B changes `verified_at` | **Denied** | ⬜ |
| B changes `follower_count` directly | **Denied** | ⬜ |
| A reads B private claim/report data | Denied | ⬜ |
| Public visitor reads published cultural profile/post | Allowed | ⬜ |

## P0 — Storage

### Valid media
- [ ] Avatar JPG/PNG/WEBP ≤ 5 MB uploads.
- [ ] Cover JPG/PNG/WEBP ≤ 8 MB uploads.
- [ ] Post media allowed image/video type ≤ 50 MB uploads.
- [ ] Uploaded file belongs to authenticated user's folder.
- [ ] Owner can delete own media.

### Negative tests
- [ ] Unsupported MIME type is rejected.
- [ ] Oversized avatar is rejected.
- [ ] Oversized cover is rejected.
- [ ] Oversized post media is rejected.
- [ ] A cannot overwrite/delete B's media.
- [ ] Path manipulation cannot escape the user's folder.
- [ ] Filename cannot inject executable HTML/JS into the UI.

## P0 — Claims and verification

- [ ] A reference profile is visibly identified as unclaimed/reference.
- [ ] Authenticated user can submit a valid claim.
- [ ] Claim requires authority declaration.
- [ ] User cannot claim an already-owned profile.
- [ ] Claim does **not** automatically grant ownership.
- [ ] Pending claim can be withdrawn only by claimant.
- [ ] Approval requires privileged ORIGEN admin flow.
- [ ] Approved claim assigns ownership and verified status only through the privileged path.

## P0 — Reports and abuse prevention

- [ ] Authenticated user can submit a report.
- [ ] Reporter can read only their own report.
- [ ] Another normal user cannot read it.
- [ ] Post spam limit triggers after configured threshold.
- [ ] Comment spam limit triggers after configured threshold.
- [ ] Claim spam limit triggers after configured threshold.
- [ ] Report spam limit triggers after configured threshold.
- [ ] UI handles rate-limit errors without exposing internals.

## P1 — Core social journey

- [ ] Discover cultural profiles.
- [ ] Follow / unfollow.
- [ ] Favourite / unfavourite.
- [ ] Create cultural post.
- [ ] Agente Cultural post requires cultural purpose.
- [ ] Agente Cultural cannot submit text-only post.
- [ ] Like / unlike.
- [ ] Save / unsave.
- [ ] Comment.
- [ ] Infinite feed loads the next page without duplicate posts.
- [ ] Video pauses/behaves correctly when not visible.
- [ ] Refresh preserves server-backed actions.

## P1 — Cultural Passport & wellbeing

- [ ] Passport displays expected collections/countries/categories.
- [ ] Progress is not awarded merely for screen time.
- [ ] 120-minute wellbeing setting is described as a product default, not a medical rule.
- [ ] Reminder is dismissible/voluntary.
- [ ] User progress is not lost for taking a break.

## P1 — Trust / privacy

- [ ] Trust Center is reachable from the product.
- [ ] Beta scope accurately says no payments/bookings/payouts/private messaging.
- [ ] Supabase Auth/database/storage use is disclosed.
- [ ] Browser storage inventory matches actual product.
- [ ] No optional advertising/marketing analytics execute before required consent.
- [ ] Cultural Rights guidance is visible.
- [ ] Reporting/copyright route is usable.

## P1 — UX / compatibility

Test at minimum:
- mobile portrait;
- tablet;
- desktop;
- current Chrome;
- current Safari;
- current Firefox or Edge where available.

Checks:
- [ ] ES complete.
- [ ] EN complete.
- [ ] Keyboard navigation for key flows.
- [ ] Visible focus states.
- [ ] Meaningful labels for forms.
- [ ] Loading states.
- [ ] Empty states.
- [ ] Error states.
- [ ] Broken-link scan.
- [ ] Images/video do not overflow small screens.
- [ ] Contrast and text legibility reviewed.

## Severity rules

**Critical:** data exposure, account takeover, cross-user write, secret leakage, verification bypass, destructive data loss.

**High:** core Auth broken, uploads unsafe, claims/reporting broken, major mobile blocker, Trust materially inaccurate.

**Medium:** important UX/localisation/accessibility defect without security/data loss.

**Low:** cosmetic/polish issue.

Public Beta requires:
- **0 open Critical**
- **0 open High**
- documented decision for remaining Medium/Low issues.

## Final GO checklist

- [ ] PR #3 Quality Gate green.
- [ ] Auth production checklist complete.
- [ ] Two-account RLS tests complete.
- [ ] Storage negative tests complete.
- [ ] Claims/report tests complete.
- [ ] Staging verified.
- [ ] Trust/legal proportional review complete.
- [ ] Rollback path confirmed.
- [ ] Final CEO GO decision recorded.


## P1 — Service worker / PWA privacy

- [ ] Install/open staging as PWA where supported.
- [ ] Confirm ORIGEN shell/static assets work offline as expected.
- [ ] Confirm Supabase/Auth/network data is **not** served from Cache Storage.
- [ ] Confirm logout does not expose authenticated data from offline cache.
- [ ] Confirm a new deployment updates app JS/CSS without requiring manual cache clearing.
- [ ] Confirm private/no-store responses are not stored by the service worker.


## CI role simulation vs real-account QA
- Browser QA simulates Explorer and Cultural Agent UI states locally to verify navigation and Beta publishing scope.
- The simulation does **not** authenticate against Supabase and does **not** replace two-account RLS testing.
- Required staging evidence still includes: real Explorer signup/login, real Cultural Agent signup/login, creator post creation, Explorer post denial, cross-user write denial, Storage ownership denial and claim/report isolation.
- A release item may be marked complete only when the evidence type matches the control being tested (UI simulation, browser deployment test, or real Supabase authorization test).
