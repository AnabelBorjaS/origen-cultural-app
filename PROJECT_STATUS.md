# Estado del proyecto — ORIGEN Cultural

Última actualización: 8 de octubre de 2026

## Resumen ejecutivo verificado — 8 Oct 2026

**Fase:** beta controlada pre-staging. **Decisión de lanzamiento:** NO-GO público.

- GitHub PR #3: `reconcile-main-beta-2026-10-07` hacia `main`, abierto en borrador y mergeable; no fusionar todavía.
- CI verificada en rama beta después del fix de registro: **Quality Gate #221 PASS · Browser QA #85 PASS · CodeQL #26 PASS**. La QA de navegador incluye el fallo simulado de subida de foto después de crear la cuenta; las pruebas no usan cuentas reales.
- Prueba nueva `tests/client-ownership.mjs`: confirma aislamiento de eliminación entre autores, control de borrados de cero filas, limpieza de media solo tras eliminación confirmada y rechazo de URL externa/traversal. Corre en `npm run check:release` sin conexión a la base de datos.
- Supabase Production: proyecto activo, 11 tablas `public` con RLS activado y Security Advisor con 0 lints (revisión de 8 Oct). 4 perfiles culturales de referencia; todavía 0 cuentas de usuario y 0 publicaciones reales según el resumen de tablas.
- **Cloudflare Pages staging aún no desplegado.** Paso de autorización/conexión y checklist: [issue #5](https://github.com/AnabelBorjaS/origen-cultural-app/issues/5).
- El consentimiento, Auth real con dos cuentas, CAPTCHA server-side, Storage negativo, solicitudes de privacidad, backup lógico validado, revisión legal y pruebas de staging siguen siendo bloqueadores antes de una beta pública.
- `main` y el dominio `origencultural.com` permanecen fuera de estos cambios. No aprobar gasto ni suscripciones durante este paso.

## Avances nuevos — 8 Oct 2026 (segunda iteración)

- ✅ Eliminado el acceso a Supabase dentro de `onAuthStateChange`; el evento ahora es síncrono y el refresco de interfaz se agenda fuera del callback de Auth, para evitar bloqueos documentados.
- ✅ Se limpian `profile`, follows, favoritos, likes, saves y comentarios al cerrar sesión, recuperar una sesión nula o pasar a otro usuario.
- ✅ Una lectura de perfil antigua ya no debe sobrescribir el perfil de una sesión que ha cambiado durante la solicitud.
- ✅ La interfaz no finge un cierre de sesión correcto si Supabase devuelve un error.
- ✅ Nueva suite aislada `tests/auth-session.mjs` integrada a `npm run check:release`, sin usar datos/cuentas de Production.
- ✅ Calidad del código verificada en commit de aplicación `a4f2a1159d86f59d1421a158724628f8aa20b71e`: Quality Gate **#216 PASS** y CodeQL **#21 PASS**. Browser QA de ese commit estaba en ejecución al documentar; no contarla como aprobación hasta su resultado definitivo.
- ✅ Guía operativa interna `PILOT_ECUADOR_PLAYBOOK.md` creada para 10 Agentes Culturales potenciales con consentimiento, límites beta, métricas propuestas, ética cultural y controles de costos. No representa participantes confirmados.
- ⛔ Cloudflare Pages staging / Auth end-to-end con dos cuentas, Turnstile server-side, recuperación y revisión legal siguen pendientes. No merge a `main` ni cambio de dominio público.

## Avance confirmado — registro resiliente (8 Oct 2026)

- ✅ `doRegister` separa la creación de cuenta Supabase del upload opcional de avatar/portada.
- ✅ Si falla una imagen después de crear la cuenta, la interfaz confirma que la cuenta sí existe y ofrece editar la foto después, sin pedir otro registro.
- ✅ Los medios recién subidos se intentan limpiar si falla la configuración posterior; si el perfil no termina de cargar, se comunica el registro exitoso y se sugiere iniciar sesión para completarlo.
- ✅ `tests/browser-smoke.mjs` ahora simula en Chromium una subida fallida de avatar durante el registro y comprueba **una sola llamada a signup**, navegación y mensaje correcto.
- ⛔ La prueba usa APIs simuladas: Auth real, registros con correo confirmado, límites Storage y limpieza de archivos en Supabase requieren staging y dos cuentas de QA.
- ⛔ [Issue #5](https://github.com/AnabelBorjaS/origen-cultural-app/issues/5) para desplegar Cloudflare Pages Free sigue abierto. No se ha desplegado staging, hecho merge a `main` ni migrado `origencultural.com`.

## Seguridad del consentimiento — revisión 8 Oct 2026

- ✅ Auditoría de solo lectura de las políticas RLS, permisos de `legal_acceptances` y función `private.handle_new_user()` de Supabase Production.
- ⚠️ Brecha confirmada de control: `private.handle_new_user()` crea usuario/perfil aunque no exista `accepted_legal=true`, y usa versiones de términos enviadas por el cliente. **No se ha detectado incidente; es una debilidad preventiva de arquitectura.**
- ✅ `supabase-client.js` exige `acceptedLegal === true`; las pruebas aisladas cubren entradas inválidas y versión v1.2.
- ✅ Propuesta de protección y plan de QA sin cambios de producción: `BACKEND_CONSENT_REVIEW.md`.
- ⛔ Backend P0 pendiente antes de registro público. Requiere validación pre-alta, versión legal definida en servidor, control de invitaciones y pruebas reales de staging. No se aplicó ninguna migración ni cambios a Auth en Production.

## Implementación propuesta sin despliegue — 8 Oct 2026

- ✅ Verificadas en GitHub las pruebas de la última versión anterior a esta preparación: Quality Gate **#229 PASS**, Browser QA **#93 PASS**, CodeQL **#34 PASS**.
- ✅ Supabase Production auditado solo con lecturas: `auth.users` = **0**, `legal_acceptances` = **0** en la consulta del 8 Oct.
- ✅ Función SQL propuesta `public.origen_before_user_created(event jsonb)`, compatible con la documentación de Supabase Auth Hook en Free, preparada bajo `supabase/proposals/ORIGEN_BETA_SERVER_SIGNUP_CONSENT_REVIEW_ONLY.sql`.
- ✅ Propuesta complementaria para `private.handle_new_user()`: exigir `accepted_legal` JSON booleano verdadero y registrar exclusivamente versiones legales v1.2 definidas por ORIGEN, sin confiar en versiones enviadas por cliente.
- ✅ Ocho casos del predicado de consentimiento se validaron con consultas de solo lectura (aceptar `true` booleano; rechazar ausente, `false`, `null`, `"true"`, número 1, proveedor no admitido y alta anónima). **Esto no es prueba del hook instalado.**
- ✅ Archivo de QA de solo lectura para ejecutar después de instalar el hook en un proyecto staging separado: `supabase/proposals/ORIGEN_CONSENT_STAGING_QA_READ_ONLY.sql`.
- ✅ [Issue #6](https://github.com/AnabelBorjaS/origen-cultural-app/issues/6) actualizado con enlaces, evidencia y condiciones de cierre.
- ⛔ **Sin cambios en Production:** los SQL se guardaron en `supabase/proposals/`, NO en migraciones automáticas; ningún hook está activado, no se creó proyecto staging ni usuarios de prueba.
- ⛔ Siguiente dependencia operativa: [issue #5](https://github.com/AnabelBorjaS/origen-cultural-app/issues/5) y autorización de herramientas gratuitas de staging; después validación Auth/RLS/Storage, consentimiento y asesoría legal.

## Fuente de trabajo actual
**GitHub es la fuente oficial del código.**
Repositorio: `AnabelBorjaS/origen-cultural-app`

Replit no es la fuente principal.

## Infraestructura completada
- Organización Supabase: ORIGEN Cultural.
- Proyecto: ORIGEN Cultural Production.
- Plan: Free.
- Región: ap-southeast-2 (Sydney, Australia).
- Supabase Auth integrado.
- RLS habilitado en las tablas públicas.
- Storage para avatars, covers y post-media.
- Publicaciones, comentarios, likes y guardados conectados a Supabase.
- Follows y favoritos de perfiles culturales conectados a Supabase.
- Recuperación/cambio de contraseña integrado.
- Aceptación legal v1.2 registrada desde el alta.
- Flujo de reclamación de perfiles conectado a Supabase.
- Perfiles piloto tratados como referencias no reclamadas.
- Límites anti-spam y límites de contenido añadidos.
- Content Security Policy y validación de enlaces externos añadidas.
- Security Advisor de Supabase: 0 lints de seguridad activos tras el último hardening.

## Producto actual
La beta está diseñada como una única plataforma:
- web pública + web app;
- una sola cuenta ORIGEN;
- datos persistentes/sincronizados mediante Supabase;
- futura PWA;
- futuras apps Android/iOS sobre el mismo backend.

## Modelo aprobado
### Cultural Providers
El perfil público debe permitir identidad, territorio, historia cultural, servicios/oferta, web/contacto, redes sociales y feed cultural/educativo con fotos y videos.

### Explorers
Descubren, siguen, guardan, aprenden y contactan a Cultural Providers.

### Partners / Academia ORIGEN
Arquitectura futura documentada. Partners tendrán perfil institucional, feed, follows, programas, solicitudes, enrolments, credenciales/badges verificables y métricas de impacto. No es requisito construir toda Academia para la primera beta pública, pero debe comunicarse como roadmap y no prometer funciones todavía inactivas.

## Bloqueadores actuales de Public Beta
1. ✅ Perfil profesional de Proveedor Cultural incorporado en la Web App: historia, servicios/oferta, web/contacto, redes y feed cultural. Los datos profesionales se guardan en el perfil y las cuentas de Proveedor se preparan para ser públicas/descubribles.
2. Confirmar y probar Auth real: email confirmation, login/logout, password reset y sesión entre dispositivos.
3. Configurar únicamente URLs/redirecciones aprobadas para el dominio de ORIGEN.
4. Activar y probar protección anti-bot/CAPTCHA para registro, login y recuperación.
5. Probar RLS con al menos dos cuentas separadas y verificar que una cuenta no pueda editar/leer información privada de otra.
6. Probar uploads válidos y maliciosos, límites de tamaño/MIME, ownership y borrado.
7. Probar anti-spam, reportes y reclamación de perfil de principio a fin.
8. Actualizar Trust Center/Privacy/Cookies para reflejar Supabase, Storage y el inventario técnico real.
9. Confirmar que no se cargan analytics/ads opcionales antes de consentimiento.
10. QA móvil/desktop, accesibilidad, ES/EN, enlaces, errores/empty/loading states y navegadores principales.
11. ✅ CI/check automático mínimo activo en GitHub y passing.
12. Desplegar una beta/staging de la rama de lanzamiento y validar CSP, Auth redirects y flujos reales.
13. Resolver bugs Critical/High.
14. Hacer revisión final de Trust/legal proporcional al mercado inicial.
15. Solo después: merge a `main` y migración intencional de `origencultural.com`.

## Estado de lanzamiento
**NO-GO público todavía.**
La reconciliación de ramas ya fue resuelta en una rama nueva creada desde el `main` actual: `reconcile-main-beta-2026-10-07`.
El PR #3 (`Release candidate: reconciled ORIGEN Supabase beta`) está abierto en borrador, GitHub lo reporta como mergeable y el Quality Gate del PR terminó en `success`.
No hacer merge a `main` ni migrar `origencultural.com` hasta completar Auth/CAPTCHA, QA de seguridad con cuentas reales, staging y revisión final de Trust/legal.

## Avances añadidos — 7 Oct 2026
- ✅ Centro de confianza visible dentro de la Web App con resúmenes beta v1.2 alineados al alcance actual.
- ✅ Registro actualizado para exigir aceptación explícita de Términos, Privacidad, Normas de Comunidad y Derechos Culturales antes de crear cuenta.
- ✅ Supabase client rechaza el alta si no existe consentimiento explícito.
- ✅ Métricas del landing ajustadas para no simular actividad real: territorios explorables, perfiles de referencia y estado Beta.
- ✅ Globo cultural restaurado con textura de Tierra + fondo espacial mediante CSP permitida de forma controlada.
- ✅ Feed infinito paginado desde Supabase y comportamiento de video visible/pausado.
- ✅ Bienestar digital con objetivo diario suave de 120 minutos y recordatorio voluntario.
- ✅ Pasaporte Cultural evolucionado hacia colecciones, países, categorías, niveles e insignias sin premiar tiempo de pantalla.
- ✅ Smoke tests automatizados añadidos al Quality Gate para Trust, consentimiento, marca, globo, feed, bienestar y ausencia de service-role key en frontend.
- ✅ Estado de follow/favorite corregido para perfiles reales de Proveedores Culturales.

### Bloqueadores que permanecen antes de Public Beta
- Configurar y probar CAPTCHA / anti-bot en Supabase Auth.
- Confirmar email verification y redirect URLs únicamente para dominios aprobados.
- Probar RLS de extremo a extremo con dos cuentas reales.
- Probar uploads válidos/maliciosos y ownership.
- Revisar Trust Center con profesional jurídico antes de quitar el estado beta/draft.
- QA real mobile/desktop/accessibility y staging.
- Resolver cualquier conflicto de merge del PR antes de integrar a main.


### Feed cultural de Proveedores — 7 Oct 2026
- ✅ Campo backend `content_purpose` añadido a publicaciones culturales con valores controlados: education, history, technique, territory, language, gastronomy, arts, heritage y community.
- ✅ El formulario obliga a seleccionar un propósito cultural.
- ✅ Los Proveedores Culturales solo pueden elegir Foto, Carrusel o Video; la opción Texto se reserva para otros tipos de cuenta.
- ✅ El frontend bloquea de forma explícita publicaciones de texto-only para Proveedores.
- ✅ El feed muestra la etiqueta de propósito junto a la categoría.
- ✅ Quality Gate y smoke tests pasan después de estos cambios.
- ✅ Supabase Security Advisor continúa con 0 lints de seguridad después de la migración.


## Estado GitHub verificado — 7 Oct 2026
- Rama pública principal: `main`.
- Rama de lanzamiento: `launch-beta-supabase`.
- El Quality Gate del commit más reciente de la beta finalizó correctamente (`success`).
- `launch-beta-supabase` y `main` están divergidas; la beta contiene trabajo nuevo y `main` también recibió cambios independientes.
- El PR #2 permanece en draft y actualmente no es mergeable.
- Acción obligatoria antes de release: reconciliar las ramas sin perder cambios de producción, volver a ejecutar Quality Gate y repetir QA/staging.


### Reconciliación de ramas completada — 7 Oct 2026
- ✅ Backup del `main` actual creado: `backup-main-2026-10-07-pre-reconcile`.
- ✅ Nueva rama de release creada desde `main`: `reconcile-main-beta-2026-10-07`.
- ✅ Funcionalidad beta Supabase portada sobre la historia actual de producción.
- ✅ Nomenclatura pública `Agente Cultural / Cultural Agent` preservada.
- ✅ Runtime antiguo `backend-runtime.js` retirado por quedar reemplazado por la integración beta.
- ✅ PR #3 abierto en draft y mergeable.
- ✅ ORIGEN Quality Gate del PR #3 finalizó con éxito.
- ⛔ Merge a `main` sigue bloqueado hasta completar el release gate.


### Browser/Auth hardening — 7 Oct 2026
- ✅ Removed legacy `oc-session` and local profile-follow state from Mundo Cultural.
- ✅ Mundo Cultural account/follow actions now use the Supabase-backed ORIGEN API.
- ✅ Public terminology standardised to `Agente Cultural / Cultural Agent` in the current beta UI.
- ✅ Trust Center browser-storage disclosure aligned with localStorage, Supabase session persistence and service-worker Cache Storage.
- ✅ Cloudflare-compatible security headers added in `_headers`.
- ✅ Auth callbacks require HTTPS outside localhost.
- ✅ Supabase Auth client prepared to accept CAPTCHA tokens for signup, login and password recovery.
- ⏳ CAPTCHA provider/widget + server-side enforcement remain blocked until an approved staging URL and provider keys exist.
- ⏳ Public Beta remains NO-GO; `main` and `origencultural.com` remain untouched.


### Staging package readiness — 7 Oct 2026
- ✅ Cloudflare Pages Free re-verified as suitable for static staging; Git integration supports branch/PR previews.
- ✅ Release build now uses explicit runtime whitelist via `npm run build:static`.
- ✅ `dist/` excludes Markdown, SQL, GitHub/agent/Replit development files.
- ✅ Release build rejects any `service_role` reference in deployable runtime text.
- ✅ GitHub Quality Gate #189 passed on the current deployable runtime + deterministic release evidence artifacts.
- ✅ Artifacts `origen-static-189` and `origen-release-evidence-189` generated: 26 public runtime files, 6.66 MB.
- ✅ Deterministic runtime content digest: `sha256:c30d180a021a99bc088d9fe0e915b4cb05be99e2ac594721d5832a5963f20adc`.
- ⏳ External Cloudflare Git authorization/project creation is the remaining step before a real HTTPS staging URL exists.
- ⛔ No custom domain changes and no merge to `main` yet.


### Accessibility, i18n and CSP hardening — 7 Oct 2026
- ✅ Critical Auth views (login, password recovery and reset) have ES/EN copy.
- ✅ Registration wizard and legal-consent flow have ES/EN copy while preserving canonical cultural-category values.
- ✅ Persistent shell/navigation/search/wellbeing copy updates with ES/EN and document language follows the active locale.
- ✅ Programmatic form label associations, visible keyboard focus, accessible icon controls and `aria-current` navigation baseline added.
- ✅ Runtime inline event handlers removed; strict CSP does not require `unsafe-inline` for scripts.
- ✅ No inline script blocks, `eval`, `new Function` or `javascript:` runtime schemes found in the source audit.
- ✅ Runtime file triggers/search actions/avatar fallback now use CSP-safe event listeners.
- ✅ User-editable profile text is escaped before HTML rendering in directory/search surfaces.
- ✅ Persisted media URLs pass through protocol allow-list sanitizers before rendering.
- ✅ Mundo Cultural live-agent mini cards now escape user data and sanitize media URLs.
- ⏳ Browser-level accessibility, keyboard, mobile/desktop and full ES/EN review still require deployed staging.
- ⏳ XSS attack-string testing with real persisted records remains a staging QA requirement.

- ✅ Mobile drawer focus management: dialog semantics, focus trap, Escape close and opener-focus restoration.

- ✅ Claim/report database integrity hardening: claims cannot self-declare approved, reports cannot self-declare resolved, anonymous inserts are denied, and least-privilege table grants are applied.
- ✅ Negative RLS verification executed against Production without persisting test rows.
- ✅ Supabase Security Advisor remains at 0 active security lints after the hardening migration.

- ✅ Social database hardening: profile role self-escalation blocked, post counters/editorial fields protected, comment identity protected and interactions limited to published content.
- ✅ Social table grants reduced to least privilege required by the current Beta client.
- ✅ Supabase Security Advisor remains at 0 active security lints after migrations `20261007140601` and `20261007140657`.

- ✅ Storage/privacy hardening: avatar/cover replacements use owned UID paths and old managed media is cleaned only after successful profile save.
- ✅ Bucket limits verified in Production: avatar 5 MB, cover 8 MB, post-media 50 MB with explicit MIME allowlists.
- ✅ Public Explorer profile enumeration blocked; only Cultural Agent profiles are public through `profiles`, while users retain access to their own row.
- ✅ Supabase Security Advisor remains at 0 active security lints after privacy migration `20261007141841`.
- ⏳ Two-account browser-level Storage ownership tests remain a staging QA requirement.

- ✅ PWA/cache hardening: service worker caches only same-origin public static assets/navigation, bypasses cross-origin/Auth requests and respects private/no-store/error responses.
- ✅ Smoke tests now fail if future commits reintroduce broad service-worker caching.
- ⏳ Installed-PWA/offline behaviour still requires staging/browser verification.

- ✅ Globe supply-chain hardening: `globe.gl@2.30.0`, `world-atlas@2.0.2` and `three-globe@2.45.3` resources are pinned; mutable `@master` fallback removed.
- ✅ CSP no longer allows the unused `raw.githubusercontent.com` origin.
- ⏳ Globe rendering/fallback still requires staging/browser verification across devices.

- ✅ Globe XSS hardening: country labels, cultural point labels, micro-story copy and cultural-card fields are escaped before HTML rendering; micro-story hrefs use a safe-scheme allow-list.
- ⏳ Visual globe behaviour remains part of browser/staging QA.


### Automated browser QA — 7 Oct 2026
- ✅ Separate GitHub workflow `ORIGEN Browser QA` added with pinned Playwright/Chromium.
- ✅ Browser QA #19 passed on the release candidate in real headless Chromium.
- ✅ Desktop anonymous checks cover home render, search dialog, Trust Center, ES/EN switching, persistent language preference, login labels and absence of uncaught JavaScript errors.
- ✅ Mobile checks cover drawer semantics, focus transfer, Escape close, focus restoration and registration rendering.
- ✅ PWA/cache browser checks verify service-worker activation, expected cache creation, same-origin-only cache entries and no Supabase/CDN/Auth responses in Cache Storage.
- ✅ A real mobile drawer Escape/focus race discovered by Chromium was fixed at source level.
- ✅ Browser QA workflow now uses concurrency cancellation and a Playwright browser cache to reduce redundant CI work.
- ⏳ This browser QA is anonymous/local-bundle QA; authenticated two-account E2E still requires deployed staging.

### Supabase browser-key review — 7 Oct 2026
- ✅ Release candidate, beta branch and current `main` use the modern Supabase `sb_publishable_...` browser key.
- ✅ The legacy `anon` JWT key is not referenced in the repository code search.
- ⏳ The legacy key remains enabled in Supabase for compatibility; disable/rotate only after deployed staging confirms no remaining external client depends on it.

- ✅ Automated Chromium Browser QA now covers desktop/mobile anonymous rendering, Trust Center, ES/EN login, programmatic labels, mobile-drawer focus management and service-worker cache privacy.
- ✅ Browser QA #17 and #18 passed after the initial workflow issues were corrected; the workflow is now part of release validation.
- ✅ Trigger-only `touch_updated_at()` direct RPC execution removed from browser roles; triggers remain active.
- ✅ Supabase Security Advisor remains at 0 active security lints after migration `20261007143630`.

- ✅ `touch_updated_at` direct execution restricted: `anon` and `authenticated` cannot invoke the trigger helper directly.
- ✅ Current release evidence: Quality Gate #154 + Browser QA #19 both SUCCESS; runtime content fingerprint remains `sha256:07c669ffa2f24065d718ca6926c238ad096787ab8033297381a1efa1a681bdcc`.

- ✅ Beta publishing roles aligned: Cultural Agents publish cultural/educational feed content; Explorers discover, follow, save, learn, comment and connect without a publicly enumerable profile or feed-post capability.
- ✅ Explorer post creation is blocked in UI, client API and Production RLS; future Explorer publishing requires a deliberate public-identity/privacy model.
- ✅ Supabase Security Advisor remains at 0 active security lints after migration `20261007144230`.


### CAPTCHA decision — 8 Oct 2026
- ✅ Preferred CAPTCHA provider selected for controlled beta: **Cloudflare Turnstile Free**.
- ✅ Supabase Auth supports Turnstile for sign-up, sign-in and password recovery.
- ✅ ORIGEN Auth client already accepts optional `captchaToken` values for those three flows.
- ✅ `CAPTCHA_INTEGRATION_PLAN.md` defines the safe activation order and $0 cost guard.
- ✅ `AUTH_PRODUCTION_CHECKLIST.md` and `RELEASE_QA_RUNBOOK.md` now reflect the Turnstile decision and required tests.
- ⏳ Turnstile widget/Site Key/Secret Key remain pending the exact Cloudflare Pages staging hostname.
- ⛔ Do not enable Supabase CAPTCHA enforcement or loosen CSP until the staging widget is producing valid tokens.


### Incident response & recovery — 8 Oct 2026
- ✅ `INCIDENT_RECOVERY_RUNBOOK.md` defines severity, containment, evidence preservation, credential response, code rollback, database recovery and post-incident review.
- ✅ Release Gate now requires recovery evidence before Public Beta.
- ✅ Code rollback uses a last-known-good GitHub commit/build; database schema history remains append-only with reviewed forward-fix migrations preferred.
- ⚠️ Supabase Free should not be treated as guaranteed PITR/dashboard recovery. A logical database backup must be created and verified outside the public repository before Public Beta.
- ⚠️ Database backups do not restore deleted physical Storage objects; media recovery/retention expectations remain a separate pilot requirement.
- ⏳ Actual pre-beta logical backup export and validation are still pending.

- ✅ Privacy-request/account-deletion baseline: Trust Center + own-profile contact route + `PRIVACY_REQUEST_RUNBOOK.md` are in place.
- ✅ Account deletion process accounts for Storage-owner cleanup first, Auth JWT/session caveat, database cascades and separate Cultural Agent profile review.
- ⏳ One full staging test-account deletion lifecycle remains required before Public Beta.

- ✅ Browser QA #54 passed on runtime head `19fd47a0712f4450602bc40f1e46b87688a210cb`, matching Quality Gate #189.
- ✅ Current release runtime includes Turnstile-ready public config, privacy/account-deletion request pathway and all prior accessibility/PWA/XSS hardening.
- ⚠️ GitHub branch-protection details and Security/Dependabot alert endpoints are not readable through the current integration; verify them manually before GO. Repository code search found no obvious service-role/secret/JWT/database-URL patterns on `main`.
