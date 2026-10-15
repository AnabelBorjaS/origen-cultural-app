# ORIGEN Cultural — Ecuador Pilot Playbook
**Versión:** 0.2 · 9 October 2026  
**Estado:** Preparación interna, no invitación pública ni compromiso comercial.  
**Responsable:** Fundadora / Dirección ORIGEN.  
**Regla de lanzamiento:** NO-GO hasta cumplir `RELEASE_GATE.md` y `RELEASE_QA_RUNBOOK.md`.

## 1. Qué vamos a validar

Piloto inicial propuesto con un máximo de **10 Agentes Culturales participantes** (meta de planificación, no usuarios registrados ni entidades confirmadas). Yaruquí, Ecuador, es un punto de partida histórico del proyecto, no una comunidad afiliada por defecto.

**Hipótesis a medir:**
1. Un Agente Cultural comprende y puede completar su perfil sin apoyo técnico intensivo.
2. Puede publicar contenido cultural con un propósito claro (por ejemplo historia, técnica, territorio, gastronomía), conservando el control de su contenido.
3. Un Explorador descubre, guarda, sigue, comparte de manera voluntaria o comenta historias culturales sin confundir perfiles de referencia con perfiles reclamados.
4. Podemos identificar qué historias despiertan interés genuino, qué facilita compartirlas y qué hace regresar a los Exploradores, sin comprar impresiones ni fabricar viralidad.
5. Se puede recopilar feedback útil y resolver reclamaciones, reportes y solicitudes de privacidad sin perjudicar a una comunidad.

**Alcance de la beta:** perfiles, historias, feed cultural, seguir, favoritos, guardar, comentarios, Pasaporte Cultural y reportes. **NO incluye reservas, cobros, promociones pagadas, comisiones, ventas, mensajería privada, certificación automática ni Academia operativa.** El acceso de Agentes y Exploradores Culturales es gratuito. La primera monetización futura será la **promoción opcional de perfiles/publicaciones**; más adelante podrán negociarse **comisiones de derivación por ventas atribuidas en webs oficiales de cada Agente Cultural**, sin checkout en ORIGEN. Ver `BUSINESS_MODEL.md`. El antiguo esquema 80/20 ya no es el modelo comercial vigente.

## 2. Orden de activación

| Etapa | Condición de entrada | Actividad | Evidencia |
|---|---|---|---|
| 0 — Preparación | Sin registro público | Mapa de contactos y entrevistas exploratorias fuera de la web; sin publicar datos ni fotos de terceros | Registro interno mínimo de conversaciones con permiso |
| 1 — Beta cerrada | Staging HTTPS + Auth/CAPTCHA/RLS/Storage/Trust + aprobación legal proporcional | Dos cuentas reales de QA, flujo de reclamación, eliminación y respaldo | QA completo en `RELEASE_QA_RUNBOOK.md` |
| 2 — Participantes piloto | Release GO de seguridad, permisos de contenido y capacidad de soporte | Invitar escalonadamente hasta 10 Agentes Culturales voluntarios | Consentimientos y perfiles aprobados por cada titular |
| 3 — Validación | Perfiles operativos | Aprendizaje, descubrimiento, feedback y acompañamiento | Métricas observables, incidencias y entrevistas |
| 4 — Decisión | Resultados y costes documentados | Corregir / continuar / detener / ampliar | Acta de decisión de la fundadora |

No presentar perfiles de referencia como verificados, activos, aliados ni participantes sin autorización expresa.

## 3. Proceso manual de onboarding por participante

