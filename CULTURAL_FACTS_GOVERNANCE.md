# ORIGEN — Criterios de confianza para el globo cultural (beta privada)

**Estado:** REVIEW ONLY · 4 noviembre 2026 · **no autoriza lanzamiento público**.

## Principio de marca

ORIGEN es una red social cultural **gratuita** donde personas y comunidades mantienen la voz, identidad, contexto y autonomía sobre su cultura. Un mapa interactivo es una invitación al descubrimiento, no una herramienta que certifique o represente a todas las comunidades de un país. No confundir «fuente institucional» con consentimiento o aval de una comunidad.

El diseño **Contemporary Luxe Tech — B** conserva íntegramente los archivos oficiales `assets/logo-lockup.svg` y `assets/logo-mark.svg`. La versión monocroma CSS del logotipo en la cabecera oscura no altera el símbolo.

## Muestra editorial controlada (6 países)

La rama beta utiliza únicamente un dato introductorio verificado para cada país. La información previa de microhistorias que no tenía un vínculo comprobable queda fuera de las fichas visibles y pendiente de revisión cultural y editorial. Cada registro tiene título/categoría ES/EN, párrafo breve ES/EN, nombre de institución ES/EN, URL HTTPS de la fuente original y fecha de **revisión por ORIGEN** `reviewedOn` (no fecha de publicación del organismo).

| País | Hecho | Fuente institucional |
|---|---|---|
| 🇪🇨 Ecuador | Centro histórico de Quito, Patrimonio Mundial desde 1978 | [UNESCO — Quito](https://whc.unesco.org/en/list/2/) |
| 🇦🇺 Australia | Uluṟu-Kata Tjuṯa: valores naturales y paisaje cultural Aṉangu reconocidos | [Parks Australia — World heritage](https://uluru.gov.au/discover/highlights/world-heritage/) |
| 🇵🇪 Perú | Machu Picchu y su entorno andino-amazónico | [UNESCO — Machu Picchu](https://whc.unesco.org/en/list/274/) |
| 🇧🇴 Bolivia | Carnaval de Oruro: máscaras, bordados y danza, patrimonio inmaterial | [UNESCO — Oruro](https://ich.unesco.org/en/RL/carnival-of-oruro-00003) |
| 🇲🇽 México | La festividad indígena dedicada a los muertos | [UNESCO — Festividad indígena](https://ich.unesco.org/en/lists?RL=00054) |
| 🇯🇵 Japón | Ceremonia japonesa del té y hospitalidad `omotenashi` | [Organización Nacional de Turismo de Japón — Té](https://www.japan.travel/en/guide/tea-ceremony/) |

## Reglas de publicación, corrección y respeto

1. No presentar un dato como una característica uniforme de toda la población. Precisar región, pueblo o práctica cuando corresponda.
2. Mantener a la vista bandera, país, idioma, nombre de la fuente y enlace oficial original; abrir fuentes externas con `noopener noreferrer`.
3. No atribuir opiniones o autorización a comunidades que no hayan participado. Las fuentes institucionales pueden tener límites y sesgos; ofrecer solicitudes de corrección y revisión.
4. No divulgar conocimiento sagrado, restringido, asociado a propiedad colectiva o sujeto a derechos de terceros sin consentimiento y revisión de representantes autorizados.
5. Antes de habilitar aportaciones de usuarios: derechos culturales, reclamaciones, moderación, retiro de medios públicos, pruebas reales de permisos RLS y alojamiento privado protegido.
6. No contar estas seis fichas como seis comunidades afiliadas. Son **seis países con referencias institucionales**, no seis usuarios o agentes confirmados.
7. El globo y la búsqueda deben seguir disponibles sin WebGL: ofrecer lista de países accesible por teclado, textos ES/EN y estado de selección.
8. Priorizar rendimiento, accesibilidad, movimiento reducido, batería y privacidad. No inferir ni solicitar la ubicación precisa de los visitantes para aplicar efectos visuales.

## Próximas fases separadas

- **B aprobado para beta (este commit):** hero refinado, logotipo fiel, fichas institucionales ES/EN, búsqueda de país, selección sin navegar fuera del globo, modo de reserva para móviles sin 3D.
- **Decisión de marca v1.2 (6 Nov 2026):** globo **siempre diurno**, sin terminador solar ni controles Auto/Día/Noche. Priorizar reconocimiento geográfico, accesibilidad, consumo moderado y licencias verificadas de texturas. Esta decisión sustituye la propuesta previa de iluminación astronómica.
- **Pendiente:** ampliar historias y fuentes con gobernanza y revisión comunitaria, más países, perfiles reales y mecanismo de corrección y atribución.
- **Pendiente:** pruebas reales en Supabase Staging con dos cuentas sintéticas bajo Cloudflare Access protegido, sin afectar Production.

**No realizar cambios a** `main`, `origencultural.com`, Supabase Production, pagos o marketplace antes de autorización expresa. PR #3 sigue Draft/NO-GO.
