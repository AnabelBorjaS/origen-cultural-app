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
