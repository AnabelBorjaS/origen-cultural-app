# ORIGEN Cultural — Brand & UI Manual v1.1

**Versión:** 1.2 · **Estado:** dirección de marca aprobada por la fundadora y especificación de la beta; pendiente de revisión visual/móvil, legal y accesibilidad para publicación pública.  
**Alcance:** sitio web responsive + red social cultural, portada, feed, explorar, perfiles, mundo cultural, creación de publicaciones, registro y páginas de confianza.  
**Logotipo:** fuente de verdad inalterada: `assets/logo-lockup.svg` y `assets/logo-mark.svg`. Nunca redibujar, sustituir, distorsionar ni utilizar iconos «O» genéricos en su lugar.

## 1. Esencia y comportamiento de marca

**Propósito:** conectar comunidades culturales y exploradores mediante conocimiento, experiencias e historias con contexto, atribución y consentimiento. ORIGEN no sustituye la voz de las comunidades ni reduce países a una sola curiosidad.

**Promesa del producto:** red social cultural global gratuita durante el piloto, bilingüe y adaptada a web, tablet y móvil; no una landing page ni un marketplace.

**Prioridad de marca:** el globo funciona como medio para reconocer culturas y territorios, no como panel técnico de iluminación. Reducción deliberada de controles por decisión de la fundadora tras evaluar la web de prueba en teléfono.

**Personalidad:** elegante, minimalista, contemporánea, confiable, humana, inclusiva, curiosa y culturalmente respetuosa. *Premium* significa calidad de lectura y atención al detalle, no exclusividad o barreras de acceso.

**Voz editorial:** clara, cálida, sin exotizar, sin generalizaciones culturales, sin métricas ficticias. Etiquetar claramente referencias editoriales, cuentas reales y beta privada. Afirmaciones culturales con fuentes y posibilidad de solicitar correcciones.

**Frase institucional en inglés:** “Connecting the world with its cultural origins.”  
**Frase institucional en español:** “Reconectando la humanidad con sus raíces.”  
El *hero* puede adaptar el mensaje a ambos idiomas, pero **no debe repetir exactamente la misma frase** en título y subtítulo.

## 2. Paleta: cinco funciones, sin ruido

| Token | Color | Uso |
|---|---|---|
| Obsidian / Negro marca | `#0E0E0E` | Fondo oscuro, logotipo en positivo, títulos |
| Ivory / Marfil | `#F7F4EF` | Texto sobre oscuro, superficies cálidas |
| Sand / Arena oficial | `#E8DCC8` | Identidad de marca, superficies secundarias |
| Champagne / Acento | `#D6B98C` | Acción primaria sobre oscuro, foco, selección |
| Graphite / Gris profundo | `#292726` | Bordes y componentes sobre negro |

**Contraste:** texto sobre fondo oscuro en marfil casi blanco; nunca usar negro para acciones del header oscuro. El champagne se usa como acento, no como texto fino de bajo contraste sobre fondos claros. Colores de banderas, imágenes y fotos son contenido real: no deben teñirse para cumplir una paleta.

## 3. Tipografía y escala · Pass 2 de legibilidad (5 Nov 2026)

**Texto e interfaz:** `DM Sans`, Avenir Next, Segoe UI o sans del sistema disponible sin descargar servicios de terceros.  
**Acento editorial:** `Cormorant Garamond` o Georgia, solo en frases editoriales cortas; nunca en labels de formularios ni en el menú.

Esta escala sustituye los mínimos anteriores de 9–11 px detectados en etiquetas, navegación y tarjetas. Son medidas CSS en píxeles, no el tamaño aparente de una captura reducida o de un navegador con zoom:

| Elemento | Escritorio (≥1061 px) | Tablet (701–1060 px) | Móvil (≤700 px) | Interlineado / criterio |
|---|---:|---:|---:|---|
| Título principal H1 de portada | **38–57 px** fluido | **40–56 px** fluido | **36–43 px** fluido | 1.10–1.14; no aumentar |
| H2 de secciones | 32–46 px según componente | 30–40 px | 28–34 px | 1.14–1.25 |
| H3 / títulos de tarjetas | 20–26 px | 20–24 px | 19–22 px | 1.2–1.3 |
| Texto de lectura / descripción | **16 px** | **16 px** | **16 px** | 1.65–1.75 |
| Menú de escritorio | **14 px** | Se sustituye por menú adaptativo | Se sustituye por menú adaptativo | 1.4, peso 600 |
| Etiqueta superior / eyebrow | **12 px** | **12 px** | **12 px** | 1.5, tracking moderado |
| Metadatos de perfiles y tarjetas | **13 px** | **13 px** | **13 px** | 1.45–1.55 |
| Botones principales | **13–14 px** | **13–14 px** | **13–14 px** | Alto interactivo ≥44 px |
| Buscar país: label / campo | **12 / 14 px** | **12 / 14 px** | **12 / 14 px** | Texto visible, sin depender del placeholder |
| Controles Auto / Día / Noche | **12 px** | **12 px** | **12 px** | 1.45, targets táctiles accesibles |
| Indicadores de portada | número 19–24 / descriptor **12 px** | igual | igual | Contraste al menos suficiente para lectura |
| Ficha cultural: contenido / fuente | **14 / 12–13 px** | igual | **15 / 12–13 px** | Fuente legible y enlazada |
| Texto en historias destacadas | **15 px** | **15 px** | **15 px** | Sombra o degradado para contraste |
| Submenú de feed y autores | autor **15** / metadata **13 px** | igual | igual | Ajuste a ancho, truncado solo si es indispensable |
| Pie de página: enlaces / legal | **14 / 13 px** | igual | igual | Color más claro que gris tenue |
| Barra social inferior móvil | — | **11 px** etiqueta + icono | **11 px** etiqueta + icono | 5 destinos, alto táctil accesible |

