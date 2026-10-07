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
