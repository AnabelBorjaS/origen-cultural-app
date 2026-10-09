# Estado del proyecto — ORIGEN Cultural

Última actualización: 9 de octubre de 2026

## Enlaces directos para compartir historias culturales — 9 Oct 2026

- ✅ En el código de la rama beta, cada publicación **pública** con UUID admite una URL individual `#publicacion/<UUID>`; el botón «Compartir» ya no apunta al feed genérico. Se usa compartición nativa cuando está disponible y, si no, copia del enlace con mensajes ES/EN.
- ✅ Se añadió una página editorial **sin registro obligatorio** para la historia concreta con autor, contexto, video/foto cuando estén autorizados y acceso a Explorar. No muestra contenido de perfil ficticio como socio verificado.
- ✅ `supabase-client.js` resuelve cada publicación desde la consulta individual `cultural_posts`, filtrando por `id` e `is_published=true`, respetando las políticas RLS existentes; no depende de las primeras 12 entradas del feed.
- ✅ Código defensivo para URLs inválidas y respuestas sin publicación: «Historia no disponible», sin exponer datos no publicados ni mantener la historia anterior visible después de navegar.
- ✅ Node mock `tests/public-story-read.mjs` incorporado al Quality Gate y pruebas mock de Chromium en `tests/browser-smoke.mjs` para vista sin sesión, autor, enlace, ES/EN, ancho móvil, publicación inexistente y URL malformada.
- ✅ Verificado en versión de código+plan **Quality Gate #333 PASS y Browser QA #197 PASS**; CodeQL **#138** seguía ejecutándose en la última consulta.
- ⚠️ **Falta aún QA con datos reales en staging aislado**: RLS desde anónimo y cuentas A/B, publicación oculta/retirada, permisos de contenido, dispositivos reales, metadatos de vista previa en mensajería/redes y casos de moderación. Los enlaces con `#` no garantizan tarjetas OG dinámicas. La issue **#10 permanece abierta**.
- ⛔ Sin publicar el cambio en `origencultural.com`, sin merge y sin modificaciones a Supabase Production.

## Conciliación de identidad digital 2026–2030 — 9 Oct 2026

- ✅ En la rama beta se aplicó el negro de referencia `#0D0D0D` al token CSS `--black`, coherente con el color del manifiesto PWA y de la barra del navegador.
- ✅ La prioridad de fuentes en CSS pasa a `Cormorant Garamond` para titulares y `DM Sans` para interfaz; mantienen alternativas de sistema para cuando estas fuentes no estén disponibles. **No están cargadas/distribuidas como fuentes web**, por lo que la apariencia exacta puede variar en equipos distintos.
- ✅ `BRAND_SYSTEM.md` ahora documenta la dirección digital moderna e intuitiva 2026–2030, diseño mobile-first, cultura primero, accesibilidad, video y crecimiento orgánico, diferenciando decisiones y pruebas pendientes.
- ✅ Quality Gate **#325**, Browser QA **#189** y CodeQL **#130**: **PASS** en la última revisión de código.
- ⚠️ Aún se debe comparar con el manual original de identidad, revisar licencias y formas de cargar las fuentes, evaluar contraste WCAG y realizar QA visual con dispositivos/personas reales. Ver issue **#11**.
- ⛔ Conciliación **provisional**, sin modificación del logotipo, sin merge, sin despliegue público, sin proveedores de fuentes externos ni cambios a Supabase Production.

## La comunidad orgánica es la prioridad del MVP — 9 Oct 2026

- ✅ La fundadora define **crecimiento orgánico primero**: motivar a Agentes Culturales a crear contenidos reales y a Exploradores Culturales a descubrir, seguir, guardar y **compartir** esos contenidos por interés propio.
- ✅ El crecimiento debe producirse antes de la oferta de promociones de pago. No tiene sentido vender anuncios cuando ORIGEN aún no dispone de una audiencia activa comprobada. La «viralidad» es aspiración creativa, nunca promesa de alcance ni motivo para divulgar material cultural restringido.
- ✅ Se creó `ORGANIC_COMMUNITY_GROWTH_PLAN.md` con ciclo Agente → historia → Explorador → interacción → difusión orgánica → retorno y fases de validación responsables.
- ✅ Se actualizó `BUSINESS_MODEL.md`, el piloto `PILOT_ECUADOR_PLAYBOOK.md` y el roadmap de la página de Impacto para priorizar historias y descubrimiento antes que publicidad.
- ✅ Se define una cohorte exploratoria propuesta de **hasta 10 Agentes Culturales y 30–50 Exploradores Culturales invitados**, condicionada a superar primero el release gate. No representa usuarios registrados ni métricas alcanzadas.
- ✅ Se abrió issue **#10 (P1)** para permitir compartir una **publicación específica**: el botón actual copia un enlace general al feed y debe mejorarse con un deep link real, seguro y accesible sin cuenta. La issue comercial **#9** se pospone hasta validar tracción real.
- ⛔ No se habilitaron anuncios, pagos, campañas, seguimiento publicitario ni referidos. Sin merge, sin despliegue y sin cambios en Production.

## Decisión de modelo de negocio — 9 Oct 2026

