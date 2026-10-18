# ORIGEN — Activación controlada de Before User Created (Staging solamente)

**Fecha de actualización:** 18 octubre 2026 (original: 10 octubre 2026)  
**Entorno:** Supabase `ORIGEN Cultural Staging` `egujmptgnrpajgfpjjxu` (Sídney, Free).  
**Estado al 18 octubre 2026:** hook Before User Created **activo y visible como ENABLED** en Authentication → Hooks de Staging, conectado a `public.origen_before_user_created`. **No ejecutar en Production** (`xwkjvoyicrrwjybjolld`). Aún no hay una prueba de signup end-to-end: falta desplegar la web de Staging con HTTPS protegido y configurar Turnstile.

## Qué ya está verificado

- `public.origen_before_user_created(jsonb)` existe en Staging como `SECURITY INVOKER`; `supabase_auth_admin` puede ejecutarla, `anon` y `authenticated` no.
- `private.handle_new_user()` es el trigger de `auth.users`, exige `accepted_legal=true` booleano, sólo email y no anónimo, crea `profiles` y `legal_acceptances` con versiones `v1.2` del servidor.
- 8/8 casos de la función SQL Before User Created aprobaron `supabase/proposals/ORIGEN_CONSENT_STAGING_QA_READ_ONLY.sql`.
- 11/11 verificaciones de estructura Auth en `ORIGEN_STAGING_AUTH_CONFIGURATION_AUDIT_READ_ONLY.sql` aprobaron; la activación de Auth quedó confirmada después en el Dashboard de Staging.
- El 18 de octubre, una consulta SQL de solo lectura confirmó que `supabase_auth_admin` puede ejecutar la función. `auth.users` y `public.profiles` siguen con 0 filas tras activar el hook.
- **Ninguna cuenta ficticia** estaba creada en la última auditoría. No se implementó flujo real de correo de prueba.

## Configuración completada en el Dashboard de Staging

1. Se confirmó el proyecto `ORIGEN Cultural Staging`, referencia `egujmptgnrpajgfpjjxu`; Production no se modificó.
2. El hook **Before User Created** quedó habilitado como **Postgres function**, esquema `public`, función `origen_before_user_created`.
3. La captura del Dashboard confirmó estado **ENABLED**. La consulta SQL de solo lectura confirmó la firma `event jsonb`, retorno `jsonb` y permiso `EXECUTE` para `supabase_auth_admin`.
4. La evidencia visual se conserva en la conversación privada; no se copiaron secretos, emails ni datos personales a GitHub.

El hook está configurado, pero la activación no sustituye las pruebas reales. No se han creado cuentas y el flujo Auth aún debe verificarse desde la web desplegada. Ningún secreto debe escribirse en el repositorio.

Documentación: https://supabase.com/docs/guides/auth/auth-hooks y https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook

## QA obligatorio pendiente — entorno de pruebas privado

- Hacer un alta con **correo de prueba controlado** + `user_metadata.accepted_legal=true` (booleano). Confirmar `auth.users` (1), `public.profiles` (1), `legal_acceptances` (1), versiones del servidor `v1.2`; confirmar correo y login.
- Probar por Auth API directa las variantes consentimiento **ausente, false, null, string 'true', número 1**: todas rechazadas y sin filas huérfanas.
- Intentar cambiar `terms_version` en metadatos a una versión falsa; comprobar que en servidor se guarda `v1.2`.
- Probar invocación de proveedor/OAuth no autorizado y alta anónima; verificar rechazo sin error inesperado de la plataforma.
- Verificar recuperación de contraseña, sesión en segundo dispositivo, enlace caducado y email de confirmación.
- Preparar cuentas A/B y fixtures sintéticos para `npm run qa:staging:auth:readonly` únicamente tras validar consentimiento y protección del entorno.
- Registrar número de usuarios/perfiles/aceptaciones antes y después de los ensayos y eliminar los datos de prueba con procedimiento revisado, sin revelar credenciales.

## Reversión y seguridad de cambios

- Si un alta falla inesperadamente tras activar el hook, **deshabilitar únicamente el Before User Created de Staging** en Dashboard y revisar logs de Auth. **El trigger privado seguirá exigiendo consentimiento:** desactivar el hook NO revierte ese control de seguridad, deliberadamente.
- No sustituir `private.handle_new_user()` por una variante permisiva para obtener altas de prueba; conservar fail-closed. Cualquier rollback de función requiere revisión previa y una nueva migración versionada.
- No usar ni modificar Production, ni fusionar PR #3, ni invitar participantes hasta completar los P0 de consentimiento, derechos culturales, privacidad, moderación/retirada y permisos de acceso.
