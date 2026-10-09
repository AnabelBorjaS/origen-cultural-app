# ORIGEN Cultural — Plan de crecimiento orgánico y comunidad

**Decisión estratégica de la fundadora:** 9 de octubre de 2026  
**Prioridad:** construir una comunidad activa de **Agentes Culturales** y **Exploradores Culturales** antes de ofrecer publicidad pagada.  
**Estado:** plan de trabajo; **no es evidencia de tracción obtenida** ni autorización de apertura pública.  
**Condición inicial:** no invitar a usuarios a una beta con datos reales sin superar `RELEASE_GATE.md`.

## 1. Prioridad de producto

**Crear → descubrir → interactuar → compartir → volver → invitar**, sin exigir pago.

ORIGEN debe ser una red social cultural donde los Agentes Culturales comparten historias, procesos, tradiciones, experiencias y expresiones culturales con su propia voz, y los Exploradores encuentran contenido que les enseña algo, siguen a quienes les interesan y comparten historias con otras personas.

El contenido debe ser culturalmente significativo y, cuando corresponda, divertido, emocionante o sorprendente, para que las personas **quieran compartirlo por iniciativa propia**. «Viral» se considera una aspiración creativa, **nunca un alcance garantizado**. No pedir que se comparta material sagrado, restringido, engañoso o no autorizado para ganar visitas.

**Regla de secuencia:** primero producto seguro; segundo contenido/participación orgánica; tercero crecimiento sostenido y retención; **después** promociones pagadas opcionales; y mucho después acuerdos de referidos comerciales externos.

## 2. Los dos lados de nuestra comunidad

| Agentes Culturales: oferta de cultura | Exploradores Culturales: descubrimiento |
|---|---|
| Crear perfil completo con una historia auténtica | Encontrar perfiles y videos culturales relevantes |
| Publicar fotos, carruseles y videos breves con contexto educativo | Guardar, seguir y comentar con respeto |
| Explicar técnicas, historia, territorio y significado sin apropiarse de otros | Compartir enlaces o contenido autorizado en sus redes |
| Identificar qué contenido tiene permisos y qué debe permanecer privado | Volver por nuevas historias, no por una obligación de permanecer conectado |
| Conectar con Exploradores y recibir retroalimentación | Recomendar agentes y temas que desean conocer |

**No confundir categorías:** una comunidad cultural puede estar representada o participar mediante un Agente Cultural autorizado, pero no todos los Agentes representan formalmente a una comunidad.

## 3. Ciclo orgánico de contenidos

1. Un Agente Cultural cuenta una historia real mediante **video corto, foto o carrusel**: un oficio, proceso, comida, palabra, objeto, persona, memoria o lugar.
2. El contenido presenta contexto: de quién es la historia, dónde ocurre, qué significa y qué partes pueden compartirse.
3. Un Explorador descubre esa historia en el feed o directorio, aprende, guarda o sigue al Agente.
4. Puede **compartir el enlace correcto de esa publicación** con amigos o fuera de ORIGEN, sujeto a permisos; el destinatario conoce la historia y puede explorar el perfil original.
5. La persona vuelve cuando el Agente publica una continuación o cuando encuentra otro tema de interés.
6. Cuando el producto demuestre valor, un Agente o Explorador podrá **invitar voluntariamente** a otros —sin spam ni recompensas engañosas—.

**Principio editorial:** viralidad responsable = valor cultural + historia comprensible + opción fácil de compartir + respeto a la autoría. No comprar engagement, usar bots o inventar afiliaciones.

## 4. Formatos sugeridos para pilotos (sin imponerlos)

- **«¿Sabías que…?»**: un dato contextualizado sobre tradición, territorio o idioma.
- **«Así se hace»**: video breve de una técnica o elaboración que pueda compartirse públicamente.
- **«La historia detrás de…»**: el significado de una pieza o práctica narrado por su protagonista.
- **«Una palabra, una historia»**: una expresión lingüística explicada por un hablante autorizado.
- **«Antes y ahora»**: evolución de una práctica con fuente y consentimiento.
- **«Pregúntale al Agente Cultural»**: preguntas de Exploradores para futuras historias.

Pedir permiso antes de grabar a terceras personas, menores, rituales o bienes culturales con restricciones. No convertir una tradición privada en espectáculo para ganar alcance. No exigir frecuencia de publicación que resulte explotadora o inviable.

## 5. Fases de crecimiento con puertas de seguridad

### Fase 0 — Antes del lanzamiento (ahora)

- Diseñar guías de creación y plantillas de historias sin subir material ajeno.
- Realizar conversaciones exploratorias voluntarias **fuera de la web** con candidatos, sin anunciarlos como socios.
- Corregir el feed, perfil, reporte, enlaces directos, compartir y traducciones en un staging aislado.
- Verificar primero los bloqueos P0 de Auth, consentimiento y RLS.

