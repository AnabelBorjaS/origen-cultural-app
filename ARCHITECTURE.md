# Arquitectura ORIGEN — producción

## Principio
ORIGEN es una sola plataforma con una sola identidad de usuario y una sola fuente de datos, accesible desde web, PWA y, posteriormente, apps móviles Android/iOS.

## Fuente de verdad
- **GitHub**: código oficial y control de versiones.
- **Supabase**: Auth, PostgreSQL, Row Level Security, Storage y datos persistentes.
- **origencultural.com**: acceso público principal cuando la beta esté aprobada.
- **Android / iOS**: clientes futuros conectados al mismo backend y a las mismas cuentas.

## Web / Web App
La misma experiencia pública debe permitir:
- explorar sin cuenta;
- crear cuenta e iniciar sesión;
- editar perfil;
- seguir y guardar perfiles;
- publicar contenido cultural cuando la cuenta es Agente Cultural; los Exploradores no publican en el feed durante la beta;
- usar Pasaporte Cultural;
- reclamar perfiles de referencia;
- reportar contenido o solicitar correcciones.

## Backend actual
Proyecto Supabase: **ORIGEN Cultural Production**
Región: **ap-southeast-2 (Sydney, Australia)**
Plan actual: **Free**
Costo confirmado al crear el proyecto: **$0/mes**

Tablas beta:
- profiles
- cultural_profiles
- cultural_posts
- profile_claims
- follows
- favorites
- post_likes
- post_comments
- moderation_reports
- legal_acceptances

RLS está habilitado en todas las tablas públicas.

## Media
Supabase Storage:
- avatars
- covers
- post-media

Cada usuario autenticado solo puede gestionar sus propios archivos según las políticas de acceso.

## Perfil cultural
Estados:
- reference: perfil editorial/de referencia todavía no reclamado;
- pending: revisión o verificación pendiente;
- verified: representante aprobado.

Un perfil de referencia nunca debe aparentar ser gestionado por la organización mencionada mientras no haya verificación.

## Seguridad
- Las contraseñas deben gestionarse únicamente mediante Supabase Auth.
- Nunca almacenar contraseñas en localStorage.
- Nunca exponer service-role keys, credenciales de base de datos o secretos en el navegador o GitHub.
- El cliente utiliza únicamente la URL pública del proyecto y la publishable key.
- El control de acceso real debe permanecer en RLS, no solo en la interfaz.

## Evolución móvil
Después de validar la Web App:
1. PWA instalable.
2. App Android.
3. App iOS.
4. Todas comparten Supabase, cuentas, perfiles, contenido y relaciones sociales.

## Futuro
Pagos, experiencias, reservas, mensajería privada y monetización 80/20 no forman parte de la beta inicial y requieren su propia revisión técnica, legal y de seguridad antes de activarse.


## Roles de publicación en Beta
- **Agente Cultural (`creator`)**: perfil público/descubrible y capacidad de publicar contenido cultural/educativo.
- **Explorador Cultural (`explorer`)**: descubre, sigue, guarda, aprende, comenta y conecta; su perfil no es públicamente enumerable y no publica en el feed durante esta beta.
- Esta restricción evita exponer una identidad pública parcial de Exploradores solo para sostener publicaciones y mantiene el alcance de la beta alineado con el modelo de producto actual.
- Una futura fase social puede ampliar la publicación de Exploradores con un modelo de identidad/privacidad diseñado expresamente para ello.