**Antes de crear el perfil:**
- Identificar a la persona responsable y su capacidad para representar a su iniciativa. La representación de una comunidad entera no se presume por crear una cuenta.
- Explicar en español claro qué funciones existen hoy y cuáles están previstas para futuras versiones.
- Solicitar consentimiento informado y diferenciado para texto, fotografías, videos, nombre comercial y enlaces de contacto; registrar fecha, alcance, crédito y autorizaciones relevantes.
- Dar opción de participar sin divulgar conocimientos ceremoniales, restringidos, sagrados o sensibles. Pedir aprobación comunitaria cuando sea necesaria.
- Verificar que no se divulguen datos personales de terceros ni imágenes de menores sin autorizaciones y garantías aplicables.

**Durante el onboarding:**
1. La persona crea y controla su propia cuenta, usando su correo y contraseña; el equipo ORIGEN no solicita contraseñas.
2. Completa identidad, territorio y descripción; confirma y edita el texto antes de publicar.
3. Elige un propósito cultural auténtico, publica una pieza de prueba autorizada y revisa la visualización móvil.
4. Revisa quién puede ver la información y cómo reportar, corregir o solicitar retirada.
5. Recibe una explicación breve de cómo contactar al soporte: `info.origencultural@gmail.com`.

**Después:**
- Solicitar feedback sin presionar: claridad del registro, publicación, seguridad y confianza.
- Registrar incidencias con severidad y sin copiar datos sensibles al repositorio público.
- Atender retirada o corrección del contenido siguiendo el procedimiento de privacidad, sin prometer eliminación instantánea de copias o respaldos.

### Observación móvil antes de invitar al piloto

**Aplicable únicamente después de superar el Release Gate.** Preparar una sesión acompañada de prueba con teléfono y una cuenta de ensayo autorizada, sin pedir a la persona que comparta su contraseña.

1. Observar si identifica correctamente **Agente Cultural** y distingue su representación personal de la representación formal de una comunidad.
2. Solicitar que complete país, ciudad e historia cultural en su propio lenguaje; comprobar que pueda retroceder sin perder campos.
3. Explicar que foto y portada son **opcionales**. Antes de seleccionar archivos, confirmar derechos de uso de imagen y consentimiento de personas retratadas.
4. Permitir que elija categorías y explique lo que ofrece sin sugerir contenidos culturalmente restringidos. No introducir servicios pagados ni reservas en esta beta.
5. Pedir que revise enlaces de contacto y la versión de documentos legales con calma; la aceptación debe realizarla personalmente, sin presión.
6. Medir tiempo de registro y bloqueos reales **sin registrar credenciales, respuestas sensibles o nombres de comunidades** en GitHub.
7. Detener la sesión y registrar un problema si surgen alertas de privacidad, autorización o contenidos que no deban divulgarse.

La regresión automática móvil de **390px** cubre pasos y navegación, pero **no** sustituye observación humana, pruebas de accesibilidad en dispositivos reales ni control legal de registro desde Supabase Auth.

## 4. Entrevista de descubrimiento (15–20 minutos)

Preguntas sugeridas — no son resultados recopilados:
1. ¿Qué historia o conocimiento te gustaría compartir con personas de otros países?
2. ¿Qué contenido prefieres **no** compartir y quién debe autorizarlo?
3. ¿Con qué frecuencia tendrías tiempo de publicar sin que esto altere tu actividad principal?
4. ¿Qué idiomas y formatos (foto, video, texto descriptivo) te serían más cómodos?
5. ¿Qué necesitarías ver para confiar en ORIGEN y recomendarlo?
6. ¿Qué tipo de videos, fotos o historias culturales te gustaría que otros compartieran espontáneamente y por qué?
7. ¿Qué ayudaría a que los Exploradores descubrieran y compartieran tu contenido sin necesitar publicidad pagada?
8. ¿Qué comentarios o interacciones de los Exploradores te harían sentir que ORIGEN aporta valor real?

**No preguntar por precios de anuncios ni comisiones en esta primera entrevista de crecimiento.** Estudiar monetización en una etapa posterior, solo cuando exista comunidad activa y resultados orgánicos. Ver `ORGANIC_COMMUNITY_GROWTH_PLAN.md`.

