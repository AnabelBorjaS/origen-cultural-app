# ORIGEN — Activación controlada de Before User Created (Staging solamente)

**Fecha:** 10 octubre 2026  
**Entorno:** Supabase `ORIGEN Cultural Staging` `egujmptgnrpajgfpjjxu` (Sídney, Free).  
**Estado:** funciones instaladas y auditadas; **activación del hook en Supabase Auth NO verificada**. **No ejecutar en Production** (`xwkjvoyicrrwjybjolld`).

## Qué ya está verificado

- `public.origen_before_user_created(jsonb)` existe en Staging como `SECURITY INVOKER`; `supabase_auth_admin` puede ejecutarla, `anon` y `authenticated` no.
- `private.handle_new_user()` es el trigger de `auth.users`, exige `accepted_legal=true` booleano, sólo email y no anónimo, crea `profiles` y `legal_acceptances` con versiones `v1.2` del servidor.
- 8/8 casos de la función SQL Before User Created aprobaron `supabase/proposals/ORIGEN_CONSENT_STAGING_QA_READ_ONLY.sql`.
- 11/11 verificaciones de estructura Auth en `ORIGEN_STAGING_AUTH_CONFIGURATION_AUDIT_READ_ONLY.sql` aprobaron. No equivalen a activación Auth real.
- **Ninguna cuenta ficticia** estaba creada en la última auditoría. No se implementó flujo real de correo de prueba.

## Paso único de configuración que requiere acceso autorizado al Dashboard

1. Entrar **sólo** en el proyecto de Staging, confirmar en encabezado `ORIGEN Cultural Staging` y referencia `egujmptgnrpajgfpjjxu`; **nunca** `ORIGEN Cultural Production`.
2. Ir a **Authentication → Hooks**. Elegir **Before User Created**, implementación **Postgres Function**.
3. Seleccionar `public.origen_before_user_created` (`jsonb`) y habilitar/guardar. No usar función de Production ni escribir contraseñas en el repositorio.
4. Registrar captura o evidencia privada del nombre y estado del hook; **no** adjuntar claves, emails ni datos de usuarios a tickets GitHub.
5. No habilitar métodos de registro distintos del flujo beta de email con consentimiento hasta revisar flujos de OAuth, teléfono e invitaciones. Confirmar CAPTCHA y confirmación de correo antes de pruebas operativas.

**Importante:** ninguna herramienta conectada en esta conversación ofrece una operación documentada para modificar directamente la configuración `Authentication → Hooks`. Crear SQL NO equivale a activar Auth.

Documentación: https://supabase.com/docs/guides/auth/auth-hooks y https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook

## QA obligatorio después de activar — entorno de pruebas privado

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
