# ORIGEN Cultural — Public Beta QA Runbook

Status: **NO-GO until Critical/High checks pass**
Candidate branch: `reconcile-main-beta-2026-10-07`
Release PR: **#3**
Last updated: 9 October 2026

## Test accounts

Use two independent real test accounts:

- **Account A:** Explorer
- **Account B:** Agente Cultural / Cultural Agent

Never reuse the same browser session to prove cross-account isolation. Use separate browser profiles/devices where practical.

## P0 — Auth and session

| Test | Expected result | Status |
|---|---|---|
| A signs up with explicit legal consent | Signup accepted; legal acceptance recorded | ⬜ |
| Signup without legal consent | Client refuses signup | ⬜ |
| Email confirmation | Confirmation succeeds only via approved redirect | ⬜ |
| Login before/after confirmation | Matches configured verification policy | ⬜ |
| Logout | Session removed | ⬜ |
| Password recovery | Approved recovery link works | ⬜ |
| Session on second device | Same account/data available after login | ⬜ |
| Invalid/expired links | Safe error; no session created | ⬜ |

## P1 — Compartir historias culturales sin cuenta (issue #10)

| Prueba | Resultado esperado | Estado |
|---|---|---|
| Compartir una publicación | URL exacta `#publicacion/<UUID>`, nunca el feed genérico | ✅ Código + Chromium mock #197 |
| Abrir URL anónima | Carga su publicación pública, autoría y contexto sin pedir login | ✅ Chromium mock; ⬜ staging real |
| ID malformado/inyección | No consulta el backend ni revela material de otras publicaciones | ✅ Node mock + Chromium mock; ⬜ API real |
| Publicación no publicada o eliminada | Respuesta de indisponible sin título/medios anteriores | ✅ Node mock + Chromium mock; ⬜ staging real |
| Cuenta A/B y API directa | RLS bloquea lectura de borradores/retiradas ajenas | ⬜ **P0 de seguridad pendiente** |
| Compartir con teléfono/WhatsApp/redes | Enlace abre destino real; decidir si hacen falta tarjetas OG individuales | ⬜ dispositivos reales, proyecto no desplegado |
| Lectura ES/EN y viewport de 390 px | Página traducida sin desbordes | ✅ Chromium mock; ⬜ dispositivo real |
| Moderación | Ocultar un contenido invalida su permalink público según backend | ⬜ bloqueo P0 issue #8 |
| Permisos culturales | Declaración exigida y auditable server-side antes de publicaciones públicas | ⬜ bloqueo P0 issue #7 |

Estas pruebas automatizadas no prueban la política real de Supabase ni que proveedores sociales generen previsualizaciones dinámicas. Mantener **Public Beta NO-GO** hasta completar seguridad, Consentimiento y QA real.

## P0 — Media pública y retirada completa (issues #8 y #12)

**Hecho auditado:** el bucket `post-media` de Supabase Production es público. Despublicar una fila con `is_published=false` no elimina la URL pública del objeto. **Esto exige validación real y un protocolo operativo antes del piloto.**

| Prueba | Resultado exigido | Estado |
|---|---|---|
| Cuenta A elimina post propio con imagen/video de `post-media` | Se borra el post A y se confirma eliminación Storage del archivo exacto | ✅ Node mock; ⬜ staging Storage real |
| `media_urls` + `image_url` heredado | Se rastrean ambos, sin borrar dos veces el mismo archivo | ✅ Node mock; ⬜ staging |
| Storage falla tras borrar el post | La UI advierte retirada parcial; incidente queda pendiente de atención humana | ✅ Node mock; ⬜ flujo admin real |
| Cuenta A intenta eliminar medio B | RLS y propiedad de Storage lo bloquean, sin filtrar medios | ✅ Node mock; ⬜ staging A/B |
| Moderador recibe solicitud legítima | Puede ocultar, retirar medios autorizados, registrar decisión y permitir revisión | ⬜ P0 #8/#12 |
| Anónimo abre permalink de publicación oculta | No recibe título, medio ni perfil relacionado no publicado | ✅ mock; ⬜ RLS real |
| Alguien conoce URL pública de medio de post oculto | Se reconoce que puede seguir descargando hasta borrar objeto | ✅ riesgo documentado; ⬜ prueba real |
| Medio borrado y copia en caché | Se verifican efectos CDN y se explica imposibilidad de retirar copias externas | ⬜ staging / políticas |
| Usuarios no reportan voluntariamente | Sigue habiendo canal privado de retirada y protección a menores | ⬜ moderación operativa |