- ✅ La fundadora define **ORIGEN como red social cultural de acceso gratuito**: alta, perfiles, publicaciones y exploración gratuitas para Agentes y Exploradores Culturales; un Agente Cultural puede ser una persona, colectivo, negocio u organización, sin que "comunidad" sea sinónimo automático de cuenta.
- ✅ La primera fuente de ingresos **futura** será promoción pagada **opcional** para destacar perfiles o publicaciones. Requiere identificación inequívoca de contenido patrocinado, políticas, consentimiento/privacidad, costes y aprobación antes de activar.
- ✅ La segunda fuente de ingresos **futura** podrá consistir en comisiones acordadas por ventas efectivamente **atribuidas en los sitios oficiales de los Agentes Culturales**, con pago, distribución y posventa a cargo del vendedor correspondiente. Se requieren contratos y conciliación; no se genera comisión por un clic sin venta verificada.
- ✅ Se sustituye el antiguo reparto **80/20** como modelo de negocio vigente; no existe porcentaje predeterminado ni comisión actualmente exigible.
- ✅ Referencias actualizadas en `BUSINESS_MODEL.md`, `README.md`, `PILOT_ECUADOR_PLAYBOOK.md` y el roadmap del impacto. Estos cambios son estratégicos, no implementación comercial.
- ⛔ Sin cobro de promociones, sin comisiones, sin sistemas de checkout, sin pasarelas activadas, sin seguimiento de afiliados y sin cambios en Production. Public Beta sigue **NO-GO** por seguridad, consentimiento y QA reales.

## Reportes autenticados: control de identidad y validación — 9 Oct 2026

- ✅ La API de reportes ahora exige una sesión iniciada y rechaza un reporte si el identificador de cuenta con el que se comenzó no coincide con la sesión actual.
- ✅ Se permiten solo motivos canónicos de moderación, publicación objetivo identificable y contexto de hasta 6000 caracteres; motivos arbitrarios, referencias malformadas y solicitudes sin sesión se bloquean **antes** de emitir el INSERT desde el navegador.
- ✅ Al cambiar de cuenta o cerrar sesión se cierra el formulario de reporte, se eliminan sus campos y se limpia la referencia anterior. Las respuestas tardías de la solicitud original no muestran mensajes en la cuenta nueva.
- ✅ `tests/account-write-isolation.mjs` prueba identidad A/B, cierre de sesión, motivo y referencia inválidos, límites de texto y respuesta tardía. `tests/browser-smoke.mjs` prueba la interacción del diálogo con un Agente Cultural simulado, conservando referencia, razón y remitente.
- ✅ **Código evaluado:** Quality Gate **#306 PASS**, Browser QA **#170 PASS**. CodeQL **#111** continuaba ejecutándose al registrar el estado.
- ⚠️ Los controles del navegador **no son antispam del servidor ni garantizan RLS**. Siguen pendientes pruebas en staging con dos cuentas reales y políticas de base de datos que impidan acceso a reportes ajenos. Ver issue **#8** y `RELEASE_QA_RUNBOOK.md`.
- ⛔ Los cambios se mantienen en PR #3 (borrador), sin fusión, publicación ni modificación de `origencultural.com` o Supabase Production.

## Solicitudes públicas de corrección y retirada — 9 Oct 2026

- ✅ Se añadió la ruta pública `#solicitar-revision`, accesible sin cuenta para solicitar la revisión de imágenes, testimonios, derechos de autor, privacidad, representación incorrecta o conocimiento cultural.
- ✅ Se añadieron enlaces contextuales en tarjetas de publicaciones, perfiles culturales y el Centro de Confianza. El formulario completa una referencia del ID de publicación/perfil cuando existe.
- ✅ El formulario es bilingüe, no almacena información en un backend ni envía solicitudes por sí mismo. Solo prepara un correo a `info.origencultural@gmail.com` para que la persona lo abra y lo envíe expresamente. Se advierte de ello de forma visible y no se promete retirada automática.
- ✅ Editar la solicitud invalida el enlace de correo preparado anteriormente y obliga a generarlo otra vez.
- ✅ Protocolo de revisión humana, priorización y apelación propuesto en `CONTENT_REVIEW_OPERATIONS.md`. Pendientes la recepción operativa, el sistema privado de casos, protección de denunciantes y controles administrativos; issue **#8**.
- ✅ Se añadieron pruebas de navegador del formulario sin sesión, preparación de correo, referencia, inglés y versión móvil. **Requieren resultados verdes de CI para considerarse validadas.**
- ⛔ Esta ruta **no sustituye** `moderation_reports` ni implementa moderación/retirada automática. Ninguna denuncia o correo fue enviado; sin merge, sin despliegue, sin cambio en Supabase Production ni dominio público.

## Consentimiento y derechos antes de publicar — 9 Oct 2026

- ✅ El editor de Agentes Culturales incluye dos declaraciones requeridas y separadas, en español e inglés, antes de publicar: **permisos de los contenidos/imágenes/testimonios** y **autorización para divulgar conocimientos culturales sujetos a consentimiento comunitario**.
- ✅ Las declaraciones se anulan si cambia el texto, categorías, etiquetas, territorio, el tipo de publicación o los archivos adjuntos. La persona debe revisarlas otra vez para continuar.
- ✅ La validación ocurre **antes** de las subidas de medios. `supabase-client.js` también rechaza el envío accidental a `createPost` cuando no recibe ambas confirmaciones; este control del cliente es eludible y no equivale a autorización real.
- ✅ `tests/account-write-isolation.mjs` comprueba que una declaración incompleta no provoca un INSERT. La prueba de Chromium confirma que no comienza una subida cuando falta una confirmación, que cambios de contenido invalidan declaraciones previas y que el flujo completo solo continúa tras reaceptarlas.
- ✅ **CI comprobado en código:** Quality Gate **#289 PASS**, Browser QA **#153 PASS**. CodeQL **#94** se encontraba en proceso durante el registro de esta nota.
- ⚠️ **No hay constancia inmutable de esta declaración en Supabase** ni validación server-side. Antes de permitir publicaciones reales deben definirse un mecanismo de auditoría/procedencia, permisos de terceros, moderación y un procedimiento de retirada, sujetos a revisión de seguridad y legal en staging; véase `CULTURAL_PUBLICATION_SAFETY_PLAN.md`.
- ⛔ No se habilitaron cuentas nuevas, no se desplegó staging, no se modificaron `main`, Supabase Production ni `origencultural.com`; Public Beta continúa **NO-GO**.

