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
1. Sincronizar en GitHub la versión más reciente de la Web App.
2. Reemplazar cuentas/contraseñas locales por Supabase Auth.
3. Conectar perfiles, publicaciones, follows, favoritos y claims a Supabase.
4. Eliminar persistencia sensible en localStorage.
5. Probar registro, verificación de email, login/logout, password reset y sesión entre dispositivos.
6. Probar propiedad y permisos con RLS.
7. Revisar contenido de referencia para no atribuir seguidores, publicaciones o declaraciones ficticias a entidades reales.
8. QA móvil/desktop.
9. Publicar beta controlada.
10. Migrar `origencultural.com` a la plataforma cuando el release gate esté aprobado.

## Estado de lanzamiento
**NO-GO público todavía.**
El backend ya existe y está protegido, pero la Web App aún debe terminar su integración real con Supabase y pasar QA antes de abrir registro público.