**Nunca declarar «eliminado por completo de Internet» ni prometer revocación inmediata de cachés.** Ver `PUBLIC_MEDIA_WITHDRAWAL_SAFETY.md`. El release sigue NO-GO.

## P0 — Seguridad del reporte autenticado

| Prueba | Resultado esperado | Estado |
|---|---|---|
| Cuenta A reporta una publicación | `reporter_user_id` se deriva de la sesión A, con referencia y motivo seleccionados | ✅ mock Node + Chromium #170; ⬜ staging real |
| Intentar reportar sin sesión | Cliente no emite INSERT, propone iniciar sesión | ✅ mock Node; ⬜ navegador real |
| Origen de reporte indica cuenta B durante sesión A | Rechazo antes de INSERT | ✅ mock Node; ⬜ staging real |
| Inyectar motivo arbitrario/ID inválido/contexto mayor a 6000 caracteres | Rechazo antes de INSERT | ✅ mock Node; ⬜ backend |
| Cambiar de cuenta con reporte abierto | El diálogo se cierra y borra texto y destino antiguos | ✅ código; ⬜ navegador multiusuario real |
| Completar INSERT y cambiar a B antes de respuesta | La respuesta se atribuye a A; no aparece como resultado en la interfaz de B | ✅ mock Node + guardia UI; ⬜ staging |
| A intenta consultar los reportes de B | RLS lo deniega incluso por REST directa | ⬜ **P0 pendiente de verificación** |
| Envíos masivos o repetidos sin respetar el frontend | Backend aplica protección antiabuso y límites adecuados | ⬜ **P0 pendiente de implementar/verificar** |
| Equipo autorizado modera y responde | Decisión trazable sin exposición pública de denunciante ni clave privilegiada en frontend | ⬜ issue #8 |

El reporte autenticado **solo** utiliza controles de navegador en estas pruebas: los sistemas y permisos reales de moderación no se consideran verificados hasta superar las pruebas de backend aislado.

## P0 — Retirada y corrección solicitada por titulares sin cuenta

| Comprobación | Resultado esperado | Estado |
|---|---|---|
| Entrar a `#solicitar-revision` sin sesión | Formulario de derechos visible, sin forzar registro | ✅ código y prueba Chromium; ⬜ cuentas/dispositivos reales |
| Acceder desde la publicación `post/ID` | Referencia de ID exacta, sin acusar a otra publicación | ✅ código y prueba Chromium; ⬜ staging |
| Acceder desde perfil de referencia | Enlace contextual y descripción no oficial preservados | ✅ código y prueba Chromium; ⬜ revisión humana |
| Generar correo | Mailto dirigido solo a contacto oficial con motivo, referencia y resumen | ✅ código y prueba Chromium; ⬜ app de correo real |
| No pulsar Enviar desde aplicación de correo | ORIGEN no asegura recepción ni abre ticket | ✅ indicación explícita en UI; ⬜ pruebas manuales |
| Cambiar detalle o motivo tras preparar correo | Se oculta y elimina enlace antiguo, hasta nueva preparación | ✅ código y prueba Chromium; ⬜ móvil real |
| Idiomas ES/EN y 390px | Etiquetas, prevención de falsas promesas y ausencia de overflow | ✅ código y prueba Chromium; ⬜ accesibilidad manual |
| Enviar reporte autenticado | Supabase guarda y restringe lectura a usuario correcto según RLS | ⬜ prueba con dos cuentas de staging |
| Moderación humana, retirada, apelación y bitácora | Operadores autorizados, respuesta trazable y datos restringidos | ⬜ P0 issue #8; no implementado |

