# Próximo hito: acceso, correo y recuperación reales
Fecha de preparación: 27 noviembre 2026 (Brisbane).
Estado: preparado; ejecución externa pendiente.

## Resultado esperado
Una persona de prueba puede registrarse con consentimiento, confirmar su correo y recuperar su contraseña en la beta protegida; otra cuenta no puede acceder a sus datos privados. Ninguna sesión ni datos llegan a Production.

## Orden de ejecución y evidencia de cierre
| Paso | Acción | Evidencia necesaria para cerrar |
| --- | --- | --- |
| 1. Acceso | Resolver el acceso autorizado al panel Cloudflare sin repetir el login que devuelve 403. | Panel accesible con la cuenta correcta; sin retirar protecciones ni crear nuevas credenciales por defecto. |
| 2. Despliegue | Inspeccionar la beta protegida y todos sus alias conocidos; identificar commit, bundle y configuración efectiva. | Visitante no autorizado rechazado; acceso autorizado funcional; backend exclusivo de Staging, sin secretos en bundle. No reutilizar automáticamente un gate compartido de preview visual para Auth real. |
| 3. Auth | Determinar el origen HTTPS final y las rutas reales de retorno antes de cambiar Site URL y allowlist. | Destinos exactos verificados en código y navegador; enlaces de confirmación y recuperación regresan a ese origen. No comodines amplios ni localhost como destino del piloto. |
| 4. Protección | Verificar consentimiento en el registro HTTP, Turnstile con validación de servidor y protección de contraseñas filtradas. | Intentos inválidos rechazados por servidor, sin crear cuenta; límites de cuota y plan documentados. Si requiere gasto, mantener bloqueo hasta decisión de la titular. |
| 5. Correo | Ejecutar un alta y una recuperación con dos cuentas sintéticas autorizadas y buzones controlados. | Mensaje en buzón y estado en Resend; confirmar remitente y destino sin copiar tokens ni URLs de acción en evidencias. |
| 6. Sesiones | Abrir confirmación y recuperación; probar enlace inválido, vencido/reutilizado, reenvío y doble clic. | Contraseña nueva utilizable; errores seguros ES/EN; ninguna acción sensible se ejecuta solo por visitar un enlace. |
| 7. Aislamiento | Probar con las cuentas A/B: perfil, borradores, archivos y cierre/cambio de sesión. | Rechazo real de accesos cruzados y ausencia de datos residuales; evidencias sin información personal. |
| 8. Publicaciones | Verificar derechos, moderación y retirada de publicación/medios con archivos de prueba. | Registro de autorización íntegro; publicación no aprobada inaccesible; retirada comprobada en Storage/URL con sus límites de caché. |
| 9. Decisión | Registrar resultados, fallos y revisión de la fundadora. | Solo entonces considerar piloto limitado. PR #3 continúa Draft / NO-GO mientras falte un P0. |

Los pasos describen criterios, no pruebas ya ejecutadas. Resolver el acceso no cierra por sí solo Auth, privacidad ni publicación.

## Qué puede avanzar mientras se resuelve el acceso
- Mantener la beta y sus controles de código; registrar por separado resultados simulados y pruebas reales.
- Conservar el SMTP configurado; el panel de Resend no acredita todavía entrega de un mensaje de prueba.
- Preparar el texto de diagnóstico siguiente, sin enviarlo ni adjuntar credenciales.

## Borrador de consulta de acceso (sin enviar)
Subject: Cloudflare dashboard login returns 403

Hello Cloudflare team,

I cannot sign in to the Cloudflare dashboard for my ORIGEN Cultural project. The login form displayed:

API Request Failed: post https://dash.cloudflare.com/api/v4/login (403)

The issue remained after a password reset. I need dashboard access to inspect the protected staging deployment for origen-cultural-staging.pages.dev before enabling authentication callbacks. No production or DNS change is requested.

Please advise the appropriate account-access recovery steps. I can provide the approximate time, account identifier and a redacted screenshot privately through your official support channel if needed.

Thank you.

No se ha verificado en esta actualización un canal de soporte ni su disponibilidad según el plan. Este borrador no debe publicarse como issue con datos de cuenta ni enviarse sin instrucción expresa de la titular.