## Transparencia de perfiles culturales — 8 Oct 2026

- ✅ Cada tarjeta del directorio indica si su perfil es una **referencia editorial de ORIGEN**, una **cuenta autogestionada no verificada**, o un perfil con verificación registrada si existe evidencia autoritativa. El mero rol Agente Cultural no entrega un sello de verificación.
- ✅ Los cuatro perfiles de referencia del piloto publican claramente que ORIGEN los preparó como muestras editoriales, no que exista representación, alianza o gestión oficial por las entidades nombradas.
- ✅ Los perfiles de referencia ofrecen una solicitud de gestión/reclamación con revisión humana; crear una cuenta no transfiere ninguna representación automáticamente.
- ✅ Los perfiles autogestionados señalan que ORIGEN aún no ha verificado la identidad ni la autoridad de representación del titular. Los avisos están disponibles en español e inglés, en móvil y escritorio.
- ✅ La sección roadmap visible en la web quedó alineada con el piloto de **hasta 10 Agentes Culturales voluntarios** únicamente tras superar seguridad, consentimiento y Release Gate; la cifra 20–50 ya no se presenta como primera etapa.
- ✅ Quality Gate del código **#282 PASS** y CodeQL **#87 PASS**. Browser QA **#146** se encontraba en ejecución al registrar esta mejora.
- ⚠️ Estos textos y tests no constituyen verificación real de identidad, propiedad intelectual ni consentimiento de terceros. La beta pública sigue **NO-GO**, sin modificaciones en `main` o `origencultural.com`.

## Registro móvil de Agentes Culturales — 8 Oct 2026

- ✅ Los cinco pasos del asistente guardan los campos escritos al retroceder: datos básicos, historia, categorías, oferta cultural, enlaces y aceptación legal marcada expresamente.
- ✅ La contraseña del asistente se restaura únicamente en la sesión de página en curso mediante JavaScript, sin escribirla en el HTML, URL, localStorage o sessionStorage; el registro sigue sin persistencia durable.
- ✅ La selección de foto de perfil y portada valida anticipadamente las reglas existentes de formato y tamaño antes de generar la vista previa; rechaza archivos PDF o no compatibles.
- ✅ La tecla Enter del teclado móvil avanza los pasos de datos/historia sin recargar; el paso final sigue requiriendo el clic explícito en Crear perfil. Al avanzar o retroceder se regresa al inicio del contenido.
- ✅ Se amplió Browser QA con un recorrido de Agente Cultural a **390px**: entrada por teclado, navegación Atrás/Siguiente, conservación de datos, archivo inválido y válido, categorías canónicas, enlaces y aceptación legal.
- ✅ Para el código `52b293da`: **Quality Gate #276 PASS, Browser QA #140 PASS, CodeQL #81 PASS**. Son pruebas de navegador con datos simulados; no crean cuentas ni verifican Supabase Auth/Storage/RLS en vivo.
- ⛔ **Public Beta NO-GO**: todavía faltan staging protegido, consentimiento legal exigido en el servidor, y pruebas con dos cuentas reales. `main`, producción y `origencultural.com` sin modificaciones.

## Usabilidad del editor cultural — 8 Oct 2026

- ✅ La vista previa de publicaciones se actualiza de manera independiente al formulario, evitando que el cursor salga del título o la descripción mientras un Agente Cultural escribe.
- ✅ Se conservan los campos del borrador al cambiar de fotografía a video.
- ✅ La selección de video muestra un reproductor con controles, no una etiqueta de imagen rota, y pulsar los controles no inicia nuevamente el selector de archivos.
- ✅ Se agregaron pruebas automáticas de foco sostenido después de pausas, continuidad de escritura, actualización de la vista previa y visualización de video en `tests/browser-smoke.mjs`.
- ✅ **Quality Gate #270 PASS · Browser QA #134 PASS · CodeQL #75 PASS** para la versión de código correspondiente.
- ⛔ Estas pruebas usan Agentes Culturales simulados; la validación con participantes reales, permisos del backend y el piloto público permanecen pendientes. No se ha fusionado la beta ni modificado `origencultural.com`.

## Guardado seguro y recuperación de archivos — 8 Oct 2026

- ✅ Los guardados de perfiles `updateMyProfile` y publicaciones `createPost` aceptan un identificador de cuenta iniciadora. Rechazan operaciones si ya se cambió de cuenta **antes de enviar** el guardado.
- ✅ Si una operación válida se confirma después de un cambio de cuenta, no se debe llenar el caché del nuevo usuario con el perfil anterior ni interpretar un guardado exitoso como fallido para motivar duplicados.
- ✅ El editor de publicaciones valida el titular inicial entre subidas; no envía la publicación desde otra identidad por un cambio de sesión a mitad de la operación.
- ✅ El editor de perfil intenta eliminar únicamente los medios recién cargados si falla el siguiente upload o el guardado de perfil, y no elimina las fotos antiguas antes de confirmar un cambio.
- ✅ Prueba aislada `tests/account-write-isolation.mjs` y prueba de navegador `profileMediaRollbackChecks` añadidas al pipeline.
- ✅ **Versión de código verificada:** Quality Gate **#265 PASS**, Browser QA **#129 PASS** y CodeQL **#70 PASS**.
- ⚠️ Si se pierde la sesión durante una subida, el intento de limpieza puede fallar por falta de autorización; registrar una incidencia y evaluar un procedimiento controlado de archivos huérfanos en staging. Ningún mecanismo cliente sustituye RLS de Supabase ni prueba su correcta configuración.
- ⛔ La verificación usa clientes simulados, no cuentas reales: sigue pendiente staging cerrado y QA con usuarios A/B. No hubo cambios en Supabase Production, `main`, el dominio ni nuevos gastos.