**Advertencia:** generar `mailto:` no equivale a enviar un correo, recibir una denuncia ni gestionar un ticket. No invitar usuarios al piloto antes de activar y verificar el circuito humano de revisión y retirada descrito en `CONTENT_REVIEW_OPERATIONS.md`.

## P0 — Declaraciones culturales antes de publicar

| Caso | Resultado esperado | Estado |
|---|---|---|
| Publicar foto/video sin marcar ningún permiso | No se sube archivo ni se envía INSERT | ✅ Browser QA simulado #153; ⬜ staging |
| Solo marcar derechos de medios, no divulgación cultural | No se sube contenido | ✅ Browser QA simulado #153; ⬜ staging |
| Confirmar ambos permisos y cambiar la descripción | Se desmarcan ambos; hace falta volver a confirmarlos | ✅ Browser QA simulado #153; ⬜ móvil real |
| Confirmar ambos permisos y reemplazar video | Se desmarcan ambos; no se reutiliza el consentimiento para otro archivo | ✅ Browser QA simulado #153; ⬜ móvil real |
| Intentar `createPost` desde cliente sin ambas declaraciones | Rechazo antes de INSERT | ✅ prueba aislada; ⬜ revisión de backend |
| Intentar un INSERT directo a Supabase sin declaraciones válidas | Backend lo debe rechazar y registrar las aceptaciones aprobadas de forma trazable | ⬜ **P0 pendiente de diseño e implementación en staging** |
| Compartir imágenes de terceros, menores o conocimiento restringido | Tener autorizaciones específicas y mecanismo de reporte/retirada; ninguna declaración equivale a verificación oficial | ⬜ verificación operacional y legal |

**No anunciar este control del navegador como prueba legal de permisos.** El frontend no registra evidencias inmutables y se puede eludir si se llama al backend directamente. Mantener Public Beta en **NO-GO** hasta superar el control servidor y el proceso de moderación correspondiente.

## P0 — Transparencia pública de perfiles y representación

| Comprobación | Resultado esperado | Evidencia |
|---|---|---|
| Las cuatro referencias editoriales están en el directorio | Cada una muestra el estado "Referencia editorial", no "verificado" | ✅ lógica y test Chromium incluidos; ⬜ piloto real |
| Visitar `#perfil/pakarina` | Aviso visible de perfil no oficial, no gestionado ni verificado por la entidad mencionada | ✅ lógica y test Chromium incluidos; ⬜ evaluación humana |
| Solicitar gestión de una referencia | Enlace a `#reclamar/pakarina`; sin transferencia automática de cuenta o legitimidad | ✅ enlace y flujo; ⬜ autoridad real |
| Cuenta autogestionada de Agente Cultural | Estado "Cuenta sin verificar", sin distintivo de verificación o reclamo de referencia | ✅ test Chromium simulado; ⬜ cuenta real |
| Cambiar a inglés | Estado de cuenta autogestionada y aviso de responsabilidad traducidos | ✅ test Chromium simulado; ⬜ evaluación humana |
| Revisar información de representación en el perfil | Estado del detalle concuerda con la tarjeta, sin falso "En proceso" | ✅ lógica y test Chromium incluidos; ⬜ evaluación humana |
| Señal real de verificación | No asignar insignia por rol ni por una declaración del usuario; revisión autorizada y auditada en servidor | ⬜ backend y pruebas con usuarios reales |

Los perfiles de referencia son muestras editoriales, **no participantes reclutados**, organizaciones aliadas ni comunidades que hayan cedido representación. Deben contar con las autorizaciones necesarias antes de un lanzamiento público.

## P1 — Onboarding cultural móvil (390px)

