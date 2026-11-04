# ORIGEN — Publication intake security checkpoint (15 October 2026)

## Verificado en este avance
- GitHub draft PR #3: `server/private-publication-contract.mjs` valida campos, propósito cultural, doble declaración explícita, extensiones/rutas privadas canónicas, titularidad vinculada al identificador autenticado y claves de idempotencia.
- `server/protected-publication-intake.mjs` proporciona una frontera **sin desplegar**. Requiere dos adaptadores que **no existen aún** en producción: `verifyAccessToken` y `recordPendingIfTrustedCreator`. Rechaza usuarios no verificados, anónimos o archivos de otra cuenta; no copia archivos ni crea publicaciones.
- `tests/protected-publication-intake.mjs` fue incorporado a Quality Gate. Incluye ejemplos sintéticos de repeticiones, usuario ajeno, permisos incompletos y datos manipulados. Las pruebas no sustituyen una verificación real con dos sesiones de Auth.
- Supabase Staging `egujmptgnrpajgfpjjxu`: 0 usuarios, 0 publicaciones, 0 objetos; `post-media-intake.public=false`, política INSERT de posts `WITH CHECK (false)`.
- El SQL `supabase/proposals/ORIGEN_PRIVATE_PUBLICATION_REQUEST_LEDGER_REVIEW_ONLY.sql` superó una nueva ejecución bajo `BEGIN/ROLLBACK` el 15/10/2026. **La tabla no quedó instalada**; no se abrieron permisos ni se escribieron datos.

## Bloqueos — no habilitar beta con comunidades
1. Diseñar un adaptador privado con conexión de servidor y transacción única que vuelva a validar rol `creator` actual, propiedad de todos los objetos de Storage, tipos/tamaños/digest, consentimiento y clave idempotente; impedir cuentas ajenas.
2. Evitar cualquier capacidad de publicación directa desde el navegador: el bucket público y el INSERT de publicaciones siguen cerrados a clientes. No habilitar temporalmente como atajo.
3. La copia de Storage privado a público **no es una transacción atómica** con la escritura de Postgres. Diseñar un estado explícito, recuperación tras errores de red y limpieza/orfandad auditada.
4. Preparar revisión cultural, retirada/expiración y apelaciones; nunca interpretar una casilla de aceptación como prueba legal absoluta de autorización comunitaria.
5. Configurar Cloudflare Access para la raíz y todas las URL de vista previa; ejecutar entonces pruebas con dos cuentas ficticias reales.
6. No conceder `service_role`, contraseñas, tokens ni secretos a cliente, repositorio o archivos públicos.

## Decisión
Mantener **NO-GO**, PR #3 en **Draft**, Production/`main`/`origencultural.com` intactos, presupuesto incremental **AUD 0**. Barra de preparación del piloto privado **60% (6/10 hitos)** hasta completar un hito con pruebas de extremo a extremo.