## Sesiones concurrentes y aislamiento entre cuentas — 8 Oct 2026

- ✅ `app.js` descarta callbacks de autenticación anteriores si llega un evento de sesión más reciente; también cubre `INITIAL_SESSION` mientras la aplicación se está iniciando.
- ✅ `supabase-client.js` rechaza respuestas antiguas de `auth.getSession()` después de cerrar sesión, cambiar de cuenta o iniciar una restauración más reciente.
- ✅ Las lecturas tardías de `follows`, `favorites`, `post_likes` y `post_saves` ya no pueden rellenar el estado privado de otra cuenta.
- ✅ Una renovación habitual de token para la misma identidad no invalida por error la restauración de sesión.
- ✅ Pruebas aisladas de concurrencia añadidas a `tests/auth-session.mjs` y prueba de eventos fuera de orden en Chromium en `tests/browser-smoke.mjs`.
- ✅ Quality Gate del código #258 aprobado; CodeQL #63 y Browser QA #122 pendientes al registrar este avance.
- ⛔ La verificación utiliza cuentas simuladas. Falta ejecutar pruebas reales de sesión entre dispositivos con dos cuentas en staging protegido; no se ha abierto registro público ni modificado `main` o el dominio.

## Protección de borradores en dispositivos compartidos — 8 Oct 2026