**Reglas de legibilidad:** no bajar de **12 px** para texto auxiliar persistente de importancia; las excepciones son solo elementos puramente decorativos o etiquetas ultracortas con alternativa accesible. Las etiquetas de barra inferior tienen 11 px por la limitación de cinco destinos, con iconos y área táctil suficiente. Máximo ~68 caracteres por línea en lectura larga; 2–3 niveles de jerarquía visual por bloque; contraste especialmente en fondo negro, fotos y máscaras. Admitir zoom del navegador al 200% y texto aumentado por ajustes del sistema sin pérdida de funciones. En pantallas pequeñas mostrar ES/EN y búsqueda si caben; usar reflow real en lugar de ocultarlos sin alternativa.

## 4. Retícula, espacios y superficies

- Sistema de espacio base: **4, 8, 12, 16, 24, 32, 48, 64 px**.
- Sección portada en desktop: **43–45 % mensaje / 55–57 % planeta**, con anchuras internas equilibradas; a partir de tablet se apilan.
- Una única acción principal visible por bloque; una secundaria; enlaces discretos para acciones terciarias.
- Radios: 12–16 px controles; 16–20 px tarjetas; 999 px botones píldora.
- Sombras suaves únicamente para paneles flotantes; no añadir capas de transparencias sin función.
- Formularios: label visible, ayuda contextual, errores debajo del campo, foco contrastado y estados deshabilitados explicados.

## 5. Componentes

**Header web:** logo íntegro izquierda; navegación centro; idioma y buscar claramente visibles derecha. Idioma como control segmentado que muestra **ES | EN** y marca el idioma actual. Ambos controles con contraste suficiente sobre header oscuro. Menú simplificado con acceso al feed cuando hay sesión.

**Hero público:** frase de marca clara sin repetición; texto explicativo máximo dos líneas de lectura cómoda cuando el ancho lo permite; acciones “Explorar” / “Compartir mi cultura”; globo interactivo como foco visual, no como decoración.

**Globo cultural — decisión definitiva v1.2 (6 Nov 2026):** el planeta muestra **siempre la textura diurna** con países y continentes identificables, sin importar la hora de visita. **No hay selector Auto/Día/Noche ni texto UTC**: el objetivo es descubrimiento cultural, no visualización astronómica. El buscador de países queda como único control de la barra superior, fuera de la esfera. El globo sigue permitiendo girar, ampliar, seleccionar territorios, ver bandera y datos ES/EN con enlace de fuente. Conserva navegación por teclado/tacto y fallback si no hay WebGL.

**Tarjeta cultural:** ancho de referencia 280–300 px en escritorio; nunca cubrir más de un tercio del espacio visible del globo. En móvil aparece **debajo del globo**, no como un modal gigante encima. Fuente y botón cerrar siempre visibles. Un dato no define toda una cultura.

**Feed social:** entrada principal al iniciar sesión, posts auténticos de Agentes Culturales/Exploradores, imágenes, video de hasta 90 s, carrusel mixto aún en preview local, perfiles y navegación. No simular actividad social. Video silenciado inicialmente, controles de reproducción y respeto de movimiento reducido.

**Navegación móvil:** cinco acciones `Feed / Explorar / Crear / Mundo / Perfil` para usuarios con sesión; CTAs equivalentes y registro para visitantes anónimos.

## 6. Contenido, accesibilidad y seguridad

1. Cada pantalla responde claramente **dónde estoy, qué puedo hacer, qué ocurre después**. Frases cortas y señales de progreso honestas.
2. Diseño en español e inglés de verdad: títulos, mensajes de estado, botones, advertencias, lectores de pantalla, búsqueda y errores.
3. Navegación por teclado con foco visible; controles `aria-pressed`/etiquetas; pruebas a 390, 768, 1024 y 1440 px; sin scroll horizontal.
4. Fotos y videos con texto alternativo/subtítulos cuando correspondan; no reproducir audio de forma intrusiva.
5. Derechos de música: autoría y licencias cuando corresponda, permisos de composición y grabación; **crédito no equivale a permiso**. Derechos culturales y consentimiento comunitario para conocimiento restringido.
6. Supabase Production, pagos, dominio oficial y lanzamiento público continúan bloqueados hasta aprobación; el entorno de pruebas debe protegerse con acceso restringido.
7. No copiar literalmente componentes visuales exclusivos, marcas ni material creativo de otras redes.

## 7. QA y prioridades por pantalla

| Prioridad | Vista | Revisión imprescindible |
|---|---|---|
| P0 | Home | Legibilidad de header, H1 proporcionado, no duplicar tagline, globo limpio |
| P0 | Mundo | Toolbar sin superposición, panel compacto, selección teclado/touch, fuente visible |
| P0 | Feed | Post y video legibles, sin datos inventados, reportar/guardar claros |
| P0 | Crear | Tipos de medios y derechos visibles; **publicación bloqueada** si permisos/backend no están listos |
| P1 | Explorar | Filtros simples, imágenes bien recortadas, estados vacíos, procedencia |
| P1 | Perfil | Origen vs ubicación, bio, grid de posts, controles accesibles |
| P1 | Registro | Idioma, confirmar contraseña, ubicación typeahead, correo de confirmación verificable |
| P1 | Tablet/Móvil | Header, menú, barra social y fichas sin solapamientos |

## 8. Política de cambios

Este documento es el sistema de referencia para refinamientos de interfaz de la **rama Draft PR #3**. El logo sigue intacto y el objetivo de ORIGEN (comunidad, conocimiento, impacto cultural) tiene prioridad sobre tendencias visuales. **No publicar a `main` o `origencultural.com` ni habilitar altas reales sin autorización y QA.**
