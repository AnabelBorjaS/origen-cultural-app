# Estado del proyecto — ORIGEN Cultural

Última actualización: 6 de octubre de 2026

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
- ✅ GitHub Quality Gate #116 passed with the current deployable runtime + deterministic release evidence artifacts.
- ✅ Artifacts `origen-static-116` and `origen-release-evidence-116` generated: 25 public runtime files, 6.64 MB.
- ✅ Deterministic runtime content digest: `sha256:8b9b6ba4eb256f8f5e9d31ea2fdce3501a15428549eac1d5dfd4a09a8e7ca3e6`.
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
