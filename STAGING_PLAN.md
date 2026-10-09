# ORIGEN Cultural — Staging Plan

Status: planned, not yet deployed
Cost target: **AUD/USD $0 hosting during controlled beta**
Last reviewed: 9 October 2026

**Verified faster path (9 Oct):** Supabase organization `ORIGEN Cultural` reports `free`, and the provider `get_cost(project)` returns **$0/month** for a second project in that organization. Requires explicit founder selection/approval and final $0 confirmation; no project has been created. All 14 historical migrations have now been recovered to GitHub from read-only migration history, but no local/staging replay or equivalence test has yet run. `npm run preflight:staging:schema:strict` validates file-presence parity only, not database correctness.

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
- Use the generated `*.pages.dev` URL for controlled testing **only after checking its Cloudflare Access policy**; the hostname is public by default.

Turnstile public build variable (add **only after** creating the staging widget):
- `ORIGEN_TURNSTILE_SITE_KEY=<staging public Site Key>`
- This is a public identifier and is written into `dist/runtime-config.js`.
- **Never** add the Turnstile Secret Key to Cloudflare Pages build variables, GitHub, or browser runtime. The Secret Key belongs only in Supabase Auth CAPTCHA configuration.

Cloudflare Pages provides preview URLs for branches and pull requests when Git integration is enabled.

## Mandatory Cloudflare Access protection

**Security allowlist used by GitHub Staging Audit:** exactly `origen-cultural-staging.pages.dev` and its preview subdomains (`*.origen-cultural-staging.pages.dev`). The auditor **refuses all other hosts**, HTTP, userinfo, custom ports, query strings and fragments before attaching Access credentials. If a different Cloudflare project name is selected, change this approved hostname in code, review the change, and re-run CI **before** using a service token. No arbitrary URL input may override the allowlist.

Cloudflare Pages preview URLs are **public by default**. Protect both (1) preview aliases and (2) the **root** staging hostname `origen-cultural-staging.pages.dev`. The Pages setting `Settings > General > Enable access policy` covers previews only; Cloudflare's known-issues guide explains the extra step for the root `*.pages.dev` domain.

Before using real test credentials:
1. Create Access allow rules limited to approved testers and protect the root + branch/hashed previews.
2. Test from a private/incognito browser that both URL forms require Cloudflare Access authentication.
3. Use Cloudflare Access **Service Auth** with a service token for the automated GitHub Staging Audit. Store only `ORIGEN_CF_ACCESS_CLIENT_ID` and `ORIGEN_CF_ACCESS_CLIENT_SECRET` in GitHub encrypted Actions secrets; never add them to files, GitHub issues or Pages public build variables.
4. The Staging Audit now attaches these headers and does not follow cross-origin redirects; it intentionally fails with a clear diagnostic when the protected site redirects to Access login without valid service credentials.
5. Avoid creating any real user accounts until the access policy is confirmed.

Official:
- https://developers.cloudflare.com/pages/configuration/preview-deployments/
- https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain
- https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/

Cost rule: select only **Free** options and verify a $0 charge before any billing/payment authorisation. Cloudflare Zero Trust Free includes Access for small teams but may request billing information; do not accept a paid plan.

## P0 · Aislamiento obligatorio del backend (9 de octubre de 2026)

**Hallazgo corregido en la compilación de staging:** el cliente fuente `supabase-client.js` incluye una URL y una clave publicable del **Supabase de Production**. Copiarlo directamente a una web `*.pages.dev` podría conducir las pruebas de Auth o publicaciones al backend real, aun cuando la URL de la web sea diferente.

El proceso `npm run build:static` ahora:
1. Reescribe **únicamente el artefacto `dist/supabase-client.js`** para eliminar completamente URL y clave publicable de Production.
2. Por defecto genera una **previsualización visual sin backend**, mediante un host `.invalid` inalcanzable y una clave no funcional. Coloca aviso bilingüe visible; **no se permiten pruebas de creación real de cuentas o publicaciones** en este modo.
3. Para pruebas reales requiere conjuntamente las dos variables de entorno de build `ORIGEN_STAGING_SUPABASE_URL` y `ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY`, pertenecientes a un **proyecto Supabase separado**. Rechaza valores incompletos, URL de Production, dominios no oficiales, HTTP, claves secretas y la clave publicable de Production. Solo se admiten claves `sb_publishable_...` de frontend.
4. Si una comprobación falla, elimina `dist/` y detiene el build, en vez de dejar una copia peligrosa lista para subir.
5. El test `tests/staging-build-isolation.mjs` simula escenarios inválidos y válidos, sin tocar ninguna base de datos.

**Cuidado:** el fichero fuente bajo control de versiones conserva por ahora la configuración histórica de Production para desarrollo. La protección se aplica al artefacto generado por `build:static`. **Nunca** subir el repositorio crudo a Pages, omitir el build, apuntar las variables al proyecto real, ni copiar claves a issues o al chat.

Antes de conectar staging a un proyecto Supabase aislado:
- Confirmar que el proyecto nuevo y el plan siguen dentro de un coste autorizado de **$0**; **no crear ni contratar automáticamente**.
- Configurar ambas variables en el entorno de compilación de **Cloudflare Pages**; la clave publicable está destinada al frontend y no sustituye RLS ni el control legal de Auth.
- Verificar que el artefacto desplegado coincide con el manifest de release y que **no contiene** la URL ni clave de Production.
- El auditor `npm run audit:staging` comprueba ahora aislamiento real del **asset desplegado**; una previsualización sin backend **no pasa la puerta de QA de Auth**, aunque sirva para inspección visual.
- Conectar la beta únicamente al proyecto aislado, protegido detrás de Cloudflare Access; después ejecutar las pruebas adversariales de los issues #6–#8.

