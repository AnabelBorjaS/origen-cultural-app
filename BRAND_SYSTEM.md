# ORIGEN Cultural — Sistema de identidad digital 2026–2030

**Actualización de trabajo: 9 de octubre de 2026.**  
**Estado:** dirección de diseño aprobada por la fundadora; conciliación de tokens implementada **solo en rama beta**, pendiente de contrastar con un manual oficial independiente y con usuarios reales.

## Personalidad

Editorial, elegante, contemporánea, humana, global, inclusiva y ética. La experiencia debe sentirse tan fácil como una red social y tan cuidadosa como una revista cultural. El protagonista es el contenido y la voz de los **Agentes Culturales**, no los ornamentos.

## Jerarquía de objetivos

1. Descubrir historias y perfiles culturales, seguir, guardar y compartir sin pagar.
2. Facilitar la creación de videos, fotos y carruseles culturales **autorizados**, y reconocer a su autor.
3. Conectar **Agentes Culturales** y **Exploradores Culturales** con una navegación intuitiva.
4. Construir uso orgánico, interacción significativa y retorno antes de estudiar publicidad pagada.
5. Conservar respeto cultural, privacidad, derechos e identidad, incluso si el contenido se vuelve popular.

## Sistema de tokens: base visual propuesta

| Token | Valor de referencia | Función | Estado |
| --- | --- | --- | --- |
| Negro principal | `#0D0D0D` | Texto, navegación, secciones premium y contraste | Configurado en `styles.css` de la beta; coincidía con `manifest.webmanifest` |
| Blanco | `#FFFFFF` | Aire visual, superficies limpias y lectura | Vigente |
| Dorado / arena | `#C8A97E` | Acento y énfasis discreto | Vigente; no usar automáticamente para texto pequeño sobre blanco |
| Gris claro | `#E7E7E7` | Divisores y superficies secundarias | Token de soporte, no color principal de identidad |

Los nombres de tokens son internos del código. El paso a negro `#0D0D0D` es una **decisión de conciliación provisional** con los Fundamentos Maestros; no implica que un manual oficial original haya sido examinado o reemplazado. No introducir colores de marca nuevos sin evaluación.

## Tipografías y su estado real de implementación

- **Títulos editoriales:** `Cormorant Garamond` es la primera familia configurada en el token `--serif`, seguida de Georgia y serif estándar.
- **Interfaz, formularios y texto de lectura:** `DM Sans` es la primera familia configurada en `--sans`, seguida de Avenir Next y fuentes de sistema.
- **Condición técnica importante:** el repositorio todavía **no incluye ni carga archivos de estas fuentes**. Si un dispositivo no las tiene instaladas, mostrará el fallback. La selección definitiva y una solución de tipografía consistente en todos los navegadores requieren aprobación del manual original, revisión de licencias y un plan de carga que respete privacidad y rendimiento.
- No conectar servicios de fuentes de terceros por defecto ni debilitar la CSP solo por estética.
- Usar serif expresiva solo para títulos y relatos destacados; controles y textos funcionales, siempre en sans legible.

## Principios UX/UI 2026–2030

1. **Mobile-first:** navegación básica descubierta sin tutorial; acceso claro a Inicio, Explorar, Crear (solo cuando el rol lo permite), Pasaporte y Perfil.
2. **Menos pasos:** encontrar una historia, abrirla, reconocer su Agente y compartirla sin laberintos de menús.
3. **Contenido protagonista:** proporciones predecibles en imágenes, video y carruseles; reproducción sin sonido intrusivo ni animaciones esenciales para comprender.
4. **Accesibilidad:** meta WCAG 2.2 AA validada con pruebas; contraste de texto normal de referencia 4,5:1 y foco visible. Objetivo interno de controles cómodos de 44×44 px, sin confundirlo con el mínimo normativo.
5. **Lenguaje directo:** acciones que indiquen exactamente qué pasará; etiquetas de iconos, estados vacío/cargando/error, y jerarquía legible.
6. **Sobriedad visual:** suficiente espacio en blanco, dorado contenido, radio/sombras modestos; evitar exceso de efectos metálicos, glassmorphism, decoración pseudoétnica o animaciones pesadas.
7. **Bilingüe y extensible:** español e inglés bien rotulados, con previsión de textos largos y contexto cultural.
8. **Privacidad y bienestar:** minimizar tracking y consumo de datos; no optimizar la interfaz para manipular tiempo de pantalla.

## Compartir publicaciones y reconocimiento de autoría

La experiencia debe permitir que se comparta una **historia concreta** por enlace, con atribución visible. **Esta función aún está pendiente (issue #10)**; la versión beta actual no debe describirse como si tuviera enlaces individuales implementados. Se deben respetar los estados de contenido publicado, oculto o retirado y la visibilidad apropiada del Agente.

## Integridad cultural y marca

- Los perfiles editoriales no se presentan como alianzas o cuentas verificadas.
- No presumir que un Agente Cultural representa oficialmente a una comunidad.
- El contenido cultural restringido o sin consentimiento no se publica para aumentar viralidad.
- Las eventuales promociones pagadas irán diferenciadas de resultados orgánicos y de cualquier sello de verificación; **no hay campañas pagadas activas**.

## Activos oficiales existentes que NO se modifican

- `assets/ORIGEN-isotipo-oficial.svg` — referencia descrita históricamente; comprobar existencia en la rama concreta antes de usar.
- `assets/logo-mark.svg` — isotipo/favicon.
- `assets/logo-lockup.svg` — logotipo horizontal de cabecera.

Conservar siempre proporciones, espacios internos y geometría del símbolo. No deformar, rotar ni decorar por tendencias.

## QA y asuntos abiertos

- **Aplicado solo en beta:** token negro `#0D0D0D`, prioridades de fuente en CSS y `meta theme-color` coherente con PWA.
- **No aplicado:** sustitución de logo, adquisición o carga de fuentes, cambios en Production, rediseño profundo de pantallas.
- **Pendiente de verificar:** manual oficial independiente; fuentes y licencias; contraste y apariencia en dispositivos reales; pruebas de navegación con Agentes/Exploradores; consistencia visual ES/EN móvil/escritorio.
- La comprobación automatizada de código **no equivale** a una auditoría visual o WCAG aprobada.

**Referencias:** `ORIGEN_Fundamentos_Maestros_v1.3_2026-10-09.md` (documento rector actualizado); `ORGANIC_COMMUNITY_GROWTH_PLAN.md`; `RELEASE_QA_RUNBOOK.md` y `RELEASE_GATE.md`.

**No fusionar PR #3, desplegar `origencultural.com`, modificar Supabase Production ni contratar servicios sin autorización explícita.**