| Caso | Resultado exigido | Estado |
|---|---|---|
| Agente Cultural elige su tipo de cuenta y datos básicos | Paso 1 y 2 fáciles de completar en móvil, sin desplazamiento horizontal | ✅ Chromium simulado #140; ⬜ personas reales |
| Se pulsa Enter en el campo País/ciudad | Se avanza a fotos sin recargar ni borrar el borrador | ✅ Chromium simulado #140; ⬜ móvil real |
| Se vuelve del paso de fotos a los datos básicos | Nombre, correo, país y contraseña ingresados siguen disponibles en el mismo asistente | ✅ Chromium simulado #140; ⬜ móvil real |
| Se intenta usar un PDF como avatar | Rechazo claro y sin generar vista previa del archivo | ✅ Chromium simulado #140; ⬜ móvil real |
| Se selecciona un JPG válido | Se previsualiza correctamente | ✅ Chromium simulado #140; ⬜ Storage real |
| Se retrocede desde historia a fotos y se vuelve a historia | Se preservan historia, servicios y categorías culturales | ✅ Chromium simulado #140; ⬜ participante |
| Se retrocede desde redes y aceptación legal | Se conservan el enlace y el consentimiento marcado explícitamente | ✅ Chromium simulado #140; ⬜ participante |
| Se pulsa Crear perfil sin consentimiento | No debe producirse cuenta; el backend lo exige | ⬜ requiere staging y hook P0 |

**Alcance:** no se ejecutó un registro real, no se almacenaron fotos en Storage, no se comprobó RLS ni se invitó a comunidades reales. El lanzamiento público permanece bloqueado.

## UX — Redacción y vista previa del Agente Cultural

| Prueba | Resultado esperado | Estado |
|---|---|---|
| Escribir un título y detenerse al menos 400 ms | El foco y la posición del cursor permanecen en el campo | ✅ Chromium simulado #134; ⬜ participantes reales |
| Seguir escribiendo después de ver la vista previa | Ningún carácter se pierde y el título completo queda en el formulario | ✅ Chromium simulado #134; ⬜ participantes reales |
| Escribir una descripción cultural y detenerse | El campo mantiene el foco y la vista previa refleja el contenido | ✅ Chromium simulado #134; ⬜ participantes reales |
| Cambiar el tipo de publicación de foto a video | El borrador textual sigue intacto | ✅ Chromium simulado #134; ⬜ participantes reales |
| Seleccionar un archivo video/webm | Aparecen un elemento `video` con controles y la vista previa de la publicación; no una imagen rota | ✅ Chromium simulado #134; ⬜ video real staging |
| Usar controles de reproducción | No abre accidentalmente el selector de archivos | ✅ Chromium simulado #134; ⬜ táctil móvil |
| Publicar un video real desde una cuenta Agente Cultural | Subida permitida por Storage, persistencia con RLS y reproducción verificada | ⬜ staging, NO probado |

La aprobación de interfaz **no implica** que las subidas reales de video o las políticas de Storage/RLS se hayan probado.

## P0 — Identidad durante subida y guardado

| Escenario | Resultado esperado | Evidencia |
|---|---|---|
| A inicia edición de perfil y B inicia sesión antes de guardar | No se envía la edición de A sobre el perfil de B | ✅ cliente aislado; ⬜ staging real |
| A inicia publicación, B reemplaza sesión durante la subida | Ninguna publicación de A aparece bajo B por reuso accidental de caché | ✅ validación y pruebas aisladas; ⬜ staging |
| Guardado de perfil de A ya confirmado pero responde tras login de B | Resultado de A no reemplaza caché de B; no se presenta como guardado fallido si el servidor lo confirmó | ✅ cliente aislado; ⬜ staging |
| Inserción válida de A responde tras login de B | No refresca listas desde la sesión anterior ni sugiere duplicar la publicación | ✅ cliente aislado; ⬜ staging |
| Subida avatar exitosa + portada fallida | Eliminación del avatar temporal sin referencia, sin actualizar perfil | ✅ navegador simulado #129; ⬜ Storage real |
| Error de permisos/RLS al limpiar medio temporal | Conservar error para soporte y revisar limpieza de huérfanos; nunca eliminar archivos de terceros | ⬜ staging |
| Fallo de guardado tras dos subidas válidas | Se intenta limpiar los dos medios recién cargados; nunca fotos antiguas aún referenciadas | ✅ lógica de recuperación; ⬜ staging |

