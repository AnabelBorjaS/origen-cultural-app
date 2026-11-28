# ORIGEN · Red social cultural y web responsive

**Decisión de producto de la fundadora — 4 nov 2026.** ORIGEN debe ser **una red social cultural global accesible como sitio web** y adaptarse sin perder funciones a **escritorio, tablet y móvil**. No son productos separados. La portada pública explica la misión; el **feed, los perfiles, el descubrimiento y la interacción** constituyen la experiencia principal para personas con sesión iniciada.

**Estilo visual aprobado:** Contemporary Luxe Tech (opción B), moderno, elegante y minimalista; preservar los archivos originales del logotipo geométrico de ORIGEN, con negro obsidiana, champagne e ivory. Los mismos componentes y valores en ES/EN, con variación de layout según viewport.

## Adaptación por dispositivo

| Sección | Web escritorio (>1024px) | Tablet (641–1024px) | Web móvil (≤640px) |
|---|---|---|---|
| Portada anónima | Hero con propuesta + globo 3D a su lado, menú superior | Hero apilado + globo, menú compacto | Título y CTA claros; globo táctil y tarjeta que no tape la pantalla |
| Feed social con sesión | Feed central de lectura + exploración lateral contextual, navegación clara | Feed prioritario con descubrimiento plegable | Feed en una columna y barra inferior persistente |
| Explorar | Rejilla de perfiles con filtros rápidos | Rejilla de dos columnas o una según ancho | Tarjetas y búsqueda al alcance del pulgar; filtros desplegables |
| Crear contenido | Editor cómodo con vista previa | Editor adaptado | Editor de una columna, accesible con teclado móvil; publicar deshabilitado cuando falten permisos |
| Perfil | Cabecera/portada, bio, origen cultural y lugar actual; cuadrícula de historias | Encabezado flexible | Cabecera apilada y acciones accesibles; sin scroll horizontal |
| Mundo cultural | Globo grande con panel lateral de datos y fuente oficial | Globo apilado con panel | Globo táctil + país resaltado, bandera y ficha ES/EN, lista de países accesible |

## Comportamiento de navegación

**Persona anónima**: entra en una portada informativa pero visualmente social, explora países y perfiles públicos **reales** o referencias claramente etiquetadas; no ve likes, posts ni comunidades ficticias.

**Cuenta autenticada**: llega a **Feed cultural** desde Inicio y puede Explorar, Crear (siempre sujeto al control de derechos y publicación), ir a Mundo y acceder a su Perfil. En escritorio se prioriza una navegación superior/lateral; en móvil, **barra inferior Feed · Explorar · Crear · Mundo · Perfil**. El Pasaporte Cultural permanece accesible en menú/perfil; no se elimina.

**Tablas y formularios**: responden a pantalla, tipo de interacción (mouse/teclado/táctil), espacio de lectura y accesibilidad; no se trata de hacer más pequeño el escritorio. Comportamiento consistente a 390, 768, 1024 y 1440 píxeles y también con zoom al 200%.

## Identidad y valores no negociables

- Cultura viva, autonomía de comunidades, atribución, revisión humana de derechos, correcciones y retirada de contenido.
- Red social gratuita durante el piloto Ecuador: **sin pagos, marketplace, reservas ni modelo 80/20**.
- Fuentes oficiales visibles para fichas editoriales, pero una fuente institucional **no supone autorización ni aval comunitario**.
- ES/EN completo (textos, ayudas, estados vacíos, accesibilidad, botones, errores).
- Feed auténtico: si no hay publicaciones, estado vacío sincero con CTA a descubrir agentes; nunca crear actividad artificial.
- Movimiento reducido, pausas, bajo consumo de batería, tamaños táctiles adecuados, navegación teclado y contraste comprobable.
- Autenticación, RLS, moderación, derechos culturales y protección de Staging son **requisitos NO-GO** antes de invitar usuarios reales.

## Criterios de aceptación (pendientes por verificar)

- [ ] Portada clara y profesional para visitas desde la web.
- [ ] Red social completa como experiencia principal de quienes inician sesión.
- [ ] Layout responsive funcional probado en 390/768/1024/1440 px y teclado.
- [ ] Navegación móvil Feed/Explorar/Crear/Mundo/Perfil sin enlaces rotos.
- [ ] Fichas culturales con bandera, ES/EN, fuente verificable y resaltado del país también en pantallas táctiles.
- [ ] Sin publicaciones o estadísticas inventadas ni exposición accidental de datos privados.
- [ ] Sin merge ni despliegue público antes de Cloudflare Access y pruebas E2E.

**Siguiente trabajo técnico:** alinear navegación móvil y menú de escritorio con la arquitectura social, actualizar tarjetas de feed y perfiles al estilo B, y ejecutar regresiones responsive (sin alterar producción).
