# ORIGEN · Publicaciones culturales con fotos + videos

**Estado: beta privada, vista previa local solamente. NO-GO para publicación mixta.**

La red social cultural se usa desde web de escritorio, tablet o móvil. El editor conserva foto individual, carrusel fotográfico y video individual de hasta 90 segundos. La cuarta opción, **Fotos + videos / Photos + videos**, permite ahora preparar un carrusel mixto en memoria del navegador.

**Disponible en la beta**
- Seleccionar varios archivos JPG, PNG, WebP, MP4, WebM o MOV.
- Mostrar fotos y videos con sus controles de reproducción; ver el carrusel y cambiar el orden de los archivos, eliminando elementos.
- Avisar si un video supera 90 segundos o no se puede verificar su duración.
- Mostrar declaraciones de audio cuando haya videos, además de autoría del material y consentimiento cultural.
- Mantener **deshabilitado el envío** mixto incluso si las opciones de publicación habituales se marcan como listas; no cargar los archivos a Storage, no escribir publicaciones en la base de datos.

**Acordado para el producto final (pendiente de backend)**
- Diseño vertical para videos tipo reels, pero identidad, contenidos y patrones originales de ORIGEN; no copiar marcas ajenas.
- Admitir fotografía, video o una mezcla ordenada de ambos, con subtítulos, accesibilidad ES/EN y controles táctiles.
- Solicitar autorización apropiada para fotos, videos, voces, apariciones y contenido cultural; contemplar permisos comunitarios específicos.
- Para música/audio, identificar si el audio es propio, sin música ajena, licenciado o autorizado por titulares y representantes culturales. **Atribuir a un artista no sustituye licencia**. Una licencia de escucha o de otra plataforma no da permiso automático para redistribuir en ORIGEN. La composición, grabación y actuaciones pueden tener derechos diferentes.
- Revisar permisos para material cultural que requiera autorización antes de publicar y disponer de denuncia, revisión, retirada de archivos y apelaciones.
- El aviso del formulario no reemplaza verificación del servidor; deben existir registro de permisos, restricciones, moderación y almacenamiento seguro.

**Bloqueantes**
1. Definir esquema `media_items` con tipo, orden, origen, tamaños, duraciones, textos alternativos, créditos y consentimiento por elemento.
2. Desarrollar carga atómica segura, validación servidor/Storage/RLS, límites y prevención de ficheros huérfanos.
3. Implementar flujo de permisos de audio y autorización cultural por pieza, reclamaciones y retirada de medios con registros auditables.
4. Validar casos 90 s / 91 s, formatos rechazados, derechos incompletos y aislamiento entre dos cuentas ficticias en Staging privado.
5. Revisar licencias y políticas aplicables antes de habilitar a personas reales.

**Control de cambios:** solo PR #3 Draft. Sin merge a main, despliegue público, pagos ni cambios en Supabase Production.