### Fase 1 — Piloto cerrado tras Release GO

- Hasta **10 Agentes Culturales voluntarios** de Ecuador, con permiso sobre su identidad y contenido.
- Cohorte de **30–50 Exploradores Culturales invitados** para observar uso real y retroalimentación; **meta experimental, no registros existentes ni compromiso de crecimiento**.
- Cada Agente decide si puede compartir **1–2 piezas propias de prueba** durante el primer ciclo; no prometer publicaciones obligatorias.
- Observar durante **4 semanas** si el ciclo descubrimiento → interacción → retorno funciona y qué contenidos se comparten por interés genuino.
- Analizar feedback individual privado, soporte, privacidad y solicitudes de retirada.

### Fase 2 — Comunidad orgánica ampliada

Solo después de corregir seguridad y fricción del piloto: invitar gradualmente a más Exploradores, publicar historias autorizadas en los propios canales de ORIGEN y trabajar con Agentes Culturales que desean difundir su trabajo. Incentivar colaboraciones auténticas y vínculos al perfil original.

### Fase 3 — Validación comercial (no durante piloto)

Estudiar promociones voluntarias **solo cuando los Agentes tengan una audiencia real** y pueda demostrarse un beneficio razonable con métricas verificables. Estudiar posteriormente comisiones por ventas externas atribuidas, sin checkout propio. `BUSINESS_MODEL.md` detalla límites.

## 6. Tablero de indicadores de comunidad

Ninguna de estas metas se ha alcanzado ni medido todavía.

| Indicador | Definición operativa | Referencia inicial para piloto |
|---|---|---|
| Agentes activados | Cuentan con perfil propio y al menos una publicación autorizada | **7 de 10** (meta propuesta previa) |
| Exploradores invitados | Personas reales que aceptan probar la beta cerrada | **30–50 invitaciones aceptadas** como hipótesis, sujeto a capacidad de soporte |
| Activación de Exploradores | Descubren y realizan una acción voluntaria (seguir, guardar o comentar) | Medir porcentaje; sin inventar línea base |
| Historias compartidas | Publicaciones cuyos enlaces se comparten explícitamente | Medir solo si es técnicamente posible y proporcional a la privacidad |
| Retorno a 7/30 días | Personas que regresan a descubrir o publicar contenido | Establecer línea base con cohorte real |
| Calidad cultural | Agentes conformes con cómo se representa su contenido y derechos | Conversación de feedback; no inferir de likes |
| Seguridad | Incidentes confirmados de suplantación, uso no autorizado o privacidad | Objetivo **0**, investigando cada reporte |
| Ingresos del piloto | Ventas de anuncios, comisiones y pagos en ORIGEN | **0**: no habilitados |

**No utilizar «número de seguidores» o visualizaciones aisladas como definición de éxito.** Evaluar participación genuina, repetición, satisfacción, seguridad, y la capacidad de un equipo pequeño para sostener la comunidad.

## 7. Backlog de producto por impacto

**P1 — antes de abrir orgánicamente**
- Compartir una **publicación concreta** mediante enlace directo que abra su historia original, no solamente la página general del feed. Debe funcionar sin sesión para contenido público y respetar retirada/privacidad; implementar tras revisar API de carga individual y diseño de rutas.
- Presentar correctamente nombre, contexto, territorio, derechos y Agente autor en la experiencia compartida.
- CTA discreto de **seguir, guardar o explorar** que se entienda en móvil. Sin muros artificiales para leer contenido público.
- Moderación/reportes accesibles y autorizaciones culturales validadas.

**P2 — tras comprobar interés**
- Secciones editoriales como «Descubre hoy» o «Historias de Ecuador» según contenido real autorizado, sin inventar recomendaciones personalizadas.
- Invitación orgánica de amigos o agentes sin acceso a la agenda de contactos por defecto.
- Métricas de difusión y retorno con privacidad y consentimiento donde corresponda.

**Excluido en esta etapa:** pagar para destacar, subastas publicitarias, banners, afiliación de ventas, recompensas por tiempo de pantalla, bots de viralidad y promesas de impresiones.

## 8. Criterio para empezar siquiera a diseñar anuncios pagados

Necesitamos tener:
1. Experiencia segura y confiable en producción y mecanismos de reporte y soporte funcionales.
2. Agentes publicando voluntariamente y Exploradores que **de verdad** estén descubriendo e interactuando, no solo cuentas registradas.
3. Evidencia de retorno y de utilidad orgánica tras un ciclo de observación.
4. Métricas auditables sobre audiencia y capacidad para informar con transparencia qué compra un anunciante.
5. Revisión legal, comercial, tributaria y de privacidad, presupuesto y autorización explícita de la fundadora.

**No existe un número mágico de usuarios ni una fecha automática para activar anuncios.** El crecimiento real determina cuándo vale la pena estudiar la monetización.
