# ORIGEN Cultural — Release Gate

## Estrategia de lanzamiento
1. Internal Alpha
2. Private Pilot Ecuador
3. Closed Beta
4. Public Beta
5. Growth Release

## Go / No-Go
No abrir registro público hasta que:
- las cuentas persistan entre dispositivos;
- la verificación de email funcione;
- password reset funcione;
- un usuario no pueda editar datos de otro;
- los claims no otorguen propiedad automáticamente;
- los perfiles de referencia estén claramente identificados;
- Trust Center coincida con la tecnología realmente usada;
- no existan bugs Critical/High abiertos;
- se haya probado al menos un claim de principio a fin;
- contenido editorial/seed no simule actividad auténtica de entidades reales.

## Alcance beta
Incluye:
- perfiles culturales públicos;
- exploración;
- cuentas;
- publicaciones;
- follows;
- favoritos;
- Pasaporte Cultural;
- reclamación de perfiles;
- reportes;
- ES/EN.

No incluye:
- pagos;
- reservas;
- mensajería privada;
- payouts;
- marketplace;
- verificación automática.


## Security & abuse
Public beta remains NO-GO until:
- Supabase Security Advisor has no unresolved security lints.
- CAPTCHA/bot protection is enabled for sign-up, sign-in and password recovery.
- Email confirmation is enabled and redirect URLs are limited to approved ORIGEN domains.
- Auth rate limits are reviewed for the beta.
- RLS is tested with two separate accounts to confirm cross-user isolation.
- Spam limits for posts, comments, reports and profile claims are tested.
- Upload type/size restrictions and ownership policies are tested.
- External URLs reject unsafe schemes such as javascript:.
- Content Security Policy is validated in the deployed environment.
- GitHub and Supabase administrator accounts use MFA/2FA.
- No service-role key, database password or private secret exists in frontend code or repository history.
- A basic incident-response and recovery procedure exists before public launch. **Documented in `INCIDENT_RECOVERY_RUNBOOK.md`; pre-beta backup evidence still required.**

## Cookies, storage & privacy
- The beta must not load optional analytics, advertising or cross-site tracking before consent where consent is required.
- Maintain a real technical inventory of cookies, browser storage, SDKs and external providers from the deployed product.
- Current app preference storage and Supabase authentication storage must be documented accurately.
- When optional cookies/analytics are enabled, provide equivalent Accept, Reject and Configure choices before those technologies run.
- Re-run the cookie/storage inventory after every material analytics, authentication or advertising change.


## Publishing scope — Public Beta
- Cultural Agents may publish cultural/educational feed content subject to current media, purpose and moderation rules.
- Cultural Explorers do not publish feed posts in this beta; they discover, follow, save, comment, learn and connect.
- Any future Explorer publishing capability requires an explicit privacy/identity design and separate QA before activation.


## Recovery evidence before Public Beta
- [x] Incident-response and code/database rollback procedure documented.
- [ ] Independent logical database backup created outside the public repository.
- [ ] Backup date/time and migration version recorded.
- [ ] Backup file validity checked without restoring over Production.
- [ ] Storage/media recovery expectations documented for pilot participants.


## Privacy requests & account deletion
- [x] Public beta contact route for access/correction/deletion requests is documented.
- [x] Controlled deletion process is documented in `PRIVACY_REQUEST_RUNBOOK.md`.
- [ ] Complete one end-to-end test-account deletion lifecycle in staging, including Storage cleanup and Cultural Agent profile handling.
- [ ] Confirm no deleted test-user personal data remains publicly visible after the lifecycle test.
- [ ] Confirm final retention/deletion wording with proportional legal/privacy review before public launch.


## GitHub release controls
- [ ] Confirm `main` rejects accidental direct/force pushes or has an equivalent protected release rule. **Current repository rulesets endpoint returns no rulesets; manual GitHub admin action still required.**
- [ ] Confirm GitHub administrator account has 2FA enabled.
- [ ] Review GitHub Secret Scanning / security alerts before GO.
- [ ] Review Dependabot/code-scanning alerts where available. **Dependabot GitHub-Actions monitoring and ORIGEN CodeQL workflow are now configured; first clean review must be confirmed before GO.**
- [x] Current default-branch code search shows no obvious `service_role`, `sb_secret_`, Turnstile Secret, legacy JWT or Postgres connection-string patterns.


## Automated repository security controls
- [x] Weekly Dependabot version monitoring configured for GitHub Actions.
- [x] CodeQL JavaScript/TypeScript `security-extended` workflow configured for PRs to `main`, pushes to `main` and weekly schedule.
- [x] Existing Quality Gate and Browser QA remain separate required evidence during release review.
- [ ] Repository admin must add/confirm a `main` branch ruleset or equivalent protection before Public Beta.
- [ ] Repository owner/admin 2FA must be confirmed manually; this connector cannot inspect account-level 2FA state.


## Consentimiento obligatorio en servidor — nuevo bloqueo P0 (8 Oct 2026)

- [x] Auditoría de solo lectura: existe `private.handle_new_user()` en `auth.users`, pero actualmente omite registrar aceptación si falta el indicador; **no rechaza** el alta.
- [x] Cliente mejorado: solo acepta `acceptedLegal === true`, con pruebas automáticas de valores no booleanos.
- [ ] **P0:** configurar validación de consentimiento en servidor y versionado legal aprobado, con migración y revisión del flujo de invitaciones. Ver `BACKEND_CONSENT_REVIEW.md`.
- [ ] Probar en staging peticiones directas sin consentimiento / consentimiento inválido para verificar que no se crean cuentas ni perfiles.
- [ ] Confirmar que las versiones legales aceptadas las fija el servidor, no los campos enviados por usuarios.
- [ ] Revisar contenido legal y registro probatorio con asesoría jurídica antes de público.

**Importante:** 0 alertas de Security Advisor no equivale a prueba de consentimiento obligatorio en servidor. No GO hasta que todo lo anterior quede verificado.
