# ORIGEN Cultural — Release Gate

## Estrategia de lanzamiento
1. Internal Alpha
2. Private Pilot Ecuador
3. Closed Beta
4. Public Beta
5. Growth Release

## Go / No-Go
No abrir registro público hasta que:
- las cuentas persistan entre dispositivos;
- la verificación de email funcione;
- password reset funcione;
- un usuario no pueda editar datos de otro;
- los claims no otorguen propiedad automáticamente;
- los perfiles de referencia estén claramente identificados;
- Trust Center coincida con la tecnología realmente usada;
- no existan bugs Critical/High abiertos;
- se haya probado al menos un claim de principio a fin;
- contenido editorial/seed no simule actividad auténtica de entidades reales.

## Alcance beta
Incluye:
- perfiles culturales públicos;
- exploración;
- cuentas;
- publicaciones;
- follows;
- favoritos;
- Pasaporte Cultural;
- reclamación de perfiles;
- reportes;
- ES/EN.

No incluye:
- pagos, suscripciones o cuotas de acceso (registrarse y mantener perfil es gratuito);
- promociones pagadas de perfiles/publicaciones o anuncios comercializados;
- seguimiento de afiliación, comisiones de ventas o enlaces remunerados con medición;
- reservas;
- mensajería privada;
- payouts;
- marketplace o checkout interno;
- verificación automática.

**Modelo aprobado para planificar, no habilitado:** primero promoción opcional pagada de contenido claramente identificado como patrocinado; después, posibles comisiones contractuales por ventas reales atribuidas en las webs oficiales de los Agentes Culturales. Ver `BUSINESS_MODEL.md`. El reparto 80/20 anterior ya no es la política comercial vigente.


## P0 — Aislamiento del backend de staging

- El artefacto generado por `npm run build:static` **no puede incluir URL ni clave del Supabase de Production**.
- Una preview sin backend de staging debe mostrarse claramente como **solo visual** y no permite pruebas de registro real. Ningún resultado de QA de esa preview sirve para afirmar consentimiento, seguridad RLS o Auth validado.
- Para las pruebas de usuarios A/B se exige proyecto Supabase **separado**, build con variables `ORIGEN_STAGING_SUPABASE_URL` y `ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY` compatibles con clave `sb_publishable_...`, además de Cloudflare Access verificado en la URL principal y previews.
- El auditor de staging debe demostrar que el `supabase-client.js` **desplegado** no usa Production y que la conexión separada es válida; el control automatizado **no reemplaza** la prueba de cuentas y políticas RLS reales.
- La autorización de creación de nuevos proyectos o costes es independiente de la autorización para desarrollar código en GitHub.

## Security & abuse
Public beta remains NO-GO until:
- Supabase Security Advisor has no unresolved security lints.
- CAPTCHA/bot protection is enabled for sign-up, sign-in and password recovery.
- Email confirmation is enabled and redirect URLs are limited to approved ORIGEN domains.
- Auth rate limits are reviewed for the beta.
- RLS is tested with two separate accounts to confirm cross-user isolation.
- Spam limits for posts, comments, reports and profile claims are tested.
- Upload type/size restrictions and ownership policies are tested.
- External URLs reject unsafe schemes such as javascript:.
- Content Security Policy is validated in the deployed environment.
- GitHub and Supabase administrator accounts use MFA/2FA.
- No service-role key, database password or private secret exists in frontend code or repository history.
- A basic incident-response and recovery procedure exists before public launch. **Documented in `INCIDENT_RECOVERY_RUNBOOK.md`; pre-beta backup evidence still required.**

## Cookies, storage & privacy
- The beta must not load optional analytics, advertising or cross-site tracking before consent where consent is required.
- Maintain a real technical inventory of cookies, browser storage, SDKs and external providers from the deployed product.
- Current app preference storage and Supabase authentication storage must be documented accurately.
- When optional cookies/analytics are enabled, provide equivalent Accept, Reject and Configure choices before those technologies run.
- Re-run the cookie/storage inventory after every material analytics, authentication or advertising change.