Estas pruebas **no** prueban permisos de Storage ni RLS en una cuenta real. La revisión de backend sigue bloqueando la beta pública.

## P0 — Privacidad entre cuentas en dispositivos compartidos

| Prueba | Resultado esperado | Evidencia |
|---|---|---|
| Agente A deja título e imagen de borrador, cierra sesión, Agente B entra en el mismo navegador | B ve editor limpio, sin título/imagen/archivo de A | ✅ Chromium simulado Browser QA #111; ⬜ dos cuentas reales staging |
| A abandona edición de perfil y cierra sesión | Archivos temporales de avatar/portada y sus vistas previas se liberan | ✅ limpieza en cliente; ⬜ staging real |
| Cierre de sesión desde otra pestaña mientras se muestra «Crear publicación» | Formulario privado deja de mostrarse y se redirige a pantalla pública | ✅ Chromium simulado Browser QA #111; ⬜ staging real |
| Intento fallido de cierre de sesión | La interfaz no da a entender que la sesión terminó | ✅ test aislado Auth; ⬜ staging real |
| Cambio de tipo foto/video/carrusel | No se reutilizan archivos seleccionados para otro tipo de publicación | ✅ limpieza en cliente; ⬜ navegador con media real |

**Importante:** la simulación no comprueba revocación de tokens JWT ni aislamiento de Supabase RLS. Los controles del servidor siguen siendo P0 independientes.

## P0 — Eventos concurrentes de autenticación (nuevas regresiones)

| Escenario | Control esperado | Estado |
|---|---|---|
| Una respuesta lenta de `getSession` llega después de `SIGNED_OUT` | No restaura la cuenta cerrada | ✅ prueba aislada; ⬜ staging real |
| Dos solicitudes de restauración se resuelven al revés | La respuesta antigua no sobrescribe la nueva | ✅ prueba aislada; ⬜ staging real |
| A consulta favoritos/seguidos/likes/guardados y cambia a B antes de recibir respuesta | Los datos privados de A no se incorporan al caché de B | ✅ prueba aislada; ⬜ staging real |
| `TOKEN_REFRESHED` para la misma cuenta durante restauración | La sesión legítima continúa activa | ✅ prueba aislada; ⬜ staging real |
| Dos eventos UI de Auth simultáneos llegan fuera de orden | La vista privada pertenece solamente a la última sesión | ✅ caso Chromium simulado; ⬜ staging real |
| `INITIAL_SESSION` interrumpe el inicio de la aplicación | La interfaz carga correctamente sin volver al usuario anterior | ✅ guardia de concurrencia; ⬜ staging real |

Las pruebas con simulaciones **no reemplazan** la verificación real de Supabase Auth, RLS ni revocación de sesiones en múltiples dispositivos. Mantener NO-GO mientras falte staging.

## P0 — Registro completado vs fallos posteriores

Una cuenta creada con éxito no debe registrarse por segunda vez si fallan una imagen opcional o un paso de configuración.

| Prueba | Resultado esperado | Estado |
|---|---|---|
| Signup sin imágenes | Cuenta creada y redirección correcta | ⬜ staging |
| Signup con avatar y portada válidos (sin email confirmation pendiente) | Medios guardados y asociados únicamente al nuevo usuario | ⬜ staging |
| Signup con avatar inválido/error de Storage | Cuenta existente; aviso de foto opcional; no se vuelve a llamar a signup | ✅ navegador simulado #85; ⬜ staging real |
| Avatar se sube y luego falla portada o guardado de perfil | Archivos subidos sin asociar se limpian o se registra incidencia; cuenta sigue existente | ⬜ staging |
| Email confirmation requerida | No intentar uploads antes de confirmar; explicar cómo añadir fotos después | ⬜ staging |
| Cargar perfil tras signup falla | Mostrar cuenta creada sin prometer perfil preparado; permitir iniciar sesión | ⬜ staging |

La prueba de navegador `tests/browser-smoke.mjs` usa un cliente simulado: **no** equivale a un test de Storage/RLS real.

