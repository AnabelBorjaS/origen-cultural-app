# ORIGEN Cultural — Database State

Production Supabase project: **ORIGEN Cultural Production**
Region: **ap-southeast-2 (Sydney)**
Status verified 7 October 2026: **ACTIVE_HEALTHY**

## Applied migrations

Production reports these migrations:

1. `20261006053729_initial_origen_beta_schema`
2. `20261006053813_harden_security_and_indexes`
3. `20261006072529_align_webapp_social_beta_model`
4. `20261006072749_record_legal_acceptance_at_signup`
5. `20261006080924_allow_personal_social_posts_and_video_media`
6. `20261006082339_abuse_prevention_rate_limits_and_content_bounds`
7. `20261007003848_add_cultural_post_purpose`
8. `20261007125206_protect_cultural_profile_privileged_fields`
9. `20261007135902_harden_claim_report_insert_integrity_and_grants`
10. `20261007140601_harden_social_privileged_fields_and_grants`
11. `20261007140657_scope_social_interactions_to_published_content`
12. `20261007141841_limit_public_profiles_to_creators`
13. `20261007143630_restrict_touch_updated_at_execution`
14. `20261007144230_restrict_beta_post_creation_to_creators`

## Security verification

As of 7 October 2026:
- Supabase Security Advisor: **0 active security lints**.
- RLS is enabled on ORIGEN public application tables.
- Storage ownership/type/size policies are present.
- Privileged cultural-profile fields are protected from owner self-modification.

## Repository sync rule

Database changes made in Production must be represented in GitHub before release. The newest privileged-field migration is stored under `supabase/migrations/`.

The seven oldest migrations were recovered on 9 October 2026 by reading `supabase_migrations.schema_migrations.statements` without writing to Production. GitHub now tracks **all 14 historical migration SQL files** under `supabase/migrations/` (commit `f6a67f5a72c4dceec81cc9bbb9de5affe06deb2b`). This is historical-file parity, **not** a successful staging replay or proof of database equivalence. Before use, validate local/staging migration replay, functions, Auth, RLS, grants, Storage, and security evidence.

Do not treat the legacy root `schema.sql` as a complete representation of current Production.


## Claim/report integrity hardening verified — 7 October 2026
- New profile claims must be created by the authenticated claimant, include explicit authority declaration, start as `pending`, have no reviewer metadata and target an unowned `reference` Cultural Profile.
- New moderation reports must be created by the authenticated reporter, start as `open` and have no `resolved_at`.
- `anon` has SELECT only on published Cultural Profiles and no table privileges on claims/reports.
- `authenticated` has least-privilege table access required by current Beta flows.
- Negative RLS tests PASS:
  - forged `approved` claim is blocked by RLS;
  - forged `resolved` moderation report is blocked by RLS;
  - anonymous report insert is blocked by table privilege.
- Supabase Security Advisor after migration: **0 active security lints**.


## Social integrity hardening verified — 7 October 2026
- Profile owners cannot change their own `role` or promote themselves to `admin`.
- Post authors cannot modify server-owned counters (`like_count`, `comment_count`) or editorial/source fields.
- New user posts cannot be created as editorial, with fake counters, or with editorial source metadata.
- Comment owners cannot move an existing comment to another post or change its author/timestamp.
- Public comment reads are scoped to published parent posts, except the comment owner/admin.
- Likes, saves, follows, favourites and new comments can target published content/profiles only.
- Social-table privileges were reduced to the operations actually required by the Beta client.
- Supabase Security Advisor after both migrations: **0 active security lints**.


## Explorer profile privacy hardening verified — 7 October 2026
- Public Data API reads from `profiles` are limited to `role = creator`.
- An authenticated user can still read their own profile row.
- Admin moderation access remains available through `private.is_admin()`.
- At migration time Production contained 0 Explorer profiles, 0 creator profiles and 0 published user posts, so the change affected no real user data.
- Supabase Security Advisor after migration: **0 active security lints**.


## Function execution surface hardening verified — 7 October 2026
- `public.touch_updated_at()` is used only by UPDATE triggers on `profiles`, `cultural_profiles` and `cultural_posts`.
- Direct EXECUTE is revoked from `PUBLIC`, `anon` and `authenticated`.
- Trigger associations remain present after the revoke.
- Sensitive private trigger/admin functions remain inaccessible directly to browser roles.
- Supabase Security Advisor after migration: **0 active security lints**.


## Beta publishing-role integrity — 7 October 2026
- New feed posts require an authenticated `profiles.role = creator` row.
- Explorers cannot bypass the UI and publish directly through the Data API.
- Existing post ownership/editorial/counter restrictions remain in the same INSERT policy.
- The rule aligns the database with the current Beta product model: Cultural Agents publish; Explorers discover and interact.
- Supabase Security Advisor after migration: **0 active security lints**.

## Auditoría read-only de permisos Data API — 9 October 2026

- En Supabase Production se ejecutó una comprobación SELECT-only de permisos por tabla para `anon` y `authenticated` junto con `relrowsecurity`. **11/11 tablas públicas: PASS** con la línea base declarada. No se creó, modificó ni eliminó ningún dato.
- Comprobación reusable versionada: `supabase/proposals/ORIGEN_DATA_API_GRANTS_RLS_AUDIT_READ_ONLY.sql`. Ejecutar tras cambios de esquema, permisos, políticas o al preparar un release.
- Supabase Security Advisor: **0 lints** en esta lectura. Los avisos de rendimiento sobre índices no utilizados son informativos en esta base todavía sin actividad de usuarios; no eliminarlos por ese motivo.
- **Límites de la evidencia:** coincidencia de GRANT + RLS habilitado **no comprueba** eficacia de políticas ante dos cuentas reales, ejecución de funciones, Storage, consentimiento exigido por Auth, autorizaciones culturales, retirada de medios ni moderación.
- La documentación actual de Supabase está pasando de privilegios automáticos amplios a concesiones explícitas para nuevos objetos. Toda migración nueva debe declarar y revisar `GRANT/REVOKE` y su política RLS deliberadamente; no dar permisos por defecto a tablas sensibles. Ver https://supabase.com/docs/guides/api/securing-your-api
- **Estado GO/NO-GO sin cambios: NO-GO.** No habilitar registro público, no fusionar PR #3 y no conectar staging al backend de Production.

## Staging reproducido con historial original — 9 October 2026

- El proyecto aislado `ORIGEN Cultural Staging` (`egujmptgnrpajgfpjjxu`) recibió **14/14 migraciones originales en orden** el 9 Oct 2026. Las versiones registradas por Supabase al aplicarlas en Staging son distintas de los timestamps originales; los nombres/SQL provienen del repositorio.
- Comparación SELECT-only de Staging vs Production: **11 tablas públicas**, **33 políticas**, **14 funciones privadas**, y **3 buckets (avatars/covers/post-media)** en ambos. Cero tablas públicas de aplicación con RLS desactivado. Staging Security Advisor: **0 active lints**.
- No es una prueba de igualdad columna-por-columna o grants, ni una prueba adversarial de Auth/RLS/Storage. **0 usuarios y 0 publicaciones** en Staging. Los controles de consentimiento y declaraciones culturales `REVIEW_ONLY` no se instalaron.
- Estado: baseline de staging preparado, **NO-GO** para pilotos reales, producción inalterada.