## Publishing scope — Public Beta
- Cultural Agents can prepare cultural/educational posts in the composer, but actual publication remains paused while protected intake and rights handling are unavailable.
- Cultural Explorers can prepare photo, carousel and short-video discovery/experience previews in the composer. Real Explorer publication remains disabled until the trusted private-intake flow, role-specific authorization, media-duration inspection, moderation and two-account Staging QA pass.
- Publishing remains paused for every account while protected intake and rights handling are unavailable. The composer is not evidence that a post was submitted or saved.
- Explorer post purposes are limited to `agent_discovery` and `explorer_experience`; this vocabulary change does not change table grants or RLS.
- Actual Explorer publishing requires an explicit privacy/identity design and separate QA before activation.


## Recovery evidence before Public Beta
- [x] Incident-response and code/database rollback procedure documented.
- [ ] Independent logical database backup created outside the public repository.
- [ ] Backup date/time and migration version recorded.
- [ ] Backup file validity checked without restoring over Production.
- [ ] Storage/media recovery expectations documented for pilot participants.


## Privacy requests & account deletion
- [x] Public beta contact route for access/correction/deletion requests is documented.
- [x] Controlled deletion process is documented in `PRIVACY_REQUEST_RUNBOOK.md`.
- [ ] Complete one end-to-end test-account deletion lifecycle in staging, including Storage cleanup and Cultural Agent profile handling.
- [ ] Confirm no deleted test-user personal data remains publicly visible after the lifecycle test.
- [ ] Confirm final retention/deletion wording with proportional legal/privacy review before public launch.


## GitHub release controls
- [ ] Confirm `main` rejects accidental direct/force pushes or has an equivalent protected release rule. **Current repository rulesets endpoint returns no rulesets; manual GitHub admin action still required.**
- [ ] Confirm GitHub administrator account has 2FA enabled.
- [ ] Review GitHub Secret Scanning / security alerts before GO.
- [ ] Review Dependabot/code-scanning alerts where available. **Dependabot GitHub-Actions monitoring and ORIGEN CodeQL workflow are now configured; first clean review must be confirmed before GO.**
- [x] Current default-branch code search shows no obvious `service_role`, `sb_secret_`, Turnstile Secret, legacy JWT or Postgres connection-string patterns.


## Automated repository security controls
- [x] Weekly Dependabot version monitoring configured for GitHub Actions.
- [x] CodeQL JavaScript/TypeScript `security-extended` workflow configured for PRs to `main`, pushes to `main` and weekly schedule.
- [x] Existing Quality Gate and Browser QA remain separate required evidence during release review.
- [ ] Repository admin must add/confirm a `main` branch ruleset or equivalent protection before Public Beta.
- [ ] Repository owner/admin 2FA must be confirmed manually; this connector cannot inspect account-level 2FA state.


## Consentimiento obligatorio en servidor — implementación activa, E2E pendiente (18 Oct 2026)

- [x] La lógica de consentimiento está instalada en Staging: `private.handle_new_user()` rechaza datos ausentes o inválidos y registra versiones legales fijadas por servidor.
- [x] La UI acepta únicamente `acceptedLegal === true`, con pruebas automáticas de valores no booleanos.
- [x] Hook Auth **Before User Created** habilitado en Staging el 18 Oct 2026, conectado a `public.origen_before_user_created`; EXECUTE para `supabase_auth_admin` verificado en consulta read-only.
- [ ] Probar por Auth API solicitudes sin consentimiento y con valores false, null, string o número, y confirmar que no se crean cuentas/perfiles/aceptaciones.
- [ ] Confirmar mediante alta real que las versiones legales aceptadas las fija el servidor, no los metadatos enviados por usuarios.
- [ ] Revisar contenido legal y registro probatorio con asesoría jurídica antes del público.

**Importante:** la instalación y activación del hook no equivalen a una prueba E2E. No abrir registro público hasta completar las pruebas negativas y la revisión legal.

## Data API grants + RLS regression baseline