## 5. Indicadores propuestos (no métricas actuales)

| KPI | Definición | Meta inicial propuesta |
|---|---|---|
| Consentimiento trazable | Participantes con autorización documentada para lo publicado | 100% |
| Activación cultural | Participantes registrados que completan perfil **y** una publicación cultural autorizada | 7 de 10 |
| Tiempo de onboarding | Tiempo real por cuenta, incluyendo asistencia | Medir mediana; sin objetivo previo artificial |
| Experiencia inicial | Participantes que indican entender privacidad/reportes al final del onboarding | 8 de 10 |
| Seguridad | Incidentes de exposición de datos / propiedad cruzada confirmados | 0 |
| Retención cualitativa | Participantes que desean continuar tras 30 días | Medir, no asumir |
| Ingresos reales | Cobros de promociones, ventas o comisiones | 0: no hay cobros habilitados en la beta |
| Exploradores de prueba | Personas que aceptan voluntariamente explorar una beta cerrada tras pasar el Release GO | Cohorte propuesta de 30–50; no son usuarios existentes |
| Descubrimiento orgánico | Exploradores que realizan alguna interacción voluntaria (seguir, guardar, comentar) | Medir línea base real, sin estimar tracción inexistente |
| Compartir historias | Voluntad de compartir enlaces a contenidos autorizados | Medir solo con mecanismos respetuosos de privacidad |
| Retorno de Exploradores | Personas que regresan a explorar dentro de 7 y 30 días | Medir línea base antes de fijar metas de crecimiento |
| Interés comercial futuro | No se ofrece ni se cobra publicidad mientras no exista audiencia activa | Fuera de las metas del piloto |

Estos umbrales son **criterios de trabajo sugeridos**, no compromisos con patrocinadores ni resultados obtenidos.

## 6. Resguardo cultural y reputacional

- El titular del contenido mantiene sus derechos; ORIGEN no debe presentarse como dueño del conocimiento tradicional.
- Un consentimiento individual **no** sustituye permisos colectivos cuando existen derechos o protocolos culturales colectivos.
- Nunca publicar un perfil de referencia como «reclamado», «verificado» o «aliado» sin el proceso correspondiente.
- No presentar el antiguo reparto 80/20 como plan vigente: el modelo acordado es acceso gratuito, promociones opcionales y posibles acuerdos de comisiones por ventas externas verificables a futuro. Nunca cobrar en la beta ni representar un clic como una venta.
- No usar testimonios, logos de instituciones o datos de impacto sin permiso verificable.
- Las condiciones legales deben revisarse para los países/mercados concretos; no afirmar inmunidad legal mundial.

## 7. Capacidad y costes

**Objetivo operativo:** herramientas gratuitas en la fase de prueba y carga de soporte compatible con una dirección unipersonal. No activar integraciones pagas, servicios transaccionales ni proveedores externos sin aprobación explícita del costo y necesidad.

Registrar tiempo de acompañamiento por perfil y costes directos/in-kind desde el inicio; servirán para decidir cuándo el negocio puede ser sostenible. No comprometer plazos de respuesta de soporte que todavía no puedan cumplirse.

## 8. Bloqueadores y siguiente acción

- **P0:** desplegar staging HTTPS Free (GitHub issue #5); obtener autorización Cloudflare/GitHub.
- **P0:** pasar Auth, email, Turnstile, aislamiento RLS con dos cuentas, Storage, reclamaciones, reportes y eliminación.
- **P0:** tener revisión legal proporcional y una estrategia de respaldo/recuperación verificada.
- **P1:** completar plantilla de consentimiento/autorización cultural y protocolo de atención.
- **P1:** mapear 10 candidatos potenciales sin subir datos personales al repositorio.

**Prohibido cambiar `main`, migrar `origencultural.com`, invitar indiscriminadamente, cobrar o etiquetar a aliados hasta que el release gate correspondiente esté aprobado.**