## P0 — Obligación de consentimiento en Auth (servidor)

| Intento | Resultado esperado | Evidencia |
|---|---|---|
| Registro web con checkbox aceptado | Account creada; aceptación versionada del servidor | ⬜ pendiente staging |
| Signup directo a Supabase Auth sin indicador legal | No crear `auth.users`, ni `profiles` | ⬜ pendiente implementación backend |
| Signup directo con `false`, `null`, `"true"` | Rechazo por backend incluso sin web | ⬜ pendiente implementación backend |
| Signup con versión manipulada | Se almacena exclusivamente versión aprobada por servidor | ⬜ pendiente implementación backend |
| Registro existente y recuperación de contraseña | Sin bloqueos regresivos | ⬜ pendiente staging |
| Rutas de invitación/admin | Definidas explícitamente; sin bloqueo accidental | ⬜ pendiente decisión |

La protección estricta `acceptedLegal === true` del cliente **no** cierra este bloqueo. Documento de revisión: `BACKEND_CONSENT_REVIEW.md`.

## P0 — CAPTCHA / bot protection

Provider: **Cloudflare Turnstile**

| Test | Expected result | Status |
|---|---|---|
| Signup with valid token | Auth request succeeds subject to normal validation | ⬜ |
| Signup without token after enforcement | Rejected safely | ⬜ |
| Login with valid token | Auth request succeeds subject to credentials | ⬜ |
| Login without/invalid token | Rejected safely | ⬜ |
| Password recovery with valid token | Recovery request accepted | ⬜ |
| Expired/reused token | Rejected; user can retry | ⬜ |
| Widget/network failure | Accessible retry/error state; no silent lockout | ⬜ |
| ES/EN challenge/error state | Understandable in both languages | ⬜ |

Do not mark this section PASS until the widget is tested **before and after** Supabase CAPTCHA enforcement.

## P0 — RLS / cross-user isolation

With A and B authenticated separately:

| Attempt | Expected result | Status |
|---|---|---|
| A edits A profile | Allowed | ⬜ |
| A edits B user-owned data | Denied / zero rows changed | ⬜ |
| B edits B normal cultural profile fields | Allowed | ⬜ |
| B changes own `status` to verified | **Denied** | ⬜ |
| B changes `verified_at` | **Denied** | ⬜ |
| B changes `follower_count` directly | **Denied** | ⬜ |
| A reads B private claim/report data | Denied | ⬜ |
| Public visitor reads published cultural profile/post | Allowed | ⬜ |

## P0 — Storage

### Valid media
- [ ] Avatar JPG/PNG/WEBP ≤ 5 MB uploads.
- [ ] Cover JPG/PNG/WEBP ≤ 8 MB uploads.
- [ ] Post media allowed image/video type ≤ 50 MB uploads.
- [ ] Uploaded file belongs to authenticated user's folder.
- [ ] Owner can delete own media.

### Negative tests
- [ ] Unsupported MIME type is rejected.
- [ ] Oversized avatar is rejected.
- [ ] Oversized cover is rejected.
- [ ] Oversized post media is rejected.
- [ ] A cannot overwrite/delete B's media.
- [ ] Path manipulation cannot escape the user's folder.
- [ ] Filename cannot inject executable HTML/JS into the UI.

## P0 — Claims and verification

- [ ] A reference profile is visibly identified as unclaimed/reference.
- [ ] Authenticated user can submit a valid claim.
- [ ] Claim requires authority declaration.
- [ ] User cannot claim an already-owned profile.
- [ ] Claim does **not** automatically grant ownership.
- [ ] Pending claim can be withdrawn only by claimant.
- [ ] Approval requires privileged ORIGEN admin flow.
- [ ] Approved claim assigns ownership and verified status only through the privileged path.

## P0 — Reports and abuse prevention

