# Estado del proyecto — ORIGEN Cultural

Última actualización: 6 de octubre de 2026

## Fuente de trabajo actual
**GitHub es la fuente oficial del código.**
Repositorio: `AnabelBorjaS/origen-cultural-app`

Replit no es la fuente principal.

## Infraestructura completada
- Organización Supabase: ORIGEN Cultural.
- Proyecto: ORIGEN Cultural Production.
- Plan: Free.
- Región: ap-southeast-2 (Sydney, Australia).
- Supabase Auth integrado.
- RLS habilitado en las tablas públicas.
- Storage para avatars, covers y post-media.
- Publicaciones, comentarios, likes y guardados conectados a Supabase.
- Follows y favoritos de perfiles culturales conectados a Supabase.
- Recuperación/cambio de contraseña integrado.
- Aceptación legal v1.2 registrada desde el alta.
- Flujo de reclamación de perfiles conectado a Supabase.
- Perfiles piloto tratados como referencias no reclamadas.
- Límites anti-spam y límites de contenido añadidos.
- Content Security Policy y validación de enlaces externos añadidas.
- Security Advisor de Supabase: 0 lints de seguridad activos tras el último hardening.

## Producto actual
La beta está diseñada como una única plataforma:
- web pública + web app;
- una sola cuenta ORIGEN;
- datos persistentes/sincronizados mediante Supabase;
- futura PWA;
- futuras apps Android/iOS sobre el mismo backend.

## Modelo aprobado
### Cultural Providers
El perfil público debe permitir identidad, territorio, historia cultural, servicios/oferta, web/contacto, redes sociales y feed cultural/educativo con fotos y videos.

### Explorers
Descubren, siguen, guardan, aprenden y contactan a Cultural Providers.

### Partners / Academia ORIGEN
Arquitectura futura documentada. Partners tendrán perfil institucional, feed, follows, programas, solicitudes, enrolments, credenciales/badges verificables y métricas de impacto. No es requisito construir toda Academia para la primera beta pública, pero debe comunicarse como roadmap y no prometer funciones todavía inactivas.

## Bloqueadores actuales de Public Beta
1. ✅ Perfil profesional de Proveedor Cultural incorporado en la Web App: historia, servicios/oferta, web/contacto, redes y feed cultural. Los datos profesionales se guardan en el perfil y las cuentas de Proveedor se preparan para ser públicas/descubribles.
2. Confirmar y probar Auth real: email confirmation, login/logout, password reset y sesión entre dispositivos.
3. Configurar únicamente URLs/redirecciones aprobadas para el dominio de ORIGEN.
4. Activar y probar protección anti-bot/CAPTCHA para registro, login y recuperación.
5. Probar RLS con al menos dos cuentas separadas y verificar que una cuenta no pueda editar/leer información privada de otra.
6. Probar uploads válidos y maliciosos, límites de tamaño/MIME, ownership y borrado.
7. Probar anti-spam, reportes y reclamación de perfil de principio a fin.
8. Actualizar Trust Center/Privacy/Cookies para reflejar Supabase, Storage y el inventario técnico real.
9. Confirmar que no se cargan analytics/ads opcionales antes de consentimiento.
10. QA móvil/desktop, accesibilidad, ES/EN, enlaces, errores/empty/loading states y navegadores principales.
11. ✅ CI/check automático mínimo activo en GitHub y passing.
12. Desplegar una beta/staging de la rama de lanzamiento y validar CSP, Auth redirects y flujos reales.
13. Resolver bugs Critical/High.
14. Hacer revisión final de Trust/legal proporcional al mercado inicial.
15. Solo después: merge a `main` y migración intencional de `origencultural.com`.

## Estado de lanzamiento
**NO-GO público todavía.**
El PR de lanzamiento está abierto, en borrador y es mergeable. La base funcional está avanzada, pero falta QA real, hardening operativo, Trust actualizado, el perfil de Cultural Provider como producto completo y un despliegue de staging verificado antes de abrir registro público.
