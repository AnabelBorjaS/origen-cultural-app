# ORIGEN Cultural — Protocolo de solicitudes de revisión, corrección y retirada

**Fecha:** 9 de octubre de 2026  
**Estado:** Protocolo operativo propuesto. Sin equipo de moderación activo ni promesa de tiempo de respuesta.  
**Contacto visible:** info.origencultural@gmail.com  
**Lanzamiento público:** **NO-GO** mientras persistan los controles críticos de seguridad, legal y moderación.

## 1. Alcance real del producto

**Implementado en la beta (código no publicado):**
- Un usuario autenticado puede reportar una publicación desde el cuadro existente de reportes; su registro se intenta guardar en `moderation_reports` de Supabase, condicionado a Auth/RLS y disponibilidad real.
- Cualquier persona, incluso sin cuenta, puede abrir la página pública `#solicitar-revision`, llegar desde una publicación o perfil, seleccionar el motivo, describir el problema y **preparar** un correo a `info.origencultural@gmail.com`.
- El enlace de correo no se habilita hasta completar el formulario. La persona debe abrir su aplicación de correo y **pulsar Enviar**; el sitio no envía el mensaje ni crea automáticamente un ticket.
- Las referencias de publicaciones y perfiles se incluyen en el borrador si la persona llegó mediante un enlace contextual; no se solicitan contraseñas, documentación de identidad ni material cultural sensible.

**No implementado:** recepción de correos en una bandeja moderada por agentes, sistema de tickets, cola de resolución, apelaciones integradas, acceso de administradores a reportes, medidas automáticas de retirada, notificaciones garantizadas o auditoría de decisiones en producción.

## 2. Ingreso y confirmación

1. Recibir la solicitud desde el correo oficial o el sistema de reportes autenticado.
2. Verificar que existe realmente un mensaje o informe antes de afirmar que fue recibido.
3. Registrar internamente solo una referencia, fecha, motivo, estado y responsable, en un almacenamiento privado con acceso mínimo cuando este exista; no publicar denuncias o datos identificables en GitHub, documentos públicos ni reportes de CI.
4. Contestar con una confirmación **solo después de recibirla y poder atenderla**, sin aceptar automáticamente la legitimidad de ninguna parte.

## 3. Priorización propuesta (no SLA vigente)

- **Urgente:** riesgo inmediato para un menor o persona, doxxing, amenazas creíbles, divulgación de conocimiento sagrado o restringido con riesgo serio e inminente. Escalar a una persona responsable; evaluar medidas de contención permitidas por ley y preservar evidencias mínimas.
- **Alta:** uso no autorizado de fotografías o testimonios, solicitud de un representante comunitario con evidencia suficiente, suplantación, divulgación sensible sin urgencia inmediata.
- **Normal:** correcciones factuales, atribuciones, créditos, metadatos, disputas no urgentes.
- Una categoría de prioridad **no significa** que ORIGEN ya disponga de cobertura 24/7 ni de procedimientos legales específicos implementados.

## 4. Revisión humana y resolución

1. Localizar con precisión la publicación o el perfil y verificar el estado: referencia editorial, autogestionado o verificado.
2. Solicitar solo información adicional proporcionada de forma segura y proporcional. No pedir a una comunidad que divulgue conocimientos sagrados o privados para demostrar su autoridad.
3. Evitar compartir denuncias, identidad del denunciante o datos de terceros con el autor salvo que corresponda y exista una base legal/procedimental adecuada.
4. Evaluar acciones posibles: corregir nombre o atribución; limitar visibilidad; retirar archivos o publicación; solicitar documentación a quien publica; desestimar con motivos; escalar a asesoría competente.
5. Documentar razón y fecha de decisión sin dejar copias públicas de material potencialmente infractor.
6. Ofrecer, cuando proceda, una vía de revisión o apelación proporcional. No garantizar reintegro, compensación o arbitraje no existente.
7. Distinguir el borrado de la interfaz de la gestión de cachés, copias de terceros, respaldos y conservación obligatoria; no prometer desaparición absoluta inmediata.

### Nota de seguridad adicional: archivos públicos

La revisión de 9/10/2026 confirmó que `post-media` es un bucket público de Supabase. **Ocultar o eliminar una fila de `cultural_posts` no necesariamente retira imágenes/videos ya publicados**. Para una retirada legítima se debe determinar si los objetos continúan accesibles, solicitar eliminación autorizada de Storage, comprobar el resultado y considerar cachés, contenido externo y copias de terceros.

El código beta ahora espera la limpieza de medios gestionados en la eliminación de posts por el autor e indica fallos, pero **esto no es un procedimiento de retirada administrativa ni una garantía de eliminación global**. El sistema operativo real, la bitácora privada y las pruebas con cuentas diferentes son P0 #12 y #8. Véase `PUBLIC_MEDIA_WITHDRAWAL_SAFETY.md`.

## 5. Seguridad y prevención de abuso

- No utilizar formularios públicos para transferir archivos, documentos de identidad, declaraciones jurídicas extensas o pruebas que incluyan datos de menores.
- No registrar datos de denunciantes en métricas públicas o analytics; evitar su incorporación a reportes de errores.
- Validar permisos de cualquier herramienta administrativa antes de permitir ocultar, restaurar o borrar contenido de otra cuenta.
- Prevenir que una reclamación sin verificar transfiera el control de un perfil de referencia.
- Registrar cambios moderativos de forma trazable en un sistema de acceso restringido, sujeto a una política de retención y privacidad revisada.
- Revisar normas aplicables de Australia, Ecuador y futuros países antes del lanzamiento; no existe una única política que garantice cumplimiento automático global.

## 6. Casos de aceptación para staging

| Prueba | Resultado exigido |
|---|---|
| Visitante sin cuenta solicita revisión | Puede preparar email sin registrarse, sin afirmar envío automático |
| Correo sin enviar | Ningún ticket ni reporte se declara recibido |
| Cambio del motivo o texto después de preparar | Enlace anterior se invalida y debe regenerarse |
| Acceso desde publicación | ID exacto de la publicación aparece en la referencia |
| Acceso desde perfil editorial | ID exacto del perfil aparece sin asumir representación oficial |
| ES/EN y móvil | Formulario y advertencia de no envío comprensibles |
| Usuario con cuenta reporta desde modal | Insert autorizado por RLS, motivos canónicos y visibilidad limitada al denunciante |
| Reporte por otra cuenta | No se pueden leer ni modificar denuncias privadas ajenas |
| Autor intenta suplantar moderación | Backend deniega acciones administrativas |
| Solicitud de retirada legítima | Operador autorizado puede resolver y documentar la decisión |
| Apelación | Ruta revisada que no expone datos privados |

## 7. Dependencias

- Issue #5: staging privado y aislado para pruebas.
- Issue #6: consentimiento de registro exigido por Auth server-side.
- Issue #7: declaraciones culturales y trazabilidad exigidas por el backend.
- Proceso de reclutamiento y piloto Ecuador: `PILOT_ECUADOR_PLAYBOOK.md`.
- Validación externa/real de capacidades de moderación y de obligaciones legales por jurisdicción.

**No anunciar el correo precompuesto como «sistema de tickets», «denuncia enviada» o retirada automatizada.**
