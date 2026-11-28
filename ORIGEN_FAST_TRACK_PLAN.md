# ORIGEN Cultural — Fast Track: desarrollo seguro y de coste controlado
**Decisión operativa propuesta:** 9 de octubre de 2026 · **Estado:** preparación, sin despliegue ni migraciones.  
**Responsable de producto:** Fundadora; decisiones sobre pagos, alcance y publicación requieren aprobación.  
**Proyecto:** red social **gratuita** para Agentes y Exploradores Culturales. No marketplace, pagos, anuncios ni antiguo 80/20 en el MVP.

## Resultado que queremos (NO-GO hasta evidencia)
Piloto privado con hasta **10 Agentes Culturales voluntarios de Ecuador** y Exploradores invitados; un Agente publica contenido autorizado; un Explorador lo descubre, sigue, guarda y comparte; funciona registro, recuperación, reportes y retirada, sin acceso entre cuentas ni filtraciones. No se invita a cuentas reales mientras haya P0 abiertos.

## Acelerador real: una segunda base de datos sin riesgo para Production
**Verificado mediante herramientas conectadas el 9 de octubre de 2026:**
- Organización Supabase `ORIGEN Cultural`: plan `free`.
- Proyectos accesibles: **uno**, `ORIGEN Cultural Production`.
- Consulta previa de coste del proveedor para crear otro proyecto **en esa organización**: **$0/mes** recurrentes. Supabase documenta un máximo habitual de **2 proyectos activos Free** entre organizaciones; comprobar condiciones y cuotas en el flujo de creación.
- **No se ha creado** staging. Aun con importe $0, creación requiere selección/confirmación de organización y aprobación explícita de la fundadora. No activar complementos o planes de pago.
- Una instancia local de Supabase CLI + Docker puede servir para QA aislada mientras se prepara hosting, sin suscripción, si el equipo cuenta con ese runtime; no se ha instalado ni ejecutado aquí.
- Frontend: candidata Cloudflare Pages Free, **no desplegada**. Un sitio `pages.dev` es público por defecto; debe quedar detrás de Cloudflare Access, incluyendo dominio principal y previews, antes de introducir datos ficticios de test. Los builds usan `npm run build:static`, **jamás** los archivos fuente sin aislamiento.
- No conectar una preview a Production, aunque la clave sea publicable; no agregar `service_role` al frontend.

## Ruta crítica (trabajo secuencial solo donde hay dependencia)

