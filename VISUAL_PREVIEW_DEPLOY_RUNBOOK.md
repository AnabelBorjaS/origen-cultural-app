# ORIGEN Cultural — entrega de vista visual segura (12 oct 2026)

## Objetivo
Dar a la fundadora un enlace HTTPS que pueda abrir desde su teléfono y ver la **interfaz actual de la rama beta**, sin tocar `origencultural.com` ni `main` y sin permitir altas, publicaciones, transferencias ni acceso a datos reales.

## Estado comprobado
- Supabase Staging `egujmptgnrpajgfpjjxu` se encuentra activo y aislado. **La vista visual NO se conecta ni siquiera a Staging.**
- Repo `AnabelBorjaS/origen-cultural-app`; rama **`reconcile-main-beta-2026-10-07`**; PR #3 debe permanecer draft.
- Replit `origen-cultural-app` NO tiene ninguna publicación activa: no presentar la URL de Replit como preview actual.
- La web `origencultural.com` mostró HTTP 503 en el navegador de la fundadora; no diagnosticar DNS/hosting sin logs.
- CI `ORIGEN Quality Gate` ahora prepara adicionalmente un artefacto `origen-visual-only-<numero de ejecución>` construído con `npm run build:visual-preview`.
- Este archivo **es un bundle estático, no una URL ni una web publicada**. No ofrecer `pages.dev` inventados.

## Artefacto listo para hosting
1. En `https://github.com/AnabelBorjaS/origen-cultural-app/actions/workflows/quality.yml`, abrir la última ejecución **exitosa** de la PR #3 o rama beta.
2. Descargar **`origen-visual-only-<numero>`** de `Artifacts` (ZIP). No confundirlo con `origen-static-<numero>`, que tiene políticas de conexión backend diferentes.
3. Comprobar que el ZIP contiene `index.html` en raíz, `_headers`, scripts y assets; que se generó con `ORIGEN_VISUAL_PREVIEW_ONLY=1` y que la prueba `tests/visual-preview-isolation.mjs` aprobó.
4. No extraer ni desplegar la raíz del repositorio; exclusivamente el directorio `dist` del artefacto.

## Publicación propuesta, sin ejecución ni gastos autorizados
Elegir **Cloudflare Pages Free** con nombre reservado si está disponible `origen-cultural-staging`. Dos opciones, **no mezclarlas**:
- **Git integration**, mejor para iteraciones: conectar repo GitHub, seleccionar rama de beta, framework None, build `npm run build:visual-preview`, directorio `dist`. Requiere conectar Cloudflare con GitHub una vez y configurar Access.
- **Direct Upload** para una sola visualización rápida: subir el ZIP `origen-visual-only-<numero>` desde el Dashboard de Cloudflare Pages y conservar el origen del archivo/commit. Cloudflare documenta que un proyecto Direct Upload **no puede pasar después a Git integration** sin crear un proyecto nuevo. Para un proyecto de larga duración, preferir Git integration.

**Protección obligatoria:** un `*.pages.dev` recién publicado es público por defecto. Aplicar Cloudflare Access con acceso solo a la fundadora a dominio raíz y previews; revisar desde una ventana privada que pida autenticación ANTES de compartir un enlace. `X-Robots-Tag: noindex` no equivale a control de acceso.

Confirmar `$0` de plan Free antes de cualquier servicio/upgrade; **nunca aceptar complementos, tarjeta o factura no autorizada**. No configurar `ORIGEN_STAGING_SUPABASE_URL`, `ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY` ni `ORIGEN_TURNSTILE_SITE_KEY` para la vista visual. El navegador debe mostrar banner bilingüe 'Vista previa interna' y deshabilitar registros y publicaciones reales.

Después del despliegue, **no afirmar éxito** hasta verificar HTTPS 200, CSP y que el HTML/supabase-client desplegados siguen apuntando a `unconfigured-staging.invalid`, sin claves reales. Comprobar móvil/desktop, español/inglés, menú, explorar y Pasaporte, sin operar Auth.

