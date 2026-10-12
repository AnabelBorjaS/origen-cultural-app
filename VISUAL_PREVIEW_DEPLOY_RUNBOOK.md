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
