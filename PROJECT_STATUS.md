# Estado del proyecto — ORIGEN Cultural

Última actualización: 6 de octubre de 2026

## Fuente de trabajo actual
**GitHub es la fuente oficial del código.**
Repositorio: `AnabelBorjaS/origen-cultural-app`

Replit deja de ser la fuente principal y solo podrá utilizarse como herramienta auxiliar si se decide expresamente.

## Infraestructura completada
- Organización Supabase: ORIGEN Cultural.
- Proyecto: ORIGEN Cultural Production.
- Plan: Free.
- Costo confirmado al crear el proyecto: $0/mes.
- Región: ap-southeast-2 (Sydney, Australia).
- Estado del proyecto Supabase: ACTIVE_HEALTHY.
- Esquema inicial de producción aplicado.
- RLS habilitado en todas las tablas públicas.
- Revisión de seguridad de Supabase: sin advertencias activas tras el hardening inicial.
- Storage preparado para avatars, covers y post-media.
- Perfiles de referencia iniciales cargados sin propietario.

## Producto preparado
La versión de lanzamiento debe operar como una única plataforma:
- web pública + web app;
- una sola cuenta ORIGEN;
- datos sincronizados entre dispositivos;
- futura PWA;
- futuras apps Android/iOS sobre el mismo backend.

## Prioridad P0 actual
Estado al 6 Oct 2026:
- ✅ Rama segura de lanzamiento y backup creados en GitHub.
- ✅ Supabase Auth conectado en la rama de lanzamiento; ya no se utiliza la contraseña demo de localStorage para iniciar sesión/registrarse.
- ✅ Recuperación/cambio de contraseña conectado al flujo de Supabase.
- ✅ Follows y favoritos de perfiles culturales conectados a Supabase.
- ✅ Aceptación legal v1.2 registrada desde el alta mediante trigger seguro.
- ✅ Perfiles piloto ajustados a referencias no reclamadas, sin verificación ni métricas ficticias.
- ✅ Security Advisor de Supabase: 0 lints de seguridad activos.
- ⏳ Conectar publicaciones, comentarios, likes, guardados y media a Supabase.
- ⏳ Completar flujo de reclamación dentro de la Web App.
- ⏳ Configurar/validar URLs de Auth para dominio final.
- ⏳ QA registro, email, login/logout, reset y sesión entre dispositivos.
- ⏳ QA móvil/desktop y accesibilidad.
- ⏳ Publicar beta controlada y, tras Go, mover `origencultural.com`.

## Estado de lanzamiento
**NO-GO público todavía.**
El backend ya existe y está protegido, pero la Web App aún debe terminar su integración real con Supabase y pasar QA antes de abrir registro público.