| Orden | Entregable y criterio verificable | Bloqueo/estado |
|---|---|---|
| 0 | **Restaurar historial de migraciones sin datos reales.** En Supabase Production constan 14 migraciones. El 9 de octubre se recuperaron **los 7 SQL históricos ausentes** desde el historial de migraciones (lectura solamente), por lo que el inventario versionado es ahora **14/14**. Resta ejecutar la reconstrucción en un entorno aislado y comparar funciones, RLS, buckets, triggers y Auth. Pasar `npm run preflight:staging:schema:strict` antes de bootstrap. | **Inventario 14/14 recuperado; reconstrucción real aún sin validar** |
| 1 | **Staging aislado** Free, sin acceso a Production. Verificar explícitamente el coste $0 y la organización antes de crear. Credenciales publicables separadas; hosting web protegido y build aislado; pruebas de aislamiento sobre assets servidos. | Issue #5 abierto |
| 2 | **Controles ineludibles del servidor**: consentimiento legal al crear cuenta (#6), declaraciones + registro atómico de derechos culturales al publicar (#7), sin falsificar roles. Propuestas SQL **solo revisión**, no ejecutar en Production. | Issues #6 y #7 abiertos |
| 3 | **Protección comunitaria**: canal real de moderación/apelaciones y retirada de medios públicos con trazabilidad (#8 y #12), privacidad y eliminación de cuenta. | Issues #8 y #12 abiertos |
| 4 | **QA real**: pruebas Auth confirm/reset, dos cuentas distintas, intentos adversariales Data API/RLS, Storage, contenido cultural retirado, móvil ES/EN y Content Security Policy en entorno accesible a auditores autorizados. | Sin staging ni usuarios de prueba verificados |
| 5 | **Piloto privado** con voluntarios y contenido consentido, métricas de activación/retención, correcciones y revisión legal antes de valorar Public Beta. | NO-GO por P0 anteriores |

### Trabajo en paralelo SIN incrementar riesgo
Mientras se recupera el esquema (0), avanzar por separado en los textos de onboarding ES/EN, criterios para seleccionar 10 Agentes voluntarios, tutoriales, guías de derecho cultural, escenarios QA sintéticos, revisión visual móvil y preparación de normas de moderación. No crear perfiles de personas reales, importar datos históricos sensibles o publicar alianzas no confirmadas.

## Método operativo para ganar velocidad
- **Congelación de alcance:** no añadir pagos, promos, reels nuevos, mensajería, marketplace, nuevos roles ni módulos secundarios hasta pasar el piloto seguro.
- **WIP 1 para P0:** resolver **un bloqueo principal** por iteración y agrupar cambios coherentes (código + tests + docs) en un solo commit, reduciendo CI duplicada y cancelaciones.
- **Aceptación binaria:** cada tarea solo está terminada con evidencia concreta (Quality Gate, Browser QA, CodeQL y cuando proceda staging real + dos usuarios). Tests mock **no cuentan** como pruebas de permisos reales.
- **Riesgos explícitos:** conservar el PR #3 como `draft`, sin merge a `main`, sin cambios en `origencultural.com` y sin DDL/DML en Supabase Production.
- **Coste separado de seguridad:** $0/mes para proyecto Supabase Free fue verificado; **no** se asume coste cero para futuras necesidades legales, dominio, email transaccional o capacidad a escala. No contratar sin presupuesto y aprobación.

## Comprobación reproducible del bloqueo de esquema
- `npm run preflight:staging:schema`: inventario local informativo, retorna éxito aunque aún falte la línea base, para no bloquear las verificaciones ordinarias del código de la beta.
- `npm run preflight:staging:schema:strict`: falla si faltan archivos históricos; usar **antes** de levantar/recrear una base de staging. Igualar archivos **no** prueba RLS ni equivalencia real del esquema.
- Fuente del manifest: `supabase/STAGING_PRODUCTION_MIGRATION_VERSIONS.json` — lista histórica obtenida en consulta de metadatos, **sin datos personales**. Refrescar al preparar staging. No usar `supabase db reset --linked` en Production (puede destruir datos).

## Próxima aprobación concreta
La fundadora debe autorizar expresamente **crear `ORIGEN Cultural Staging` en la organización `ORIGEN Cultural`, con importe comprobado de $0/mes y exclusivamente plan Free**. Antes de cualquier creación, volver a confirmar elegibilidad y mostrar coste exacto; detenerse si deja de ser $0. No desplegar ni poblar cuentas reales automáticamente.

## Actualización del sprint — 9 octubre 2026

- ✅ **14/14 migraciones recuperadas** del historial SQL original mediante SELECT, sin clonar datos reales ni ejecutar SQL de cambios en Production; revisión básica de patrones sensibles antes de escribir al repositorio. Commit `f6a67f5a72c4dceec81cc9bbb9de5affe06deb2b`.
- ✅ Quality Gate exige ahora `npm run preflight:staging:schema:strict` antes de aprobar el artefacto estático: perder una migración histórica hace fallar el proceso.
- ⚠️ Restaurar los ficheros no significa que el esquema local se haya reconstruido: no se ejecutaron migraciones en staging, Auth ni Storage, y deben probarse cuidadosamente antes de invitar usuarios.
- **Próximo único bloqueo de infraestructura:** aprobación explícita para crear `ORIGEN Cultural Staging` en organización `ORIGEN Cultural`, con tarifa comprobada **$0/mes** bajo Free y sin añadir complementos de pago.
