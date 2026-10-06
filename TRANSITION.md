# ORIGEN: desarrollo independiente de Replit

## Revisión del 6 de octubre de 2026

Código inspeccionado: AnabelBorjaS/origen-cultural-app, commit 78265da (18 de julio de 2026). Replit muestra una actualización del 24 de septiembre de 2026. No está confirmado que ambas copias coincidan: antes de reemplazar la versión de Replit, comparar y sincronizar sus cambios. La consulta de inspección al conector Replit no devolvió una respuesta.

La copia de GitHub usa HTML, CSS y JavaScript sin dependencias de ejecución ni backend. Replit aporta el servidor de desarrollo. No se encontró integración activa con Supabase, Stripe o Payphone; schema.sql es un esquema propuesto, no una base de datos respaldada.

## Lo preparado

Ejecutar `python3 scripts/build-static.py` genera dist/ con únicamente archivos públicos. Corrige las rutas de los iconos PWA e incluye mundo.js en el caché offline de la distribución. El workflow genera un artefacto descargable en GitHub Actions; no publica ni cambia el dominio. El repositorio y documentos internos no forman parte de la distribución.

Se puede continuar editando este repositorio sin Replit Agent. La distribución puede alojarse en un servidor estático, incluido Cloudflare Pages. Documentación oficial: https://developers.cloudflare.com/pages/get-started/direct-upload/ y https://developers.cloudflare.com/pages/framework-guides/deploy-anything/ . Subir el contenido de dist/, nunca el repositorio completo. Para una integración con Git, usar un comando de build `python3 scripts/build-static.py` y salida `dist`.

## Datos y cuentas: pendiente antes del piloto real

Usuarios, contraseñas, sesión, publicaciones, comentarios, favoritos y pasaporte son datos locales del navegador. Las contraseñas se comparan directamente en app.js: este acceso es una demostración, no autenticación de producción. No abrir registro público ni solicitar contraseñas reales antes de sustituirlo por autenticación segura y almacenamiento compartido.

Cambiar de hostname no traslada localStorage. Una copia del repositorio NO respalda esos datos. Inventariar y exportar los datos en el navegador original antes de cambiar de URL; un respaldo con usuarios puede incluir contraseñas y debe manejarse de forma privada. No subirlo a GitHub. Los archivos cargados localmente también deben revisarse en ese navegador.

## Siguiente paso de publicación

1. Confirmar la versión actual de Replit y preservar cambios no sincronizados.
2. Obtener acceso autorizado a la cuenta de hosting elegida. Cloudflare y Supabase no están conectados en esta sesión.
3. Crear una URL de prueba con la distribución, validar navegación, imágenes, idiomas y PWA.
4. Sustituir la autenticación local y habilitar almacenamiento compartido para un piloto con usuarios reales.
5. Cambiar origencultural.com solo después de comprobar la nueva versión y respaldar datos del origen anterior.

No se ha contratado ningún plan, desplegado la app, modificado DNS ni eliminado datos.