**Estado al 9 de octubre de 2026:** se comprobó que en la conexión Supabase disponible solo figura **ORIGEN Cultural Production**. No existe otro proyecto de staging confirmado. No se creó ningún proyecto ni se modificó Production.

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

**Supabase staging must be isolated for tests that modify Auth hooks/functions.** The production project does not currently enforce server-side consent. Do not install the proposed SQL in Production, or perform negative signup tests against the production Auth API.

A static, non-authenticated visual preview can run without a staging database; for backend Auth/consent and two-account security tests, provision a separate staging Supabase project **only after confirming Free eligibility and explicit approval of any cost**.

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
- the root Pages hostname and preview aliases are protected behind Cloudflare Access;
- the authenticated audit runs with encrypted service-token credentials, while unauthorised browsers cannot access the staging app;
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

The workflow executes `npm run audit:staging`. For a site behind Cloudflare Access, configure a **Service Auth** policy and matching GitHub encrypted secrets; otherwise the audit intentionally fails at the Access redirect. The audit never logs the client secret or follows redirects with Access headers.

With authorised service credentials, the workflow verifies:
- homepage returns HTTP 200 over HTTPS;
- response headers include anti-framing, `nosniff`, Referrer Policy, Permissions Policy and CSP;
- CSP includes `frame-ancestors 'none'` and `object-src 'none'`;
- core ORIGEN runtime assets are available **to the authorised auditor**;
- internal Markdown, SQL, package metadata and GitHub workflow files are not served even **to the authorised auditor**;
- service worker is available with a JavaScript-compatible content type.

A failed staging audit is a **NO-GO** for Auth QA or release.

## Creación verificada — 9 octubre 2026

- ✅ **ORIGEN Cultural Staging** creado con aprobación expresa de la fundadora en organización **ORIGEN Cultural**, región **ap-southeast-2 (Sydney)**, plan Free, **costo confirmado $0/mes**.
- Referencia de proyecto de pruebas: `egujmptgnrpajgfpjjxu`. Production: `xwkjvoyicrrwjybjolld`. Son proyectos distintos; jamás reutilizar datos ni credenciales de Production.
- ✅ El proyecto responde `ACTIVE_HEALTHY`; inventario inicial **0 migraciones**, **0 tablas públicas de aplicación** y Security Advisor **0 lints**. Esta comprobación no valida aún la seguridad de la beta.
- ⛔ **Aún no instalado**: 14 migraciones recuperadas, propuestas P0 de consentimiento, protección cultural, frontend aislado, protección Cloudflare Access y QA de dos cuentas. **No existe URL de aplicación Staging desplegada**.
- Próximo paso: recuperar/validar la secuencia de migraciones y esquema en este proyecto aislado antes de crear usuarios sintéticos. Las propuestas `REVIEW_ONLY` no se ejecutan sin revisión de permisos, versión legal, rollback y pruebas.

## Instalación del esquema en Staging — 9 octubre 2026

- ✅ Se aplicaron las **14 migraciones históricas** en orden al proyecto aislado `egujmptgnrpajgfpjjxu`, con la herramienta de migración de Supabase. Staging conserva sus propios IDs/versiones de historial de aplicación; los SQL son los 14 archivos de la rama beta.
- ✅ Consulta solo lectura: **11 tablas públicas**, **33 políticas de RLS**, **14 funciones privadas** y **3 buckets** (avatars, covers y post-media); la comparación de esos conteos con Production coincide.
- ✅ Ninguna tabla pública de aplicación sin RLS en el inventario; Supabase Security Advisor **0 lints**; **0 usuarios** y **0 publicaciones** al terminar.
- ⚠️ Las comparaciones de conteos **no validan equivalencia completa**, permisos de un usuario real, flujos Auth ni políticas Storage con dos usuarios. Los 3 buckets son públicos como en Production: el P0 de retirada de medios persiste.
- ⛔ Propuestas de consentimiento legal y derechos culturales **NO aplicadas**. Antes de usarlas hay que revisar y probar Auth/server checks/rollback en Staging. Sin hosting web, Cloudflare Access ni cuentas reales creadas.
- ⛔ `origencultural.com` y Supabase Production **sin cambios**. Release NO-GO.

## Derechos culturales instalados en STAGING — 9 Oct 2026

- ✅ En **ORIGEN Cultural Staging** (`egujmptgnrpajgfpjjxu`) se aplicó la propuesta `ORIGEN_CULTURAL_POST_RIGHTS_STAGING_REVIEW_ONLY.sql` (sin envoltura BEGIN/COMMIT para la herramienta de migración), con nombre de ejecución `staging_cultural_post_rights_atomic_record_test_only`. **No se aplicó a Production**.
- ✅ Comprobación SELECT-only: columnas `rights_acknowledged` y `cultural_acknowledged` presentes, tabla privada `private.cultural_post_rights_events` existente con RLS, triggers `origen_post_rights_after_insert` y `origen_post_rights_before_update` activos; el rol `authenticated` no posee SELECT sobre la bitácora.
- ℹ️ Security Advisor indica **1 aviso informativo** `rls_enabled_no_policy` sobre la tabla **privada sin políticas públicas**; es restricción deliberada de acceso, no prueba de vulnerabilidad. Ver https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- ⚠️ Faltan **pruebas de integración reales con dos cuentas sintéticas**, casos de POST válido/inválido vía Data API, rollback al fallar la bitácora, edición, eliminación y revisión legal de retención. Hasta entonces P0 #7 sigue ABIERTO y el lanzamiento sigue NO-GO.
- ⚠️ Se añadió una migración de pruebas en Staging con versión propia. Antes de hacer futuros despliegues es obligatorio revisar la concordancia de historial y generar una migración versionada aprobada. La propuesta no debe tratarse como lista para Production.