- ✅ Corregido `app.js` para borrar borradores de publicaciones, contraseñas temporales del registro, imágenes y archivos en edición, y selecciones de comentarios al cerrar sesión correctamente o pasar de cuenta A a cuenta B.
- ✅ Se revocan referencias `blob:` de imágenes temporales al descartarlas o al terminar operaciones, y se descartan archivos seleccionados al cambiar el tipo de publicación.
- ✅ Si otra pestaña cierra una sesión mientras está abierta una vista privada, ORIGEN vuelve a una pantalla pública en lugar de dejar visible el formulario anterior.
- ✅ `tests/browser-smoke.mjs` incluye la simulación de dos Agentes Culturales consecutivos en un mismo navegador, limpieza de fotos/borradores y cierre de sesión entre pestañas. **Browser QA #111 PASS; Quality Gate #247 PASS**.
- ⏳ CodeQL #52 permanecía en ejecución al registrar esta sección; verificar resultado final antes de concluir revisión.
- ⛔ Las pruebas son simuladas: queda pendiente Auth/RLS/Storage real en staging y el acceso Cloudflare descrito en [issue #5](https://github.com/AnabelBorjaS/origen-cultural-app/issues/5). No se ha cambiado Production.

## Resumen ejecutivo verificado — 8 Oct 2026

**Fase:** beta controlada pre-staging. **Decisión de lanzamiento:** NO-GO público.

- GitHub PR #3: `reconcile-main-beta-2026-10-07` hacia `main`, abierto en borrador y mergeable; no fusionar todavía.
- CI verificada en rama beta después del fix de registro: **Quality Gate #221 PASS · Browser QA #85 PASS · CodeQL #26 PASS**. La QA de navegador incluye el fallo simulado de subida de foto después de crear la cuenta; las pruebas no usan cuentas reales.
- Prueba nueva `tests/client-ownership.mjs`: confirma aislamiento de eliminación entre autores, control de borrados de cero filas, limpieza de media solo tras eliminación confirmada y rechazo de URL externa/traversal. Corre en `npm run check:release` sin conexión a la base de datos.
- Supabase Production: proyecto activo, 11 tablas `public` con RLS activado y Security Advisor con 0 lints (revisión de 8 Oct). 4 perfiles culturales de referencia; todavía 0 cuentas de usuario y 0 publicaciones reales según el resumen de tablas.
- **Cloudflare Pages staging aún no desplegado.** Paso de autorización/conexión y checklist: [issue #5](https://github.com/AnabelBorjaS/origen-cultural-app/issues/5).
- El consentimiento, Auth real con dos cuentas, CAPTCHA server-side, Storage negativo, solicitudes de privacidad, backup lógico validado, revisión legal y pruebas de staging siguen siendo bloqueadores antes de una beta pública.
- `main` y el dominio `origencultural.com` permanecen fuera de estos cambios. No aprobar gasto ni suscripciones durante este paso.

## Avances nuevos — 8 Oct 2026 (segunda iteración)

- ✅ Eliminado el acceso a Supabase dentro de `onAuthStateChange`; el evento ahora es síncrono y el refresco de interfaz se agenda fuera del callback de Auth, para evitar bloqueos documentados.
- ✅ Se limpian `profile`, follows, favoritos, likes, saves y comentarios al cerrar sesión, recuperar una sesión nula o pasar a otro usuario.
- ✅ Una lectura de perfil antigua ya no debe sobrescribir el perfil de una sesión que ha cambiado durante la solicitud.
- ✅ La interfaz no finge un cierre de sesión correcto si Supabase devuelve un error.
- ✅ Nueva suite aislada `tests/auth-session.mjs` integrada a `npm run check:release`, sin usar datos/cuentas de Production.
- ✅ Calidad del código verificada en commit de aplicación `a4f2a1159d86f59d1421a158724628f8aa20b71e`: Quality Gate **#216 PASS** y CodeQL **#21 PASS**. Browser QA de ese commit estaba en ejecución al documentar; no contarla como aprobación hasta su resultado definitivo.
- ✅ Guía operativa interna `PILOT_ECUADOR_PLAYBOOK.md` creada para 10 Agentes Culturales potenciales con consentimiento, límites beta, métricas propuestas, ética cultural y controles de costos. No representa participantes confirmados.
- ⛔ Cloudflare Pages staging / Auth end-to-end con dos cuentas, Turnstile server-side, recuperación y revisión legal siguen pendientes. No merge a `main` ni cambio de dominio público.

## Avance confirmado — registro resiliente (8 Oct 2026)

- ✅ `doRegister` separa la creación de cuenta Supabase del upload opcional de avatar/portada.
- ✅ Si falla una imagen después de crear la cuenta, la interfaz confirma que la cuenta sí existe y ofrece editar la foto después, sin pedir otro registro.
- ✅ Los medios recién subidos se intentan limpiar si falla la configuración posterior; si el perfil no termina de cargar, se comunica el registro exitoso y se sugiere iniciar sesión para completarlo.
- ✅ `tests/browser-smoke.mjs` ahora simula en Chromium una subida fallida de avatar durante el registro y comprueba **una sola llamada a signup**, navegación y mensaje correcto.
- ⛔ La prueba usa APIs simuladas: Auth real, registros con correo confirmado, límites Storage y limpieza de archivos en Supabase requieren staging y dos cuentas de QA.
- ⛔ [Issue #5](https://github.com/AnabelBorjaS/origen-cultural-app/issues/5) para desplegar Cloudflare Pages Free sigue abierto. No se ha desplegado staging, hecho merge a `main` ni migrado `origencultural.com`.

## Seguridad del consentimiento — revisión 8 Oct 2026

- ✅ Auditoría de solo lectura de las políticas RLS, permisos de `legal_acceptances` y función `private.handle_new_user()` de Supabase Production.
- ⚠️ Brecha confirmada de control: `private.handle_new_user()` crea usuario/perfil aunque no exista `accepted_legal=true`, y usa versiones de términos enviadas por el cliente. **No se ha detectado incidente; es una debilidad preventiva de arquitectura.**
- ✅ `supabase-client.js` exige `acceptedLegal === true`; las pruebas aisladas cubren entradas inválidas y versión v1.2.
- ✅ Propuesta de protección y plan de QA sin cambios de producción: `BACKEND_CONSENT_REVIEW.md`.
- ⛔ Backend P0 pendiente antes de registro público. Requiere validación pre-alta, versión legal definida en servidor, control de invitaciones y pruebas reales de staging. No se aplicó ninguna migración ni cambios a Auth en Production.

## Implementación propuesta sin despliegue — 8 Oct 2026

- ✅ Verificadas en GitHub las pruebas de la última versión anterior a esta preparación: Quality Gate **#229 PASS**, Browser QA **#93 PASS**, CodeQL **#34 PASS**.
- ✅ Supabase Production auditado solo con lecturas: `auth.users` = **0**, `legal_acceptances` = **0** en la consulta del 8 Oct.
- ✅ Función SQL propuesta `public.origen_before_user_created(event jsonb)`, compatible con la documentación de Supabase Auth Hook en Free, preparada bajo `supabase/proposals/ORIGEN_BETA_SERVER_SIGNUP_CONSENT_REVIEW_ONLY.sql`.
- ✅ Propuesta complementaria para `private.handle_new_user()`: exigir `accepted_legal` JSON booleano verdadero y registrar exclusivamente versiones legales v1.2 definidas por ORIGEN, sin confiar en versiones enviadas por cliente.
- ✅ Ocho casos del predicado de consentimiento se validaron con consultas de solo lectura (aceptar `true` booleano; rechazar ausente, `false`, `null`, `"true"`, número 1, proveedor no admitido y alta anónima). **Esto no es prueba del hook instalado.**
- ✅ Archivo de QA de solo lectura para ejecutar después de instalar el hook en un proyecto staging separado: `supabase/proposals/ORIGEN_CONSENT_STAGING_QA_READ_ONLY.sql`.
- ✅ [Issue #6](https://github.com/AnabelBorjaS/origen-cultural-app/issues/6) actualizado con enlaces, evidencia y condiciones de cierre.
- ⛔ **Sin cambios en Production:** los SQL se guardaron en `supabase/proposals/`, NO en migraciones automáticas; ningún hook está activado, no se creó proyecto staging ni usuarios de prueba.
- ⛔ Siguiente dependencia operativa: [issue #5](https://github.com/AnabelBorjaS/origen-cultural-app/issues/5) y autorización de herramientas gratuitas de staging; después validación Auth/RLS/Storage, consentimiento y asesoría legal.

## Fuente de trabajo actual
**GitHub es la fuente oficial del código.**
Repositorio: `AnabelBorjaS/origen-cultural-app`

Replit no es la fuente principal.

## Infraestructura completada
- Organización Supabase: ORIGEN Cultural.
- Proyecto: ORIGEN Cultural Production.
- Plan: Free.
- Región: ap-southeast-2 (Sydney, Australia).
- Supabase Auth integrado.
- RLS habilitado en las tablas públicas.
- Storage para avatars, covers y post-media.
- Publicaciones, comentarios, likes y guardados conectados a Supabase.
- Follows y favoritos de perfiles culturales conectados a Supabase.
- Recuperación/cambio de contraseña integrado.
- Aceptación legal v1.2 registrada desde el alta.
- Flujo de reclamación de perfiles conectado a Supabase.
- Perfiles piloto tratados como referencias no reclamadas.
- Límites anti-spam y límites de contenido añadidos.
- Content Security Policy y validación de enlaces externos añadidas.
- Security Advisor de Supabase: 0 lints de seguridad activos tras el último hardening.

## Producto actual
La beta está diseñada como una única plataforma:
- web pública + web app;
- una sola cuenta ORIGEN;
- datos persistentes/sincronizados mediante Supabase;
- futura PWA;
- futuras apps Android/iOS sobre el mismo backend.

## Modelo aprobado
### Cultural Providers
El perfil público debe permitir identidad, territorio, historia cultural, servicios/oferta, web/contacto, redes sociales y feed cultural/educativo con fotos y videos.

### Explorers
Descubren, siguen, guardan, aprenden y contactan a Cultural Providers.

### Partners / Academia ORIGEN
Arquitectura futura documentada. Partners tendrán perfil institucional, feed, follows, programas, solicitudes, enrolments, credenciales/badges verificables y métricas de impacto. No es requisito construir toda Academia para la primera beta pública, pero debe comunicarse como roadmap y no prometer funciones todavía inactivas.

## Bloqueadores actuales de Public Beta
1. ✅ Perfil profesional de Proveedor Cultural incorporado en la Web App: historia, servicios/oferta, web/contacto, redes y feed cultural. Los datos profesionales se guardan en el perfil y las cuentas de Proveedor se preparan para ser públicas/descubribles.
2. Confirmar y probar Auth real: email confirmation, login/logout, password reset y sesión entre dispositivos.
3. Configurar únicamente URLs/redirecciones aprobadas para el dominio de ORIGEN.
4. Activar y probar protección anti-bot/CAPTCHA para registro, login y recuperación.
5. Probar RLS con al menos dos cuentas separadas y verificar que una cuenta no pueda editar/leer información privada de otra.
6. Probar uploads válidos y maliciosos, límites de tamaño/MIME, ownership y borrado.
7. Probar anti-spam, reportes y reclamación de perfil de principio a fin.
8. Actualizar Trust Center/Privacy/Cookies para reflejar Supabase, Storage y el inventario técnico real.
9. Confirmar que no se cargan analytics/ads opcionales antes de consentimiento.
10. QA móvil/desktop, accesibilidad, ES/EN, enlaces, errores/empty/loading states y navegadores principales.
11. ✅ CI/check automático mínimo activo en GitHub y passing.
12. Desplegar una beta/staging de la rama de lanzamiento y validar CSP, Auth redirects y flujos reales.
13. Resolver bugs Critical/High.
14. Hacer revisión final de Trust/legal proporcional al mercado inicial.
15. Solo después: merge a `main` y migración intencional de `origencultural.com`.

## Estado de lanzamiento
**NO-GO público todavía.**
La reconciliación de ramas ya fue resuelta en una rama nueva creada desde el `main` actual: `reconcile-main-beta-2026-10-07`.
El PR #3 (`Release candidate: reconciled ORIGEN Supabase beta`) está abierto en borrador, GitHub lo reporta como mergeable y el Quality Gate del PR terminó en `success`.
No hacer merge a `main` ni migrar `origencultural.com` hasta completar Auth/CAPTCHA, QA de seguridad con cuentas reales, staging y revisión final de Trust/legal.

## Avances añadidos — 7 Oct 2026
- ✅ Centro de confianza visible dentro de la Web App con resúmenes beta v1.2 alineados al alcance actual.
- ✅ Registro actualizado para exigir aceptación explícita de Términos, Privacidad, Normas de Comunidad y Derechos Culturales antes de crear cuenta.
- ✅ Supabase client rechaza el alta si no existe consentimiento explícito.
- ✅ Métricas del landing ajustadas para no simular actividad real: territorios explorables, perfiles de referencia y estado Beta.
- ✅ Globo cultural restaurado con textura de Tierra + fondo espacial mediante CSP permitida de forma controlada.
- ✅ Feed infinito paginado desde Supabase y comportamiento de video visible/pausado.
- ✅ Bienestar digital con objetivo diario suave de 120 minutos y recordatorio voluntario.
- ✅ Pasaporte Cultural evolucionado hacia colecciones, países, categorías, niveles e insignias sin premiar tiempo de pantalla.
- ✅ Smoke tests automatizados añadidos al Quality Gate para Trust, consentimiento, marca, globo, feed, bienestar y ausencia de service-role key en frontend.
- ✅ Estado de follow/favorite corregido para perfiles reales de Proveedores Culturales.

### Bloqueadores que permanecen antes de Public Beta
- Configurar y probar CAPTCHA / anti-bot en Supabase Auth.
- Confirmar email verification y redirect URLs únicamente para dominios aprobados.
- Probar RLS de extremo a extremo con dos cuentas reales.
- Probar uploads válidos/maliciosos y ownership.
- Revisar Trust Center con profesional jurídico antes de quitar el estado beta/draft.
- QA real mobile/desktop/accessibility y staging.
- Resolver cualquier conflicto de merge del PR antes de integrar a main.


### Feed cultural de Proveedores — 7 Oct 2026
- ✅ Campo backend `content_purpose` añadido a publicaciones culturales con valores controlados: education, history, technique, territory, language, gastronomy, arts, heritage y community.
- ✅ El formulario obliga a seleccionar un propósito cultural.
- ✅ Los Proveedores Culturales solo pueden elegir Foto, Carrusel o Video; la opción Texto se reserva para otros tipos de cuenta.
- ✅ El frontend bloquea de forma explícita publicaciones de texto-only para Proveedores.
- ✅ El feed muestra la etiqueta de propósito junto a la categoría.
- ✅ Quality Gate y smoke tests pasan después de estos cambios.
- ✅ Supabase Security Advisor continúa con 0 lints de seguridad después de la migración.


## Estado GitHub verificado — 7 Oct 2026
- Rama pública principal: `main`.
- Rama de lanzamiento: `launch-beta-supabase`.
- El Quality Gate del commit más reciente de la beta finalizó correctamente (`success`).
- `launch-beta-supabase` y `main` están divergidas; la beta contiene trabajo nuevo y `main` también recibió cambios independientes.
- El PR #2 permanece en draft y actualmente no es mergeable.
- Acción obligatoria antes de release: reconciliar las ramas sin perder cambios de producción, volver a ejecutar Quality Gate y repetir QA/staging.


### Reconciliación de ramas completada — 7 Oct 2026
- ✅ Backup del `main` actual creado: `backup-main-2026-10-07-pre-reconcile`.
- ✅ Nueva rama de release creada desde `main`: `reconcile-main-beta-2026-10-07`.
- ✅ Funcionalidad beta Supabase portada sobre la historia actual de producción.
- ✅ Nomenclatura pública `Agente Cultural / Cultural Agent` preservada.
- ✅ Runtime antiguo `backend-runtime.js` retirado por quedar reemplazado por la integración beta.
- ✅ PR #3 abierto en draft y mergeable.
- ✅ ORIGEN Quality Gate del PR #3 finalizó con éxito.
- ⛔ Merge a `main` sigue bloqueado hasta completar el release gate.


### Browser/Auth hardening — 7 Oct 2026
- ✅ Removed legacy `oc-session` and local profile-follow state from Mundo Cultural.
- ✅ Mundo Cultural account/follow actions now use the Supabase-backed ORIGEN API.
- ✅ Public terminology standardised to `Agente Cultural / Cultural Agent` in the current beta UI.
- ✅ Trust Center browser-storage disclosure aligned with localStorage, Supabase session persistence and service-worker Cache Storage.
- ✅ Cloudflare-compatible security headers added in `_headers`.
- ✅ Auth callbacks require HTTPS outside localhost.
- ✅ Supabase Auth client prepared to accept CAPTCHA tokens for signup, login and password recovery.
- ⏳ CAPTCHA provider/widget + server-side enforcement remain blocked until an approved staging URL and provider keys exist.
- ⏳ Public Beta remains NO-GO; `main` and `origencultural.com` remain untouched.


### Staging package readiness — 7 Oct 2026
- ✅ Cloudflare Pages Free re-verified as suitable for static staging; Git integration supports branch/PR previews.
- ✅ Release build now uses explicit runtime whitelist via `npm run build:static`.
- ✅ `dist/` excludes Markdown, SQL, GitHub/agent/Replit development files.
- ✅ Release build rejects any `service_role` reference in deployable runtime text.
- ✅ GitHub Quality Gate #189 passed on the current deployable runtime + deterministic release evidence artifacts.
- ✅ Artifacts `origen-static-189` and `origen-release-evidence-189` generated: 26 public runtime files, 6.66 MB.
- ✅ Deterministic runtime content digest: `sha256:c30d180a021a99bc088d9fe0e915b4cb05be99e2ac594721d5832a5963f20adc`.
- ⏳ External Cloudflare Git authorization/project creation is the remaining step before a real HTTPS staging URL exists.
- ⛔ No custom domain changes and no merge to `main` yet.


### Accessibility, i18n and CSP hardening — 7 Oct 2026
- ✅ Critical Auth views (login, password recovery and reset) have ES/EN copy.
- ✅ Registration wizard and legal-consent flow have ES/EN copy while preserving canonical cultural-category values.
- ✅ Persistent shell/navigation/search/wellbeing copy updates with ES/EN and document language follows the active locale.
- ✅ Programmatic form label associations, visible keyboard focus, accessible icon controls and `aria-current` navigation baseline added.
- ✅ Runtime inline event handlers removed; strict CSP does not require `unsafe-inline` for scripts.
- ✅ No inline script blocks, `eval`, `new Function` or `javascript:` runtime schemes found in the source audit.
- ✅ Runtime file triggers/search actions/avatar fallback now use CSP-safe event listeners.
- ✅ User-editable profile text is escaped before HTML rendering in directory/search surfaces.
- ✅ Persisted media URLs pass through protocol allow-list sanitizers before rendering.
- ✅ Mundo Cultural live-agent mini cards now escape user data and sanitize media URLs.
- ⏳ Browser-level accessibility, keyboard, mobile/desktop and full ES/EN review still require deployed staging.
- ⏳ XSS attack-string testing with real persisted records remains a staging QA requirement.

- ✅ Mobile drawer focus management: dialog semantics, focus trap, Escape close and opener-focus restoration.

- ✅ Claim/report database integrity hardening: claims cannot self-declare approved, reports cannot self-declare resolved, anonymous inserts are denied, and least-privilege table grants are applied.
- ✅ Negative RLS verification executed against Production without persisting test rows.
- ✅ Supabase Security Advisor remains at 0 active security lints after the hardening migration.

- ✅ Social database hardening: profile role self-escalation blocked, post counters/editorial fields protected, comment identity protected and interactions limited to published content.
- ✅ Social table grants reduced to least privilege required by the current Beta client.
- ✅ Supabase Security Advisor remains at 0 active security lints after migrations `20261007140601` and `20261007140657`.

- ✅ Storage/privacy hardening: avatar/cover replacements use owned UID paths and old managed media is cleaned only after successful profile save.
- ✅ Bucket limits verified in Production: avatar 5 MB, cover 8 MB, post-media 50 MB with explicit MIME allowlists.
- ✅ Public Explorer profile enumeration blocked; only Cultural Agent profiles are public through `profiles`, while users retain access to their own row.
- ✅ Supabase Security Advisor remains at 0 active security lints after privacy migration `20261007141841`.
- ⏳ Two-account browser-level Storage ownership tests remain a staging QA requirement.

- ✅ PWA/cache hardening: service worker caches only same-origin public static assets/navigation, bypasses cross-origin/Auth requests and respects private/no-store/error responses.
- ✅ Smoke tests now fail if future commits reintroduce broad service-worker caching.
- ⏳ Installed-PWA/offline behaviour still requires staging/browser verification.

- ✅ Globe supply-chain hardening: `globe.gl@2.30.0`, `world-atlas@2.0.2` and `three-globe@2.45.3` resources are pinned; mutable `@master` fallback removed.
- ✅ CSP no longer allows the unused `raw.githubusercontent.com` origin.
- ⏳ Globe rendering/fallback still requires staging/browser verification across devices.

- ✅ Globe XSS hardening: country labels, cultural point labels, micro-story copy and cultural-card fields are escaped before HTML rendering; micro-story hrefs use a safe-scheme allow-list.
- ⏳ Visual globe behaviour remains part of browser/staging QA.


### Automated browser QA — 7 Oct 2026
- ✅ Separate GitHub workflow `ORIGEN Browser QA` added with pinned Playwright/Chromium.
- ✅ Browser QA #19 passed on the release candidate in real headless Chromium.
- ✅ Desktop anonymous checks cover home render, search dialog, Trust Center, ES/EN switching, persistent language preference, login labels and absence of uncaught JavaScript errors.
- ✅ Mobile checks cover drawer semantics, focus transfer, Escape close, focus restoration and registration rendering.
- ✅ PWA/cache browser checks verify service-worker activation, expected cache creation, same-origin-only cache entries and no Supabase/CDN/Auth responses in Cache Storage.
- ✅ A real mobile drawer Escape/focus race discovered by Chromium was fixed at source level.
- ✅ Browser QA workflow now uses concurrency cancellation and a Playwright browser cache to reduce redundant CI work.
- ⏳ This browser QA is anonymous/local-bundle QA; authenticated two-account E2E still requires deployed staging.

### Supabase browser-key review — 7 Oct 2026
- ✅ Release candidate, beta branch and current `main` use the modern Supabase `sb_publishable_...` browser key.
- ✅ The legacy `anon` JWT key is not referenced in the repository code search.
- ⏳ The legacy key remains enabled in Supabase for compatibility; disable/rotate only after deployed staging confirms no remaining external client depends on it.

- ✅ Automated Chromium Browser QA now covers desktop/mobile anonymous rendering, Trust Center, ES/EN login, programmatic labels, mobile-drawer focus management and service-worker cache privacy.
- ✅ Browser QA #17 and #18 passed after the initial workflow issues were corrected; the workflow is now part of release validation.
- ✅ Trigger-only `touch_updated_at()` direct RPC execution removed from browser roles; triggers remain active.
- ✅ Supabase Security Advisor remains at 0 active security lints after migration `20261007143630`.

- ✅ `touch_updated_at` direct execution restricted: `anon` and `authenticated` cannot invoke the trigger helper directly.
- ✅ Current release evidence: Quality Gate #154 + Browser QA #19 both SUCCESS; runtime content fingerprint remains `sha256:07c669ffa2f24065d718ca6926c238ad096787ab8033297381a1efa1a681bdcc`.

- ✅ Beta publishing roles aligned: Cultural Agents publish cultural/educational feed content; Explorers discover, follow, save, learn, comment and connect without a publicly enumerable profile or feed-post capability.
- ✅ Explorer post creation is blocked in UI, client API and Production RLS; future Explorer publishing requires a deliberate public-identity/privacy model.
- ✅ Supabase Security Advisor remains at 0 active security lints after migration `20261007144230`.


### CAPTCHA decision — 8 Oct 2026
- ✅ Preferred CAPTCHA provider selected for controlled beta: **Cloudflare Turnstile Free**.
- ✅ Supabase Auth supports Turnstile for sign-up, sign-in and password recovery.
- ✅ ORIGEN Auth client already accepts optional `captchaToken` values for those three flows.
- ✅ `CAPTCHA_INTEGRATION_PLAN.md` defines the safe activation order and $0 cost guard.
- ✅ `AUTH_PRODUCTION_CHECKLIST.md` and `RELEASE_QA_RUNBOOK.md` now reflect the Turnstile decision and required tests.
- ⏳ Turnstile widget/Site Key/Secret Key remain pending the exact Cloudflare Pages staging hostname.
- ⛔ Do not enable Supabase CAPTCHA enforcement or loosen CSP until the staging widget is producing valid tokens.


### Incident response & recovery — 8 Oct 2026
- ✅ `INCIDENT_RECOVERY_RUNBOOK.md` defines severity, containment, evidence preservation, credential response, code rollback, database recovery and post-incident review.
- ✅ Release Gate now requires recovery evidence before Public Beta.
- ✅ Code rollback uses a last-known-good GitHub commit/build; database schema history remains append-only with reviewed forward-fix migrations preferred.
- ⚠️ Supabase Free should not be treated as guaranteed PITR/dashboard recovery. A logical database backup must be created and verified outside the public repository before Public Beta.
- ⚠️ Database backups do not restore deleted physical Storage objects; media recovery/retention expectations remain a separate pilot requirement.
- ⏳ Actual pre-beta logical backup export and validation are still pending.

- ✅ Privacy-request/account-deletion baseline: Trust Center + own-profile contact route + `PRIVACY_REQUEST_RUNBOOK.md` are in place.
- ✅ Account deletion process accounts for Storage-owner cleanup first, Auth JWT/session caveat, database cascades and separate Cultural Agent profile review.
- ⏳ One full staging test-account deletion lifecycle remains required before Public Beta.

- ✅ Browser QA #54 passed on runtime head `19fd47a0712f4450602bc40f1e46b87688a210cb`, matching Quality Gate #189.
- ✅ Current release runtime includes Turnstile-ready public config, privacy/account-deletion request pathway and all prior accessibility/PWA/XSS hardening.
- ⚠️ GitHub branch-protection details and Security/Dependabot alert endpoints are not readable through the current integration; verify them manually before GO. Repository code search found no obvious service-role/secret/JWT/database-URL patterns on `main`.
