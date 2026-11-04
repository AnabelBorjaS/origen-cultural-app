# ORIGEN — Hallazgo crítico de Storage en Staging (13 octubre 2026)

## Resultados verificados, consulta SQL de solo lectura

Ejecutada en Supabase Staging **egujmptgnrpajgfpjjxu** mediante el archivo repetible `supabase/proposals/ORIGEN_STAGING_STORAGE_RLS_AUDIT_READ_ONLY.sql`.

**6 CONFIG_PASS, 3 ACTION_REQUIRED.** Las seis protecciones verificadas son: RLS habilitado, bucket de medios existente, ruta de subida limitada a carpeta del usuario, ausencia de política de subida anónima, borrado limitado al propietario, y filtros de tamaño/MIME.

**Tres riesgos pendientes antes de invitar comunidades:**

1. La política SQL `users upload own media` obliga carpeta del propietario, **pero no exige rol `creator`** para el bucket `post-media`. Un usuario autenticado de otra categoría podría invocar Storage directamente sin pasar por el botón de ORIGEN.
2. La política `users update own media` permite **UPDATE también sobre `post-media`**. Por tanto, un propietario podría reemplazar el archivo ya publicado sin la nueva declaración de derechos exigida a las ediciones de `cultural_posts`. `upsert:false` del navegador no es una barrera de autorización.
3. El bucket `post-media` es **público**, de modo que una subida puede ser accesible por URL antes de que exista una publicación con declaraciones culturales verificadas. Se necesita un diseño de cuarentena privada y publicación controlada, o aceptación explícita del riesgo antes de activar la subida. Retirar el permiso de UPDATE por sí solo no soluciona la exposición previa.

La consulta de seguridad Supabase Advisor reportó únicamente el aviso informativo `private.cultural_post_rights_events` con RLS sin políticas, configuración deliberada para una tabla privada sin acceso del navegador; **no es una garantía de que no existan riesgos**.

## Cambio ya implementado solo en código beta

`supabase-client.js upload()` ahora exige perfil `creator` vinculado a la sesión actual para `post-media`, antes de contactar Storage. El resto de imágenes de perfil usan sus reglas previas. `tests/cultural-media-cache.mjs` cubre usuario `explorer`, perfil ajeno y perfil ausente, sin red real.

**Esto es defensa en profundidad, NO autoriza el lanzamiento.** Las reglas de Storage se deben reforzar en el servidor con revisión de esquema/política y dos cuentas ficticias en un sitio Staging con Access.

## Decisión de arquitectura previa a implementación

Recomendación: evaluar una **cuarentena privada de subida** para material cultural sin autorización aún confirmada, y promoción a almacenamiento público **solo tras** validación de publicación y permisos desde un servicio protegido. Deben diseñarse consentimiento, permisos de acceso, referencias, auditoría de movimientos, retirada y compatibilidad de URLs sin suponer que una simple política SQL logra todo.

Hasta contar con aprobación y pruebas, **NO modificar policies o buckets** de Staging/Production de forma apresurada. No divulgar archivos culturales reales en un bucket público de prueba.

Criterios mínimos de aceptación en Staging: (a) la cuenta exploradora no puede subir medios culturales ni por UI ni por API, (b) un agente no puede sobrescribir medios publicados ni por API, (c) contenido prepublicado no se puede recuperar anónimamente, (d) un operador autorizado puede gestionar retirada y evidencias, (e) compatibilidad de avatares y portadas permanece, y (f) informes de calidad y seguridad están aprobados.

**Estado P0 #12: abierto. Progreso del piloto privado: 6/10 hitos, 60%.** `main`, `origencultural.com`, Production y nuevas suscripciones no modificados.

## Actualización 14 octubre 2026 — correcciones aplicadas únicamente en STAGING

- Se comprobó antes de actuar que el entorno `egujmptgnrpajgfpjjxu` tenía **0 usuarios Auth, 0 perfiles, 0 publicaciones y 0 archivos** en los buckets culturales, avatares y portadas.
- Se preparó `supabase/proposals/ORIGEN_STAGING_STORAGE_HARDENING_REVIEWED.sql` y se ensayó con `BEGIN/ROLLBACK`. El primer intento de ensayo reveló que PostgreSQL muestra `FROM profiles pr` en `pg_policies` (no `FROM public.profiles pr`); se corrigió exclusivamente el chequeo postflight y el ensayo posterior pasó.
- Se ejecutó el SQL con `COMMIT` **solo en Supabase Staging**, manteniendo las cuatro políticas existentes de Storage.
- La política `users upload own media` ahora exige la carpeta del propietario para todos los buckets y **perfil actual `creator` en `public.profiles`** cuando el bucket es `post-media`. Avatares y portadas conservan su ruta habitual con Auth.
- La política `users update own media` ahora restringe `USING` y `WITH CHECK` a `avatars` y `covers`, conservando propiedad y carpeta. Ningún cliente `authenticated` puede actualizar objetos de `post-media` bajo esta política. `SELECT` público y `DELETE` del propietario permanecen sin cambios.
- **Auditoría posterior:** `ORIGEN_STAGING_STORAGE_RLS_AUDIT_READ_ONLY.sql` devuelve **8 CONFIG_PASS, 1 ACTION_REQUIRED**. Supabase Security Advisor mantiene solo el aviso informativo de tabla privada de derechos culturales sin políticas; no reportó hallazgos nuevos.
- **No se ha comprobado aún con JWT de dos usuarios reales/sintéticos en el proyecto:** los checks son sobre la definición SQL y deben contrastarse con intentos efectivos de subida y sustitución antes de invitar comunidades.

**Riesgo abierto P0 #12:** `post-media` continúa como bucket público. El archivo puede ser descargable desde su URL antes de que la publicación con las declaraciones de derechos esté confirmada. Sin cuarentena privada / promoción auditada no se debe aceptar un piloto cultural con archivos sensibles. Ningún cambio en Production, `main`, Cloudflare o el dominio público. Barra del piloto: **60% = 6/10 hitos**.
