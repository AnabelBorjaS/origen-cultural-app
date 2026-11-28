# ORIGEN — Hoja de ruta visual y UX por pantalla

**Revisión:** 4 noviembre 2026 · **Base:** `BRAND_UI_MANUAL_V1.md` · Solo rama Draft PR #3.  
**Objetivo:** una sola red social cultural que se vea profesional tanto en web como en móvil, sin eliminar significado, conocimiento ni funciones.

## Refinamiento de legibilidad · Pass 2 (5 noviembre 2026)

- [x] Manual `BRAND_UI_MANUAL_V1.md` actualizado a v1.1 con escala exacta en px para escritorio/tablet/móvil.
- [x] Tipografía de navegación web 14px, lectura 16px, labels 12px, metadatos 13px, footer 14/13px y control solar 12px.
- [x] ES/EN y búsqueda restaurados en cabecera tablet/móvil: el breakpoint anterior de 980px los ocultaba sin alternativa en el header.
- [x] Aumentada legibilidad de historias culturales, fichas de Agentes, estadísticas del hero, controles del globo, footer y feed.
- [x] Tests de estilos computados añadidos para 390 / 768 / 1440px y comprobación de desbordamiento horizontal.
- [ ] **Aún no hay nueva ejecución confirmada de GitHub Actions**; inspección visual del despliegue actual y navegación en dispositivo real siguen pendientes.
- [ ] Confirmar comportamiento del header a 320–360px y ampliación del texto del navegador al 200%.

## Dirección visual v1.2 · Globo permanente en día (6 noviembre 2026)

- [x] Decisión aprobada por la fundadora: **eliminar por completo Auto/Día/Noche**, la lectura UTC y el código de cálculo solar.
- [x] Mostrar la esfera siempre con **mapa terrestre diurno** tanto en Home como en Mundo Cultural.
- [x] Conservar búsqueda de país, zoom, giro, resaltado, banderas y ficha cultural bilingüe con enlace a fuente.
- [x] Reducir el ruido de la cabecera del planeta a un solo buscador, sin barras informativas que desvíen la atención.
- [x] Reemplazar las capturas Día/Noche por capturas de verificación de portada y Mundo Cultural en tablet.
- [ ] Confirmar mediante navegador real que la esfera se ve iluminada **a distintas horas**, en móvil y escritorio, y que no quedan controles solares ni desbordamientos.
- [ ] Confirmar QA de GitHub Actions, legalidad de imágenes y Cloudflare Access antes de cualquier prueba con usuarios reales.

## P0 — Portada pública (cambios en la rama beta)

- [x] Hero con título más proporcionado y descripción concisa sin tagline repetido.
- [x] Selector de idioma ES/EN visualmente identificable y búsqueda contrastada en cabecera negra.
- [x] Buscador de países como único elemento de la barra superior, **separado del globo**; eliminación intencional del selector solar.
- [x] Ficha de país más compacta; en móvil debajo de la esfera.
- [x] Selector de países con desplazamiento horizontal en una sola fila cuando falta espacio.
- [ ] Validar visualmente en Staging **1440, 1024, 768 y 390 px** que ningún control desborde ni oculte el planeta.
- [ ] Verificar solidez de los enlaces a fuentes; Cloudflare Access antes de cualquier prueba con cuentas.

## P0 — Mundo Cultural

- [x] **Globo siempre iluminado en modo día** (misma textura diurna a cualquier hora), país resaltado y fuentes institucionales ES/EN en seis fichas piloto.
- [ ] Aplicar escala de tipografía y márgenes de v1 a la página de Mundo completo.
- [ ] Comprobar ventana de fuente cultural y mapa usable con toque/teclado/teléfono.
- [ ] Auditar las condiciones de licencia de las texturas del globo y rendimiento móvil.

## Avance social — 6 noviembre 2026

