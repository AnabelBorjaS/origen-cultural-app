# ORIGEN Cultural — Retirada segura de publicaciones y archivos públicos

**Estado:** protocolo de desarrollo para beta; **NO** es un procedimiento ya operativo de moderación.  
**Fecha:** 9 de octubre de 2026.  
**Bloqueo:** P0 antes de invitar Agentes Culturales reales.  
**Alcance:** historias culturales del feed, fotografías, videos, derechos de imagen, conocimiento cultural y solicitudes de retirada.

## 1. Hechos verificados (auditoría SQL de solo lectura, 9-10-2026)

- La tabla `public.cultural_posts` tiene RLS habilitado. La política `posts public read` permite `SELECT` a `anon` y `authenticated` si `is_published=true`, o acceso del autor o administrador autorizado. La consulta pública del enlace de historia filtra **ambos** `id` e `is_published=true`.
- `storage.buckets` muestra `post-media.public=true`, al igual que `avatars` y `covers`. **Cualquier persona con una URL válida de un objeto en un bucket público puede descargar ese objeto**, aunque su publicación deje de ser visible en la Data API.
- `public.cultural_posts` tenía **0 publicaciones, 0 publicadas y 0 ocultas** al momento de la verificación. Esto no demuestra que una futura retirada funcione.
- En el código beta, la eliminación de un post se restringe al autor por filtro de `author_id` y la DB/RLS, y se intenta eliminar de Storage su `media_urls` y `image_url` heredado.
- Revisión 9-10-2026: antes, esa limpieza se lanzaba sin esperarla, y la interfaz podía decir «eliminada» mientras fallaba. El código beta ahora **espera el resultado de los intentos de limpieza**, evita marcarlos como éxito si falla alguno e informa de que podrían quedar archivos públicos.
- **No hay todavía** cola de eliminación en servidor, bitácora protegida de retirada, moderación administrativa probada ni integración de proveedores para retirar contenido externo.

## 2. Riesgo concreto

**Eliminar u ocultar una publicación no equivale a revocar su archivo público.**

La retirada de la fila de la base de datos evita su presentación normal en el feed y el permalink. No obstante:
1. Un usuario con una URL de `/storage/v1/object/public/post-media/...` aún puede acceder al medio si el objeto no se ha borrado de Storage.
2. Borrar el objeto de Storage puede requerir propagación de cachés CDN/navegadores. No se debe garantizar eliminación inmediata de copias que otros descargaron, guardaron o republicaron.
3. Fotos o videos hospedados fuera del Storage de ORIGEN no se pueden revocar desde ORIGEN sin colaboración del proveedor/titular.
4. La eliminación desde el navegador puede fallar por caída de red, cierre de sesión, cambio de cuenta, error de permisos o fin de batería.
5. Si el post ya fue eliminado de base de datos y la limpieza falló, el cliente puede haber perdido la asociación entre el post y los objetos: se necesita un proceso administrativo seguro para recuperar y cerrar ese caso.

**Riesgo reputacional:** el Agente o titular puede creer que su imagen o conocimiento cultural dejó de estar disponible cuando persiste una URL accesible.

## 3. Medidas beta ya programadas (no probadas con Storage real)

- La página `#publicacion/<UUID>` usa una consulta individual publicada para evitar divulgar la historia cuando no está disponible.
- `deletePost` consulta al autor y medios anteriores; elimina por `author_id` (defensa adicional a RLS); espera el resultado de los intentos de borrado de medios conocidos y reconoce resultados inciertos/errores.
- Tras confirmar la eliminación de DB, un error posterior de actualización de feed **no** se comunica como si DB no hubiera eliminado el post.
- Ante limpieza incompleta, la interfaz avisa: publicación retirada, pero no se pudo confirmar la eliminación de todos los archivos, y presenta `info.origencultural@gmail.com`.
- Pruebas unitarias simuladas cubren: no sesión, otro autor, DELETE de cero filas, limpieza de medios de autor, `image_url` heredado, URLs externas, fallo de Storage y espera real de la resolución. **No prueban un objeto real ni invalidación de CDN.**

### Ajuste de seguridad del cliente (9 octubre 2026)

El método `removeOwnMedia` ahora requiere que la respuesta de Storage incluya el identificador exacto del archivo solicitado entre los objetos eliminados. Una respuesta exitosa pero vacía, sin error, o con otro archivo deja la limpieza en estado no confirmado. El flujo de post y los de limpieza auxiliar reportan esa incertidumbre. Se añadieron pruebas simuladas para ambos casos. Esto **no demuestra** que una URL pública haya quedado inaccesible y tampoco sustituye una cola de reintentos ni auditoría del servidor. Comprobar en staging con medios sintéticos antes del piloto.

## 4. Procedimiento propuesto para retirada administrativa

**No implementar en Production sin aprobación, proyecto staging aislado y revisión de permisos.**

