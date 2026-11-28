# ORIGEN Cultural — Plan de autorización y trazabilidad de publicaciones

**Fecha:** 9 de octubre de 2026  
**Estado:** Controles de derechos culturales y audio implementados en Supabase Staging; pendiente QA end-to-end con cuentas sintéticas y revisión legal; **no implementado en Production.**  
**Responsable de aprobación:** Fundadora y revisión técnica/legal correspondiente.  
**Regla:** Public Beta **NO-GO** hasta verificar controles reales del backend.

## 1. Principio rector

Publicar una obra, imagen, testimonio o conocimiento cultural no significa ser propietario de la cultura, representar a una comunidad ni tener autorización para divulgar todo conocimiento relacionado con ella. ORIGEN debe ayudar a las personas a ejercer el control sobre lo que comparten, sin asumir ni adjudicar autoridad cultural.

No se debe interpretar la confirmación de una casilla como prueba independiente de consentimiento, propiedad intelectual o representación oficial.

## 2. Estado funcional del frontend

- En el editor de Agente Cultural se solicitan **dos confirmaciones independientes** para todo post: derechos del material y consentimiento cultural. Para videos, se solicita además una **tercera declaración específica de audio**, con origen del audio y crédito público cuando se use música de terceros.
- Los cambios posteriores de contenido o archivo **invalidan las confirmaciones anteriores** en el borrador.
- El cliente rechaza iniciar una publicación si falta alguna confirmación requerida para su tipo de contenido, antes de subir archivos. En videos también exige una fuente de audio válida y crédito para música licenciada o comunitaria.
- La API de navegador valida las declaraciones de derechos y audio y envía sus campos al esquema que ya está instalado en Staging. Las pruebas locales simuladas no sustituyen una verificación end-to-end contra Supabase.
- **Limitación crítica:** estas son barreras de experiencia de usuario, no reglas ineludibles del servidor. No persisten por sí solas una prueba de autorización, no verifican a quien declara y no bloquean necesariamente una llamada directa a la base de datos.

## 3. Backend instalado en Staging (no en Production)

La migración `20261020111314_staging_video_audio_rights_attestation_test_only` añade los campos de declaración, fuente del audio y crédito en `public.cultural_posts`; restricciones de base de datos exigen una declaración válida para cada video no editorial. La tabla privada `private.cultural_post_rights_events` conserva la versión de las declaraciones y los metadatos de audio dentro de la misma transacción que el post.

El trigger existente se actualizó para validar la identidad autenticada y las declaraciones, registrar la versión de audio `v1.0`, y rechazar alteraciones posteriores del contenido o de los metadatos de derechos. Se mantienen el esquema privado, RLS y la revocación de permisos de navegador.

La migración se aplicó solo al proyecto Supabase Staging. No se crearon usuarios ni publicaciones y Production no se modificó. La migración aún requiere pruebas reales de rechazo, atomicidad, permisos y acceso entre dos cuentas sintéticas. Los datos declarados sirven como registro de la manifestación del usuario; no verifican la licencia ni el consentimiento cultural por sí solos.

## 4. Revisión humana y protección de comunidades

- Definir quién puede hablar en representación de una comunidad y qué evidencias son razonables y proporcionales.
- No publicar imágenes identificables de menores sin cumplir permisos y normativa aplicables.
- Permitir que el autor retire o cambie un contenido; facilitar reportes de personas retratadas o titulares del conocimiento.
- Tratar solicitudes de retirada o disputa de forma rápida y documentada sin prometer eliminación instantánea de copias o respaldos.
- No mostrar una insignia de verificación cultural por haber aceptado las casillas ni por crear una cuenta.

## 5. Casos de aceptación obligatorios en staging

| Escenario | Resultado esperado |
|---|---|
| Insert directo sin declaraciones | Rechazado por permisos/RLS/control servidor |
| Intento de enviar una sola declaración | Rechazado; no queda publicación visible |
| Ambas declaraciones válidas | Se crean post y evento trazable en la misma transacción |
| Cualquier fallo en el registro de autorización | Rollback completo de la publicación |
| Usuario A intenta declarar/publicar como usuario B | Rechazado por servidor |
| Usuario no Agente Cultural intenta publicar | Rechazado |
| Intento de alterar retroactivamente una declaración | Rechazado; solo evento autorizado de corrección |
| Revocación o reporte de una comunidad | Funciona el circuito de revisión y retirada |
| Cambios de política/versiones | La versión exacta de cada declaración queda conservada |
| Prueba de privacidad | Datos de auditoría no son consultables por el público ni otras cuentas |

Utilizar **cuentas y datos sintéticos** para todas las pruebas. No ejecutar migraciones en Production sin aprobación explícita, plan de respaldo y revisión.

## 6. Dependencias de lanzamiento

- Validación de consentimiento legal de registro en Supabase Auth: ver issue GitHub #6.
- Staging aislado y con acceso protegido: ver issue #5. No obliga a Cloudflare; se elegirá alojamiento compatible con costo aprobado.
- Pruebas reales con dos usuarios y RLS/Storage.
- Revisión de normas comunitarias, procedimientos de moderación, políticas de privacidad y derechos culturales.
- Validación legal por jurisdicción pertinente; no existe una garantía razonable de que una sola cláusula cubra automáticamente todos los países.

**No implementado:** este documento no constituye una migración, un registro real de permisos o un dictamen legal. La versión pública no debe anunciar esas capacidades como activas.

## 7. Diagnóstico técnico comprobado en Production (solo lectura, 9 Oct 2026)

