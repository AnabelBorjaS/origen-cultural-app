# ORIGEN Cultural — Panel de progreso técnico
Actualizado: 13 de octubre de 2026 · PR #3 Draft · sin publicación de Production

**Avance de hitos técnicos hacia el piloto privado: 6/10 = 60%**.
Este porcentaje **no** representa el grado total de terminación de ORIGEN ni la seguridad aprobada para invitar comunidades. Se basa solo en diez hitos con idéntico peso, enumerados a continuación. Solo cambia cuando un hito concreto cumple el criterio de evidencia.

| # | Hito | Estado | Evidencia / requisito |
|---|---|---|---|
| 1 | Identidad visual y navegación bilingüe | ✅ Preparado en beta | HTML/CSS, ES/EN en `app.js` y pruebas de interfaz |
| 2 | Recorridos base de exploración, perfiles, publicaciones y Pasaporte Cultural | ✅ Preparado en beta | Rutas y componentes en PR #3; aún sin cuentas reales |
| 3 | Quality Gate y análisis estático de seguridad automatizados | ✅ Verificado | GitHub Quality Gate #460 y CodeQL #264 aprobados; cambios recientes sometidos a CI |
| 4 | Construcción de artefactos beta aislados de Production | ✅ Verificado por pruebas | `scripts/build-static.mjs`, `tests/staging-build-isolation.mjs`, `tests/visual-preview-isolation.mjs`, `Cache-Control: no-store` |
| 5 | Auditoría de configuración de permisos RLS en Staging | ✅ Catálogo verificado | `supabase/proposals/ORIGEN_STAGING_MODERATION_CONFIG_AUDIT_READ_ONLY.sql`: 15/16 configuraciones correctas; hito restante de moderación operativa NO incluido aquí |
| 6 | Bandeja de reportes solo lectura, con comprobaciones de navegador sintético | ✅ Verificado en beta local | `tests/moderation-inbox.mjs`, `tests/browser-smoke.mjs`, Browser QA #323 aprobado |
| 7 | Vista HTTPS privada con Cloudflare Access en origen y todas las previews | ⬜ Pendiente | Configurar Pages Free, proteger subdominios/URLs y comprobar rechazo con sesión anónima |
| 8 | Registro, legal consent y permisos verificados con dos cuentas Auth ficticias | ⬜ Pendiente | Staging independiente, URLs autorizadas, CAPTCHA, pruebas E2E y limpieza |
| 9 | Moderación operativa con decisiones, apelaciones y bitácora privada real | ⬜ Pendiente | Servicio protegido por autorización servidor, registro inmutable a nivel de aplicación y pruebas. La propuesta SQL `ORIGEN_MODERATION_CASE_EVENTS_LEDGER_REVIEW_ONLY.sql` se verificó con ROLLBACK, NO se instaló |
| 10 | Retirada real de medios, privacidad y aprobación del piloto | ⬜ Pendiente | Storage/CDN, retención, derechos culturales, incidentes, legal y pruebas con cuentas de ensayo |

### Reglas del porcentaje
- El porcentaje corresponde a **hitos internos de preparación técnica para un piloto privado**, no al producto completo.
- No se admite fracción de un hito: «solo código escrito» no completa permisos, E2E o despliegue.
- Quality Gate, Browser QA y CodeQL deben continuar verdes tras cambios relevantes. Si retroceden, el hito 3 o 6 puede perder la marca.
- Pilot Ecuador y Beta pública siguen **NO-GO**, aunque este contador marque 60%, hasta resolver los bloqueos de seguridad.
- Presupuesto incremental de servicios de pago: **AUD $0 contratados en estos avances**. No garantizar consumo futuro hasta comprobar facturación/cupos reales de cada servicio.

### Progreso visual
`██████░░░░` **60% (6 de 10 hitos)**

### Fuentes técnicas de estado
- PR #3: https://github.com/AnabelBorjaS/origen-cultural-app/pull/3
- Seguridad/preview privada: https://github.com/AnabelBorjaS/origen-cultural-app/issues/5
- Moderación: https://github.com/AnabelBorjaS/origen-cultural-app/issues/8
- Retirada de medios: https://github.com/AnabelBorjaS/origen-cultural-app/issues/12
- Las pruebas futuras se verifican en GitHub Actions; no presuponer el resultado de una ejecución pendiente.

Production, `main` y `origencultural.com` permanecen sin cambios.