1. **Recepción y clasificación:** recibir reporte auténtico por canal autorizado; documentar motivo, fecha, referencia mínima y responsable de revisión en almacenamiento privado.
2. **Contención del post:** operador administrativo verificado cambia a `is_published=false` a través de endpoint servidor protegido/privilegios mínimos y registra decisión. Una denuncia **no** debe retirar automáticamente contenido por sí sola.
3. **Inventario del medio:** conservar en un registro privado los identificadores de Storage y el resultado previsto; no copiar URLs públicas de contenido sensible a logs, GitHub, analítica o documentos públicos.
4. **Revocación:** retirar objetos gestionados mediante un proceso servidor autenticado y auditable; registrar por objeto los intentos, resultados y fecha. Definir el tratamiento de medios también asociados a otros posts para evitar borrado indebido.
5. **Verificación:** revisar que el permalink ya no expone la historia y que el objeto no se puede recuperar desde una URL original. Documentar eventuales demoras de caché y repetir la comprobación según la estrategia aprobada.
6. **Comunicación:** informar exactamente qué se ha retirado, qué sigue pendiente, límites respecto de copias externas y vías de revisión/apelación. No afirmar «eliminado de Internet».
7. **Conservación legal y privacidad:** plazos de evidencia y respaldos definidos por asesoría competente. La retención de pruebas se separa de la visibilidad pública y de los archivos compartidos.

## 5. Requisitos para un backend de retirada seguro

- Endpoint o función exclusiva de operadores autorizados; sin `service_role` en navegador.
- Flujo transaccional o compensable de estado del post + inventario de medios + bitácora.
- Lista de estados para seguimiento de cada archivo: `pending`, `deleted`, `retry_needed`, `external_unavailable`; sin inventar éxito.
- Reintentos idempotentes y controlados, preferiblemente procesados en servidor; alertas privadas si hay fallos persistentes.
- Reglas claras para imágenes de menores, consentimiento comunitario, reclamaciones concurrentes y preservación legal.
- Riesgo de acceso a medios compartidos entre contenidos evaluado antes de borrarlos.
- No prometer eliminación instantánea en redes y CDNs de terceros.
- Auditoría con dos cuentas (Agente A/B), persona anónima y operador de moderación con roles separados.
- Seleccionar estrategia de bucket: **público con retirada auditada** para contenido destinado a todos o **privado con URLs firmadas** para contenidos cuyo acceso debe poder controlarse. Esta decisión requiere un diseño separado y no se presupone equivalente a borrar copias antiguas.

## 6. Matriz de aceptación obligatoria en staging aislado

| Caso | Prueba | Resultado aceptable |
|---|---|---|
| Historia pública | Compartir permalink y URL original del medio | Ambos públicos según consentimiento |
| Autor oculta post | `is_published=false` | Feed y permalink ya no enseñan historia |
| Medio de post oculto | Probar URL Storage **sin borrar archivo** | **Sigue accesible** en bucket público: limitación esperada, debe documentarse |
| Autor elimina post | Usuario A borra post con medio propio | DB elimina solo A; intenta y confirma borrado Storage |
| Storage falla | Forzar error controlado durante retiro | Notificar operación parcial sin falso «todo eliminado», registrar para acción humana |
| Intenta borrar B | A intenta retirar post y medio de B | Backend y Storage lo impiden |
| Moderador autorizado | Operador retira contenido reportado sin ser dueño | Hay permiso administrativo auditable y confirmación verificada |
| Visitante anónimo | Intenta acceder a borrador/retirado por Data API | Sin contenido; RLS aplicado |
| CDN y cachés | Acceso a URL pública de objeto después de borrarlo | Verificar límites, caché y plazos reales; no prometer instantaneidad |
| Material externo | Medio fuera de ORIGEN | No afirmar que se eliminó del servidor tercero |
| Varios posts → mismo medio | Intento de retirar solo una referencia | No destruir otros contenidos autorizados inadvertidamente |
| Evidencia privada | Reporte y bitácora | No accesible por terceros o cuentas ordinarias |

## 7. Puertas de lanzamiento y responsables

**Antes del piloto Ecuador:** implementación de una respuesta proporcionada a reportes y retiradas, acceso administrativo limitado, pruebas en staging con dos cuentas, documentación del consentimiento de publicación y de las limitaciones de URLs públicas. La fundadora debe aprobar los costos y servicios antes de contratar o desplegar.

**No-go:** falta de un método fiable para detener exposición de contenido cultural restringido o datos de menores; media retirada sin control/auditoría; permisos de backend no probados.

**Interdependencias:** issues #5 (staging), #7 (derechos culturales server-side), #8 (moderación), #10 (permalinks).

**Fuentes técnicas actuales verificadas:** 
- Documentación Supabase Storage Buckets: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Documentación Supabase CDN Smart CDN: https://supabase.com/docs/guides/storage/cdn/smart-cdn
- Código: `supabase-client.js`, `app.js` y `tests/client-ownership.mjs`

**Nota:** ningún paso de este documento fue ejecutado contra datos reales ni implica que ya exista un servicio de retirada administrativa en Production.