- [x] Feed adaptado a desktop y móvil con H1 legible, CTA de creación accesible y tarjetas de historias culturales ordenadas por autor/contenido/contexto/acciones.
- [x] Selector superior de perfiles identificado como directorio, no como stories efímeras: referencias editoriales señaladas sin atribuir actividad inexistente.
- [x] Referencias editoriales sin métricas de seguidores ficticios ni botón seguir que implique una cuenta confirmada; vías claras de revisión y retirada.
- [x] Directorio con label de búsqueda, filtros `aria-pressed`, contador de resultados e indicación de referencias en ES/EN.
- [x] `tests/smoke.mjs` pasó **123 comprobaciones estáticas** mediante evaluación sobre el estado actual de GitHub; corrección de test obsoleto de duración de videos por validación actual por archivo.
- [ ] **Pendiente:** ejecución completa de Browser QA/CodeQL y prueba visual en Staging protegido; no dar por listo el acceso a personas reales.
- [ ] **Pendiente:** publicación real segura de videos/carruseles mixtos, revisión RLS, permisos de música, moderación y retiradas.

## P0 — Feed social

- [x] Feed central con publicaciones, videos y perfiles de referencia etiquetados, con navegación de red social.
- [x] Unificada la jerarquía autor → contenido → contexto cultural → acciones con tarjetas marfil discretas, controles táctiles más amplios y video ajustado al contenedor.
- [ ] Garantizar captions, pausa, mute y reproducción solo cuando se ve en pantalla.
- [x] Mantener vacío real cuando no hay publicaciones; no crear likes, comentarios ni usuarios ficticios. El feed muestra un aviso y una ruta hacia Explorar.

## P0 — Crear publicación

- [x] Foto, carrusel fotográfico y video individual ≤90 s en editor.
- [x] Carrusel mixto foto + video **solo vista previa local** con orden manual y derechos visibles.
- [ ] UI refinada: cargar archivo → vista previa → descripción/contexto → permisos → guardar/publicar.
- [ ] Implementar esquema de medios tipado y derechos por pieza del servidor; **no publicar** hasta RLS/Storage/moderación.
- [ ] Verificar en dos cuentas sintéticas que jamás se accede a medios o borradores de otra persona.

## P1 — Explorar y perfiles

- [ ] Filtros por país/ciudad específicos pendientes. **Ya implementados:** búsqueda por cultura/nombre/territorio, categorías accesibles y contador ES/EN que identifica referencias editoriales.
- [ ] Grid adaptable 1/2/3 columnas, imagen no distorsionada, texto alternativo y fuente cuando corresponda.
- [ ] Diferenciar **origen cultural** de **ubicación actual** en perfiles.
- [x] Los perfiles editoriales no se presentan como cuentas activas: se quitan métricas de seguidores no representativas, se evita ofrecer seguimiento en referencias no reclamadas y se informa que no hay publicaciones de un representante autorizado.

## P1 — Registro, seguridad, idiomas

- [ ] Revisar flujo de confirmar contraseña, email de confirmación, reintentos y errores.
- [ ] Mantener búsqueda predictiva país/ciudad; no listas gigantes.
- [ ] Asegurar derechos de música, consentimiento comunitario, reporte y retirada accesible.
- [ ] Verificar ES/EN en todos los estados; no mezclar interfaces incompletas.
- [ ] Aplicar Cloudflare Access en hostname raíz y previews y realizar pruebas con dos cuentas de Staging antes de abrir.

## Listo para aprobar diseño (no equivale a aprobación de piloto)

- [ ] Header oscuro con logos intactos y selector/buscador contrastados.
- [ ] No solapamiento de buscador/sol y globo.
- [ ] Ficha cultural no tapa la esfera en móvil, fuente visible.
- [ ] Home funciona con y sin WebGL.
- [ ] Navegación social 5 destinos de usuario móvil y escritorio accesible.
- [ ] Navegador sin errores, pruebas visuales y estáticas completas, confirmadas.
- [ ] No autenticación ni publicación real expuestas al acceso público de Staging.

**Nota operativa:** Cloudflare Pages puede desplegar automáticamente una rama sin proteger su URL. Un despliegue verde **no demuestra** Access, QA de backend ni aprobación de release. No tocar `main` ni `origencultural.com`.