**Resultado: P0 confirmado, sin cambios de datos ni esquema.** Se inspeccionaron las columnas, GRANT, reglas RLS y triggers de `public.cultural_posts` mediante consultas informativas, sin crear usuarios, posts o archivos.

- `cultural_posts` **no tiene** columnas de declaración de derechos o autorización cultural, versiones de aceptación ni relación con un registro de auditoría por publicación.
- Su política RLS `creator posts own insert` exige identidad/propiedad, rol `creator`, no editorialidad, contadores iniciales y propiedad del perfil vinculado; **no exige las dos declaraciones**.
- El rol `authenticated` tiene permiso `INSERT` en la tabla: una petición directa a Data API puede omitir las confirmaciones del navegador y satisfacer la política actual.
- Los triggers existentes `cultural_posts_spam_guard`, `cultural_posts_protect_privileged_fields` y `cultural_posts_touch_updated_at` **no registran ni verifican** declaraciones culturales. La validación de frecuencia de publicación no sustituye consentimiento.
- El cliente beta `createPost` comprueba ambos valores booleanos estrictos y, desde esta revisión, envía `rights_acknowledged=true` y `cultural_acknowledged=true` al INSERT. **Production todavía no tiene esas columnas**, y ni la transmisión ni los tests mock aportan protección o evidencia persistente hasta activar el control del servidor en staging.

### Diseño recomendado para implementar SOLO en un Supabase staging aislado

1. **Contrato obligatorio**: campos booleanos de declaración explícita, versión legal/cultural asignada por el **servidor**, hora del servidor e identidad derivada de `auth.uid()`; nunca aceptar `author_id` u otra identidad como prueba suministrada por el cliente. El control de declaración es una manifestación del usuario, **no** verificación externa del permiso.
2. **Control ineludible**: rechazar desde la base de datos cualquier `INSERT` de publicación de usuario con declaración ausente, incompleta o falsa, incluso si la petición evita completamente `app.js`. Conservar el control RLS de autor, rol y propiedad del perfil.
3. **Atomicidad**: validar declaración y crear registro privado de evento dentro de la **misma transacción** del INSERT del post. Un trigger interno puede ser candidato, siempre que se revise su propietario, privilegios, búsqueda de esquemas, eventuales políticas RLS y errores; no conceder ejecución directa a `anon`/`authenticated` ni crear funciones elevadas expuestas vía Data API. Si falla el evento, abortar todo el INSERT.
4. **Auditoría protegida**: ubicar los eventos en un esquema no expuesto, impedir INSERT/UPDATE/DELETE por roles de navegador y registrar cambios por *eventos adicionales*, no sobreescritura. Definir retención y borrado de datos personales antes de aplicar; el registro de una declaración **no** equivale a autorización comunitaria validada.
5. **Actualizaciones y retirada**: decidir cómo se invalida o renueva la declaración cuando cambian texto/medios, cómo se trata contenido editorial heredado y cómo se retira un post sin destruir inadvertidamente evidencias requeridas ni incumplir solicitudes de privacidad.
6. **Pruebas de rechazo**: insertar vía Data API sin campos, solo un campo, `false`, `null`, una versión inventada, otro `author_id`, un Explorador, una referencia cultural ajena y una publicación bien declarada; comprobar que solo la última publicación autorizada crea **post + evento** y que los fallos producen rollback. Verificar que otros usuarios no puedan consultar ni alterar eventos.
7. **Puerta de despliegue**: primero Supabase staging separado, usuarios ficticios, prueba adversarial A/B, revisión legal y respaldo; **después** considerar migración a Production con autorización expresa. No publicar beta basándose solo en casillas UI, Quality Gate o CodeQL.

**Fuentes técnicas:** [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [triggers](https://supabase.com/docs/guides/database/postgres/triggers), [funciones seguras](https://supabase.com/docs/guides/database/functions). Este apartado es diagnóstico y especificación de revisión, **no una migración ejecutable ni evidencia de funcionamiento en staging**.

## 8. Auditoría de configuración de Staging (9 octubre 2026)

La propuesta `ORIGEN_CULTURAL_POST_RIGHTS_STAGING_REVIEW_ONLY.sql` fue aplicada exclusivamente en `ORIGEN Cultural Staging`. El script **read-only** `supabase/proposals/ORIGEN_RIGHTS_STAGING_CONFIGURATION_AUDIT_READ_ONLY.sql` produjo **10/10 PASS** al inspeccionar las dos columnas booleanas, restricción de publicación no editorial, triggers, función y versiones internas, RLS de la bitácora privada y permisos revocados a cuentas de navegador.

Esta evidencia **no demuestra** que una llamada REST firmada no pueda eludir RLS, que el trigger inserte el evento cuando corresponde, que un fallo produzca rollback o que retirada y retención cumplan políticas. El P0 #7 no se cierra hasta pruebas adversariales end-to-end con usuarios ficticios y revisión legal. No se modifica Production ni se habilita registro público.


## 9. Cambio de audio para videos (20 octubre 2026)

La migración de audio para video se aplicó a Supabase Staging. Se añadieron campos públicos de audio sujetos a restricciones y campos paralelos en la bitácora privada. El trigger crea el registro privado en la misma transacción que la publicación y los cambios de audio quedan protegidos por el bloqueo de edición existente. El crédito autorizado de terceros se muestra junto al video.

Las pruebas automatizadas locales de API y de envío del formulario pasaron con mocks sin llamadas a usuarios o medios reales. **Aún no se ejecutaron pruebas end-to-end con dos cuentas autenticadas**, por lo que la puerta de beta pública continúa cerrada. No se habilitaron publicaciones ni se cambió Production.