- [x] 2026-10-09: consulta **solo lectura** en Production confirmó **11/11 PASS** para RLS habilitado y los GRANT de tabla esperados de `anon` y `authenticated`.
- [x] Auditoría SQL reusable en `supabase/proposals/ORIGEN_DATA_API_GRANTS_RLS_AUDIT_READ_ONLY.sql`.
- [ ] Repetir la auditoría tras cada migración/permisos nuevos; documentar revisión explícita de `GRANT/REVOKE` y RLS para tablas y funciones nuevas.
- [ ] Completar pruebas reales con dos cuentas en Supabase staging **separado**. La consulta de permisos no sustituye pruebas adversariales ni cierra los bloqueos P0 de consentimiento/medios/moderación.

## P0 — Derechos culturales: contrato SQL en propuesta (9 Oct 2026)

- [x] Auditoría solo lectura confirmó: INSERT directo de `cultural_posts` no verifica ni registra declaraciones de derechos culturales en Production.
- [x] Existe **propuesta review-only no aplicada** `supabase/proposals/ORIGEN_CULTURAL_POST_RIGHTS_STAGING_REVIEW_ONLY.sql`: dos booleanos obligatorios para publicaciones no editoriales, evento privado atómico al INSERT, versiones asignadas por servidor y bloqueo temporal de ediciones materiales sin nueva declaración.
- [x] `supabase-client.js` en rama beta envía ambos booleanos explícitos después de validarlos; los mocks prueban que valores faltantes, falsos y falsos positivos como `"true"`/1 no llegan al INSERT.
- [ ] **Bloqueo funcional deliberado:** Supabase Production NO tiene las nuevas columnas. No fusionar ni desplegar este cliente beta sobre Production sin el esquema autorizado y probado. La propuesta no constituye ejecución del backend ni evidencia de protección real.
- [ ] Crear Supabase staging independiente; revisar con especialista legal/versiones/retención; aprobar migración versionada; probar rechazos a Data API, atomicidad, cambios de contenido, cuentas A/B, RLS, privacidad y rol admin; ejecutar Security Advisor.
- [ ] Validar específicamente el borrado/retención del evento privado ante la retirada de un post o una solicitud de privacidad antes del lanzamiento.


## Staging QA de declaraciones culturales — 9 Oct 2026

- [x] En Staging, las 14 migraciones de base quedaron instaladas y la propuesta adicional de derechos culturales quedó aplicada solo al entorno aislado.
- [x] Auditoría read-only reutilizable `supabase/proposals/ORIGEN_RIGHTS_STAGING_CONFIGURATION_AUDIT_READ_ONLY.sql` **10/10 PASS** sobre catálogo y restricciones de acceso a la tabla privada de eventos.
- [ ] **NO-GO P0 #7**: probar con dos cuentas reales ficticias las solicitudes REST directas, rechazo de declaraciones ausentes/falsas, creación simultánea del evento, cambios de contenido, retirada de medios, moderación y retención legal. Los 10 checks no prueban estos comportamientos.
- [x] **NO-GO P0 #6 — configuración:** el hook Before User Created está instalado y ENABLED en Staging desde el 18 Oct 2026; función y EXECUTE revisados. **E2E sigue pendiente**: probar consentimientos inválidos y versions del servidor con cuentas sintéticas tras publicar staging protegido.
- [ ] **NO-GO P0 #5**: desplegar frontend Staging aislado detrás de Access y confirmar HTTPS/redirecciones sin conectar a Production.

## P0 — Verificador A/B seguro preparado, no ejecutado

- [x] Verificador `scripts/staging-auth-qa-readonly.mjs` y documentación `STAGING_AB_RLS_READONLY_QA.md` en beta: acceso solo a Supabase Staging concreto, solo login de dos usuarios ficticios **ya existentes**, y lecturas REST de perfil/aceptación privada, guardados privados, post no publicado y bitácora cultural. No crea/modifica datos.
- [x] Tests offline de aislamiento de URL de producción, clave y fixtures en Quality Gate.
- [x] Lógica de consentimiento probada en SQL en Staging **8/8 PASS**; el hook se activó después, el 18 Oct 2026. Todavía no hay cuentas reales de prueba ni flujo Auth E2E.
- [ ] Antes de ejecutar la QA real: desplegar Staging con Access, configurar Turnstile y URLs Auth, preparar dos cuentas y fixtures sintéticos únicamente en Staging, luego ejecutar `npm run qa:staging:auth:readonly` con secretos efímeros fuera del repo.
- [ ] El script de solo lectura **NO sustituye** pruebas adversariales con INSERT/UPDATE, atomicidad de eventos culturales, recuperación de cuentas, retirada Storage, moderación y revisión legal.