## Siguiente decisión explícita
Para publicar realmente necesitamos **una sesión o conexión autorizada a la cuenta Cloudflare de la fundadora**, actualmente no disponible en las herramientas conectadas. No pedir contraseñas ni API tokens en el chat. Si ella quiere la alternativa rápida de Direct Upload, acompañar en pantalla y solicitar solo el enlace publicado que genera Cloudflare; entonces auditarlo. No se ha creado aún ningún sitio Cloudflare.

## Fuentes oficiales
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/configuration/preview-deployments/
- https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain

## Auditoría de la URL protegida — actualización 13 octubre 2026

El auditor `npm run audit:staging` ahora separa explícitamente los dos tipos de revisión:

- **Solo vista visual:** `ORIGEN_STAGING_AUDIT_MODE=visual-only`. Se exige banner visible, cliente desconectado del backend, sin widget de Turnstile, CSP sin orígenes Supabase/Turnstile y `X-Robots-Tag: noindex`. Estas verificaciones **no** sirven como prueba de Auth, RLS o consentimientos reales.
- **Pruebas con cuentas (modo predeterminado):** `ORIGEN_STAGING_AUDIT_MODE=auth-staging`. Se exige el proyecto Supabase Staging autorizado y el sitio público de Turnstile en configuración y CSP. Nunca utilizar este modo en un paquete de solo demostración.

**Para ambos modos:** el auditor requiere un Cloudflare Access Service Token exclusivo de pruebas, suministrado mediante variables/secretos cifrados, y comprueba sin credenciales que la portada, `index.html`, `app.js`, `supabase-client.js` y `runtime-config.js` devuelvan rechazo o redirección legítima a Cloudflare Access. No valida un despliegue público sin restricciones como si fuese una beta privada. Auditar **por separado** dominio base y alias/preview de despliegue, pues un resultado PASS en una URL no certifica las demás.

El workflow `ORIGEN Staging Audit` ahora ofrece una selección `audit_mode`, pero su ejecución manual sigue dependiendo de la disponibilidad de `workflow_dispatch` en la rama por defecto; no fusionar el PR ni desplegar Production solo para activar el botón. Mantener `NO-GO` hasta que exista URL HTTPS protegida y puedan comprobarse los recorridos funcionales.

## Protección contra copias sin conexión en staging — 13 octubre 2026

El bundle privado de ORIGEN incorpora dos defensas adicionales, **sin necesidad de ningún servicio de pago**:

- **PWA desactivada exclusivamente en el artefacto privado:** `npm run build:visual-preview` y `npm run build:static` generan `window.ORIGEN_CONFIG.disableServiceWorker = true`. Al cargar, `app.js` no registra ningún Service Worker nuevo y trata de desregistrar los ya asociados al origen, eliminando únicamente caches con el prefijo `origen-cultural-v`. El código fuente público/local conserva el registro PWA cuando la bandera no está establecida.
- **Sin caché HTTP/navegador:** el artefacto `dist/_headers` añade `Cache-Control: no-store` a rutas `/*`; el auditor HTTPS exige esa política tanto para HTML como para archivos principales. Rechaza también un bundle desplegado cuyo `runtime-config.js` no desactive la PWA.
- **Pruebas automáticas:** `tests/staging-pwa-isolation.mjs`, `tests/staging-build-isolation.mjs`, `tests/visual-preview-isolation.mjs` y `tests/staging-audit-policy.mjs` comprueban la lógica con mocks y builds locales.

**Importante:** esta defensa no garantiza retirar contenidos que una persona haya copiado, capturado, descargado o que ya estén guardados en su dispositivo. Tampoco convierte por sí misma una URL en privada: **Cloudflare Access sigue siendo obligatorio** sobre dominio base y previews; verificar siempre el rechazo desde una sesión anónima nueva. Sin despliegue real, `no-store` y Access en cabeceras siguen sin estar comprobados en HTTP externo.

El alojamiento sigue sin activarse. No cambiar `main`, `origencultural.com`, datos reales o suscripciones; mantener Cloudflare Pages **Free / $0**.
