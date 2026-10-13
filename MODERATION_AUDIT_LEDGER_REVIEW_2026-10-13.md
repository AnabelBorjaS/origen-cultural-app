# ORIGEN — Propuesta de historial de moderación y seguridad (13 octubre 2026)

**Estado real:** solo propuesta de código para PR #3. No desplegada. El proyecto de Staging tiene **0 usuarios Auth y 0 reportes** en la verificación realizada hoy. **No se debe invitar a comunidades todavía.**

## Qué se ha realizado

1. Se añadió `supabase/proposals/ORIGEN_MODERATION_CASE_EVENTS_LEDGER_REVIEW_ONLY.sql`, una propuesta de tabla en esquema `private` para dejar registro de las **recomendaciones de revisión humana**. Cada entrada identifica un reporte, un revisor, un tipo de evento, una explicación y una clave única que permite prevenir repeticiones.
2. Se incluyó RLS obligatorio y forzado, sin políticas de acceso, revocación expresa de permisos a `PUBLIC`, `anon`, `authenticated` y `service_role`, y un disparador que prohíbe UPDATE y DELETE ordinarios. Un superusuario puede cambiar la estructura; por ello «append-only» no es inmutabilidad absoluta.
3. Se ejecutó el **contenido exacto de la propuesta** en una transacción de Supabase Staging, sustituyendo el `COMMIT` por una verificación SQL, `ROLLBACK` y una consulta de comprobación. Todas las restricciones examinadas pasaron. El resultado final fue `ledger_rolled_back: true` y `function_rolled_back: true`. **No quedó ninguna tabla ni función creada y Production no fue tocada.**
4. Las decisiones de este esquema son **recomendaciones o pasos internos**, no cambian por sí mismas el estado del reporte, la publicación ni los archivos de Storage.

## Bloqueadores antes de aplicar o habilitar acciones

- Diseñar un servicio servidor dedicado con autenticación JWT verificada, control de rol administrativo **contra base de datos**, principio de menor privilegio y ninguna clave privada en el navegador. Un rol admin mostrado en la interfaz no es autorización suficiente.
- Decidir qué personal autorizado puede acceder, cuánto tiempo conservar evidencia y quién puede tramitar apelaciones. Evitar secretos culturales, identidad y pruebas sensibles en campos de texto.
- Especificar los estados y permisos de doble revisión donde proceda, distinguir solicitud de revisión de orden de retirada, y mantener una bitácora verificable de cambios administrativos.
- Revisar la política de tablas/RPC y el Security Advisor antes y después de un despliegue **solo en Staging**; nunca ofrecer un RPC con `SECURITY DEFINER` accesible desde `public` por defecto.
- Probar con al menos dos cuentas **sintéticas** sobre Staging privado que ninguna persona no autorizada lea/escriba reportes, y que retirar contenido revoque acceso a Storage según los límites de CDN.
- Separar y controlar cambios de esquema en un proceso revisado; esta propuesta **no es una migración aprobada** ni una funcionalidad operativa.

## Browser QA corregido

La prueba `tests/browser-smoke.mjs` ya no registra manualmente una PWA en la beta privada. Verifica que el entorno protegido **no** conserve cache offline de ORIGEN y mantiene los tests del Service Worker normal para otras builds. Se agregaron comprobaciones de la ruta real `#moderacion` para usuarios sintéticos admin/explorador, texto de denuncia malicioso y ausencia de acciones de retirada, sin acceder a informes reales. Los estados exactos de Chromium y CodeQL deben consultarse en GitHub Actions, no presumirse.

**Restricciones de proyecto:** Cloudflare/Production no desplegados; `origencultural.com` no modificado; PR #3 DRAFT; no hay cargos ni nuevos contratos. Los problemas P0 #5, #8 y #12 permanecen abiertos.

Referencias: https://supabase.com/docs/guides/database/postgres/row-level-security y https://supabase.com/docs/guides/database/functions
