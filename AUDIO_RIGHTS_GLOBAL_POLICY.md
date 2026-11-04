# ORIGEN Cultural — Política de derechos de audio para videos

**Versión de producto:** audio declaration v1.0  
**Alcance:** ORIGEN se diseña como plataforma mundial. La publicación con música debe tener permisos válidos para el uso en ORIGEN y los territorios donde el video pueda mostrarse.  
**Estado:** control de interfaz y backend instalado en Staging únicamente; no habilita publicaciones públicas ni altera Production. Requiere QA adversarial y revisión legal por jurisdicción antes de una beta pública.

## Regla de publicación

Un video puede publicarse con una de estas declaraciones:

- No incluye música ni grabaciones musicales de terceros.
- Incluye música original propia; quien publica confirma que controla los derechos necesarios y tiene los consentimientos de intérpretes que correspondan.
- Incluye música con permiso o licencia para la composición y la grabación.
- Incluye música tradicional/comunitaria con los permisos de derechos y consentimientos culturales pertinentes.

Para las dos últimas opciones, el editor solicita un crédito autorizado (artista/grupo y canción o fuente). ORIGEN muestra ese crédito junto al video. La interfaz recuerda que conservar el permiso es necesario y que ORIGEN puede solicitarlo. El campo de crédito no constituye evidencia ni reemplaza licencias.

## Límites

- Una suscripción o una pista disponible en Spotify, Instagram u otra plataforma no autoriza automáticamente su uso en ORIGEN.
- Los derechos de la composición y de la grabación son distintos. Un tema tradicional o de dominio público no libera automáticamente un arreglo, interpretación o grabación concreta.
- Para conocimiento o música comunitaria, respetar la autoridad cultural y los protocolos de consentimiento de las comunidades pertinentes, aparte del copyright.
- La declaración del usuario no es una verificación independiente, una licencia concedida por ORIGEN ni una garantía de inmunidad legal para ORIGEN o el usuario.
- El audio de fondo reconocible también debe cumplir esta regla. Si no hay autorización, la persona debe retirar o silenciar la música antes de subir el video.
- Las licencias futuras de una biblioteca musical de ORIGEN deberán permitir expresamente alojamiento, reproducción, streaming, uso en contenido generado por usuarios y disponibilidad mundial durante el período y los territorios licenciados.

## Tratamiento de reclamos

ORIGEN debe ofrecer una ruta visible para reportar derechos de autor o consentimiento cultural. El equipo designado debe revisar el reclamo, limitar temporalmente el audio o el contenido cuando corresponda, contactar a las partes y conservar un registro mínimo del resultado. La política pública, los plazos, las apelaciones y la retención deben revisarse legalmente para los territorios de operación.

## Registro técnico requerido

Cada video debe persistir con la publicación la declaración explícita del audio, el origen seleccionado, el crédito ingresado (si corresponde), el usuario autenticado y la versión de la declaración. La bitácora debe ser privada y creada en la misma transacción que el post. No almacenar documentos de licencia, identificaciones o información cultural sensible en una tabla pública.

## Puerta de lanzamiento

Antes de habilitar a usuarios reales, se requiere en Staging:

1. Rechazar un video si falta la declaración, origen válido o crédito exigido.
2. Rechazar insert directo a la base de datos que intente omitir la declaración.
3. Confirmar que el evento privado se registra atómicamente y que las demás cuentas no pueden leerlo ni modificarlo.
4. Probar reportes y retirada/silenciamiento con cuentas sintéticas.
5. Revisar el texto y las licencias con asesoría legal para cada mercado de lanzamiento.

La función sigue cerrada hasta superar estas comprobaciones.