## P0 — Editorial/privilegios y Auth Staging — 10 Oct 2026

- [x] Auditoría SELECT-only `ORIGEN_STAGING_EDITORIAL_BYPASS_AUDIT_READ_ONLY.sql`: **13/13 PASS** de políticas y triggers (configuración, no adversarial).
- [ ] Probar con dos JWT de cuentas sintéticas la falsificación de `is_editorial=true`, origen y contadores, mutación de publicaciones ajenas y derechos incompletos.
- [ ] Evaluar menor privilegio mediante GRANT por columna; el permiso de tabla actual es amplio pero RLS/trigger controlan su uso. Evitar cambios sin pruebas de compatibilidad del cliente.
- [x] `Before User Created` se habilitó en Supabase Auth exclusivamente en Staging el 18 Oct 2026, conforme a `STAGING_AUTH_HOOK_ACTIVATION.md`. [ ] E2E del hook sigue pendiente.

## P0 — Approved Staging identity check — 10 Oct 2026

- [x] Staging builder is restricted to the **exact founder-approved** Supabase project URL `https://egujmptgnrpajgfpjjxu.supabase.co`, rather than any unrelated Supabase host; offline visual preview continues to use a disabled endpoint.
- [x] Deployed Staging audit requires the same exact identity; a different but valid Supabase project must cause failure.
- [x] Regression tests cover Production, unrelated Supabase projects, invalid host, insecure HTTP, reusable Production key and secret misuse.
- [ ] Live protected deployment and Auth hook E2E with two synthetic users remain pending. The hook was enabled in Staging on 18 Oct 2026. No production release.

## Source-level Production disconnection — 10 Oct 2026

- [x] La rama beta guarda `supabase-client.js` con una URL `.invalid` y una clave ficticia. Ninguna copia directa del código beta debe contactar Production.
- [x] El builder comprueba las sentinelas, conecta únicamente el Staging autorizado y rechaza la clave pública histórica de Production por digest, sin copiar la clave al repositorio.
- [ ] Confirmar las tres CI para el commit, además de la auditoría del **artefacto desplegado** en Pages (aún no existente).
- [ ] Diseñar un release build de Production por separado, revisado y aprobado al cerrar P0; no fusionar una beta con backend deshabilitado esperando un release automático.

## PWA / Auth runtime fail-closed (10 Oct 2026)

- [x] Versionar el SW v8 y eliminar `supabase-client.js` del pre-cache; excluir tanto el cliente como `runtime-config.js` de cualquier cache y fallback offline.
- [x] Mantener los demás recursos de presentación estáticos cacheables, y limitar limpieza de caché obsoleta al prefijo de ORIGEN.
- [x] CI del cambio de caché (commit `2573611802f0b193b2d7bfa009a377a4a6c693a9`): Quality Gate, CodeQL y Browser QA **3/3 success**.
- [ ] En un despliegue aprobado, probar actualización v7→v8 de dispositivos que regresan online, junto a borrado de cache histórico y la imposibilidad de recuperar configuración antigua.
- [ ] Auth real con consentimiento/Cloudflare Access, A/B JWT y revisión de permisos siguen P0.

## Offline UX ES/EN — 10 Oct 2026

- [x] Aviso de conexión del navegador accesible (`role=status`) en interfaz desktop/móvil, sin almacenar datos de navegación ni sugerir que se conoce el estado del backend.
- [x] QA de navegador offline/online y traducciones: **3/3 CI success** para `4d0904ce28aa9cd30e09cd35641dde528c4c64b3` (Quality Gate, CodeQL, Browser QA).
- [ ] Validar el mismo comportamiento al desplegar Staging protegido, y verificar los errores de Auth/API por separado. La conectividad detectada por el navegador no prueba estado del servidor.

## P1 — Descubrimiento después de compartir historia (10 Oct 2026)

