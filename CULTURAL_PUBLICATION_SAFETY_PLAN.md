# ORIGEN Cultural — Plan de autorización y trazabilidad de publicaciones

**Fecha:** 9 de octubre de 2026  
**Estado:** Documento de diseño. **No implementado en Supabase.**  
**Responsable de aprobación:** Fundadora y revisión técnica/legal correspondiente.  
**Regla:** Public Beta **NO-GO** hasta verificar controles reales del backend.

## 1. Principio rector

Publicar una obra, imagen, testimonio o conocimiento cultural no significa ser propietario de la cultura, representar a una comunidad ni tener autorización para divulgar todo conocimiento relacionado con ella. ORIGEN debe ayudar a las personas a ejercer el control sobre lo que comparten, sin asumir ni adjudicar autoridad cultural.

No se debe interpretar la confirmación de una casilla como prueba independiente de consentimiento, propiedad intelectual o representación oficial.

## 2. Estado funcional del frontend

- En el editor de Agente Cultural se solicitan **dos confirmaciones independientes**: derecho o permiso sobre material, fotografías, videos y testimonios; y autorización pertinente para conocimiento cultural restringido o sujeto a consentimiento comunitario.
- Los cambios posteriores de contenido o archivo **invalidan las confirmaciones anteriores** en el borrador.
- El cliente rechaza iniciar una publicación si falta alguna confirmación, antes de subir archivos.
- La API de navegador también bloquea llamadas accidentales a `createPost` sin ambos valores.
- **Limitación crítica:** estas son barreras de experiencia de usuario, no reglas ineludibles del servidor. No persisten por sí solas una prueba de autorización, no verifican a quien declara y no bloquean necesariamente una llamada directa a la base de datos.

## 3. Backend propuesto (solo en un entorno de pruebas separado)

Diseñar y someter a revisión una transacción controlada que **cree la publicación y registre su declaración al mismo tiempo**:

1. Validar `auth.uid()` y la función de Agente Cultural en el servidor, no a partir de campos enviados por el navegador.
2. Requerir ambas declaraciones booleanas explícitas en el contrato de publicación. No usar valores predeterminados positivos.
3. Asociar el evento al `post_id`, `author_id`, fecha de recepción del servidor, versiones de las declaraciones, política vigente y contexto técnico mínimo necesario para auditoría.
4. Crear simultáneamente la publicación y un registro de declaración. Si uno de los dos pasos falla, revertir ambos.
5. Restringir INSERT directo a `cultural_posts` para que **no permita evitar el control obligatorio**. Revisar de forma conjunta RLS, permisos de tabla y cualquier función RPC o trigger.
6. Impedir que el autor altere retroactivamente el registro de declaración; habilitar correcciones y revocaciones mediante eventos nuevos y procedimientos autorizados, no reemplazos silenciosos.
7. Registrar **solo la información mínima necesaria**; no almacenar documentos de identidad, pruebas de menores, archivos de autorizaciones o testimonios sensibles en una tabla pública o repositorio.
8. Documentar retención, derechos de acceso, mecanismo de retirada y el tratamiento de contenidos tras revocación, con asesoría legal para los países en que la plataforma opere.

**Precaución técnica:** si se usa una función `SECURITY DEFINER`, revisarla contra elevación de privilegios, establecer `search_path` seguro y aplicar permisos de ejecución mínimos. Nunca exponer una clave `service_role` al cliente.

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
- El cliente `createPost` revisa `rightsAcknowledged === true` y `culturalAcknowledged === true` pero los valores **no se envían** a `cultural_posts`; por tanto, no constituyen evidencia persistente ni protección del backend.

### Diseño recomendado para implementar SOLO en un Supabase staging aislado

1. **Contrato obligatorio**: campos booleanos de declaración explícita, versión legal/cultural asignada por el **servidor**, hora del servidor e identidad derivada de `auth.uid()`; nunca aceptar `author_id` u otra identidad como prueba suministrada por el cliente. El control de declaración es una manifestación del usuario, **no** verificación externa del permiso.
2. **Control ineludible**: rechazar desde la base de datos cualquier `INSERT` de publicación de usuario con declaración ausente, incompleta o falsa, incluso si la petición evita completamente `app.js`. Conservar el control RLS de autor, rol y propiedad del perfil.
3. **Atomicidad**: validar declaración y crear registro privado de evento dentro de la **misma transacción** del INSERT del post. Un trigger interno puede ser candidato, siempre que se revise su propietario, privilegios, búsqueda de esquemas, eventuales políticas RLS y errores; no conceder ejecución directa a `anon`/`authenticated` ni crear funciones elevadas expuestas vía Data API. Si falla el evento, abortar todo el INSERT.
4. **Auditoría protegida**: ubicar los eventos en un esquema no expuesto, impedir INSERT/UPDATE/DELETE por roles de navegador y registrar cambios por *eventos adicionales*, no sobreescritura. Definir retención y borrado de datos personales antes de aplicar; el registro de una declaración **no** equivale a autorización comunitaria validada.
5. **Actualizaciones y retirada**: decidir cómo se invalida o renueva la declaración cuando cambian texto/medios, cómo se trata contenido editorial heredado y cómo se retira un post sin destruir inadvertidamente evidencias requeridas ni incumplir solicitudes de privacidad.
6. **Pruebas de rechazo**: insertar vía Data API sin campos, solo un campo, `false`, `null`, una versión inventada, otro `author_id`, un Explorador, una referencia cultural ajena y una publicación bien declarada; comprobar que solo la última publicación autorizada crea **post + evento** y que los fallos producen rollback. Verificar que otros usuarios no puedan consultar ni alterar eventos.
7. **Puerta de despliegue**: primero Supabase staging separado, usuarios ficticios, prueba adversarial A/B, revisión legal y respaldo; **después** considerar migración a Production con autorización expresa. No publicar beta basándose solo en casillas UI, Quality Gate o CodeQL.

**Fuentes técnicas:** [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [triggers](https://supabase.com/docs/guides/database/postgres/triggers), [funciones seguras](https://supabase.com/docs/guides/database/functions). Este apartado es diagnóstico y especificación de revisión, **no una migración ejecutable ni evidencia de funcionamiento en staging**.