- [ ] Authenticated user can submit a report.
- [ ] Reporter can read only their own report.
- [ ] Another normal user cannot read it.
- [ ] Post spam limit triggers after configured threshold.
- [ ] Comment spam limit triggers after configured threshold.
- [ ] Claim spam limit triggers after configured threshold.
- [ ] Report spam limit triggers after configured threshold.
- [ ] UI handles rate-limit errors without exposing internals.

## P1 — Core social journey

- [ ] Discover cultural profiles.
- [ ] Follow / unfollow.
- [ ] Favourite / unfavourite.
- [ ] Create cultural post.
- [ ] Agente Cultural post requires cultural purpose.
- [ ] Agente Cultural cannot submit text-only post.
- [ ] Like / unlike.
- [ ] Save / unsave.
- [ ] Comment.
- [ ] Infinite feed loads the next page without duplicate posts.
- [ ] Video pauses/behaves correctly when not visible.
- [ ] Refresh preserves server-backed actions.

## P1 — Cultural Passport & wellbeing

- [ ] Passport displays expected collections/countries/categories.
- [ ] Progress is not awarded merely for screen time.
- [ ] 120-minute wellbeing setting is described as a product default, not a medical rule.
- [ ] Reminder is dismissible/voluntary.
- [ ] User progress is not lost for taking a break.

## P1 — Trust / privacy

- [ ] Trust Center is reachable from the product.
- [ ] Beta scope accurately says no payments/bookings/payouts/private messaging.
- [ ] Supabase Auth/database/storage use is disclosed.
- [ ] Browser storage inventory matches actual product.
- [ ] No optional advertising/marketing analytics execute before required consent.
- [ ] Cultural Rights guidance is visible.
- [ ] Reporting/copyright route is usable.

## P1 — UX / compatibility

Test at minimum:
- mobile portrait;
- tablet;
- desktop;
- current Chrome;
- current Safari;
- current Firefox or Edge where available.

Checks:
- [ ] ES complete.
- [ ] EN complete.
- [ ] Keyboard navigation for key flows.
- [ ] Visible focus states.
- [ ] Meaningful labels for forms.
- [ ] Loading states.
- [ ] Empty states.
- [ ] Error states.
- [ ] Broken-link scan.
- [ ] Images/video do not overflow small screens.
- [ ] Contrast and text legibility reviewed.

## Severity rules

**Critical:** data exposure, account takeover, cross-user write, secret leakage, verification bypass, destructive data loss.

**High:** core Auth broken, uploads unsafe, claims/reporting broken, major mobile blocker, Trust materially inaccurate.

**Medium:** important UX/localisation/accessibility defect without security/data loss.

**Low:** cosmetic/polish issue.

Public Beta requires:
- **0 open Critical**
- **0 open High**
- documented decision for remaining Medium/Low issues.

## Final GO checklist

- [ ] PR #3 Quality Gate green.
- [ ] Auth production checklist complete.
- [ ] Two-account RLS tests complete.
- [ ] Storage negative tests complete.
- [ ] Claims/report tests complete.
- [ ] Staging verified.
- [ ] Trust/legal proportional review complete.
- [ ] Rollback path confirmed.
- [ ] Final CEO GO decision recorded.


## P1 — Service worker / PWA privacy

- [ ] Install/open staging as PWA where supported.
- [ ] Confirm ORIGEN shell/static assets work offline as expected.
- [ ] Confirm Supabase/Auth/network data is **not** served from Cache Storage.
- [ ] Confirm logout does not expose authenticated data from offline cache.
- [ ] Confirm a new deployment updates app JS/CSS without requiring manual cache clearing.
- [ ] Confirm private/no-store responses are not stored by the service worker.


## CI role simulation vs real-account QA
- Browser QA simulates Explorer and Cultural Agent UI states locally to verify navigation and Beta publishing scope.
- The simulation does **not** authenticate against Supabase and does **not** replace two-account RLS testing.
- Required staging evidence still includes: real Explorer signup/login, real Cultural Agent signup/login, creator post creation, Explorer post denial, cross-user write denial, Storage ownership denial and claim/report isolation.
- A release item may be marked complete only when the evidence type matches the control being tested (UI simulation, browser deployment test, or real Supabase authorization test).