- [x] Invitación opcional a autenticarse dentro de una historia pública, sin bloquear lectura anónima, con regreso seguro a la historia exacta y sin interacciones automáticas.
- [x] QA de navegador con login simulado y comprobación de botón de seguimiento/guardado tras retornar; no implica una petición real a Supabase.
- [ ] Validar login y persistencia con usuarios A/B sintéticos de Staging, compartir desde teléfonos reales, metadatos de previsualización aprobados y derechos de imágenes.

## Resultado de regresión de historia compartida — 10 octubre 2026

- [x] Commits `9133cb3` + `d163d3b`: **Quality Gate, CodeQL, Browser QA = 3/3 success**. La prueba de navegador recorre invitación anónima de una historia, login simulado y retorno a la publicación exacta, con guardado/seguimiento opcionales.
- [ ] Repetir con dos cuentas Staging reales y datos estrictamente sintéticos después de habilitar consentimiento Auth y hosting protegido; validar sus políticas RLS. No abrir el piloto público aún.

## UX de permalink y controles independientes — 10 Oct 2026

- [x] Carruseles de publicaciones en enlaces individuales no requieren que el post aparezca en el feed.
- [x] Rebinding limitado a la tarjeta que cambió, evitando duplicar listeners sobre otras publicaciones.
- [x] 3/3 CI para `c9ba9b127a7c4fbc9dd890fdebf470f07d8ace05` PASS: Quality Gate, CodeQL y Browser QA.
- [ ] Pruebas de interacción con Auth/RLS real siguen pendientes.

## Vista previa visual sin riesgo de datos — 11 Oct 2026

- [x] Script Chromium de captura de portada / globo y cuatro rutas adicionales, solo servidor localhost con backend desconectado.
- [x] Integración con Browser QA para artefacto `origen-vista-visual-beta-...` de 14 días, sin desplegar Pages ni Production.
- [x] CI del commit `3779634fcb91fec9e4cb4822078ff85e1bab85b1` 3/3 PASS; siete capturas subidas al artefacto [origen-vista-visual-beta-276](https://github.com/AnabelBorjaS/origen-cultural-app/actions/runs/38124735997/artifacts/11696064798). Logs indican 3D canvas en ambas portadas y ambas pantallas Mundo Cultural. Expira el 25/10/2026; no es una URL publicada.
- [ ] Obtener visto bueno de la fundadora sobre identidad visual antes de avanzar en staging privado e interactivo. P0 de Auth, Storage, moderación y protección de acceso sin cambios.

## Cloudflare visual-only web preview — 11 Oct 2026

- [x] Comando de build desconectado, con fail-close si existen claves de Supabase/Turnstile y con CSP del bundle de preview que bloquea Supabase.
- [x] Suite de pruebas para el build visual: casos mal configurados y modo seguro sin base de datos.
- [x] GitHub CI del commit `bfa1e75af9d5ad3b4f2578e7b44f3af2f0801a04`: Quality Gate, CodeQL y Browser QA **3/3 success**.
- [x] Cloudflare Pages visual-only preview deployed; founder completed Cloudflare Access email login and reached the preview. The page clearly states there is no test database and that registration, real posts and uploads are disabled.
- [x] Revisión visual desde tablet: globo y datos culturales de país visibles en la preview.
- [ ] Configurar Turnstile y URLs exactas de callback en el Supabase Staging separado antes de cualquier prueba Auth real.
- [ ] Completar la prueba Auth del hook y las pruebas A/B con dos cuentas ficticias desechables y datos sintéticos. La visual-only preview no valida Auth, consentimiento, RLS ni Storage.

**Estado verificado al 21 Oct 2026:** Cloudflare Access protege la vista visual. No se conectó Supabase, no se crearon cuentas de prueba, no se cargó contenido real y Production no se modificó.

## Replit no-Agent visual review — 12 Oct 2026

- [x] `.replit` workflow `Run` builds fail-closed visual preview only and serves `dist` with no live Supabase backend.
- [x] `tests/visual-preview-isolation.mjs` fixed to accept JSON-quoted config output; CI confirmation still required after commit.
- [ ] Verify exact Replit account credit/spend limit before importing/Agent updates; never promise $0 unless confirmed.
- [ ] Confirm private development URL access before sharing any live preview; default `.replit.dev` addresses are public. Do not overwrite old Replit App without a backup.
