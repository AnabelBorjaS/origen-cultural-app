# ORIGEN — Manual de contraseñas y recuperación / Password Recovery Runbook

**Versión:** 1.0 — 03 noviembre 2026  
**Estado:** Implementado en código de la rama beta **sin publicar**, validación de extremo a extremo pendiente.  
**Ámbito:** ORIGEN Cultural (cuentas de Agentes y Exploradores).  
**Responsable operativo:** ORIGEN Trust / CEO hasta designar responsable autorizado.  
**Dominio de producción:** `origencultural.com` — **sin cambios**.  
**Entorno de prueba:** Supabase Staging separado; no usar usuarios reales ni Production para pruebas negativas.

> Protocolo de producto; no sustituye la revisión legal ni la configuración y validación del proveedor de correo.

## 1. Guía breve para usuarios — Español

### A. Ver u ocultar lo que escribes

- En los campos **Contraseña**, **Confirmar contraseña**, **Contraseña actual** o **Nueva contraseña**, pulsa el **ojito** situado dentro del campo.
- El primer toque muestra los caracteres; el siguiente los oculta. Cada campo se controla por separado.
- El control funciona con teclado y lector de pantalla (**Mostrar contraseña / Ocultar contraseña**). **No modifica** la contraseña ni la envía por otro canal.
- Úsalo solo cuando nadie pueda ver tu pantalla. ORIGEN oculta los caracteres por defecto.

### B. ¿Olvidaste la contraseña?

1. En **Iniciar sesión**, toca **¿Olvidaste tu contraseña?**, o abre **Recuperar contraseña**.
2. Escribe el correo usado para la cuenta. El mensaje será neutral: no revela si la dirección está registrada.
3. Revisa bandeja de entrada y spam. **Nunca compartas el enlace recibido, capturas del token ni códigos**.
4. Comprueba que pediste la recuperación y que el enlace abre el sitio HTTPS oficial configurado de ORIGEN.
5. Cuando se valide el enlace, escribe la **contraseña nueva dos veces**. Usa el ojito si deseas comprobar los caracteres.
6. Guarda el cambio y vuelve a usar tu cuenta. Si el enlace expiró o falló, inicia una solicitud nueva.

Si el correo no llega, revisa spam, escritura de la dirección, filtros de correo y espera los límites del servicio. No intentes un bucle de reenvíos. En esta beta el envío real y la redirección **no están acreditados por una prueba E2E**.

### C. ¿Conoces tu contraseña, pero deseas cambiarla?

1. Inicia sesión y abre **Mi perfil → Editar perfil → Seguridad: cambiar contraseña**.
2. Escribe la contraseña actual, la nueva y la confirmación.
3. Muestra/oculta cada campo con su ojito, verifica que coinciden y guarda.
4. Si no recuerdas la contraseña actual, usa el flujo **Olvidé mi contraseña**: no se modifica por soporte ni mediante una petición informal.

### D. Si sospechas que otra persona accedió a tu cuenta

- Si aún tienes acceso, cambia tu contraseña y revisa otros servicios donde hayas reutilizado esa clave.
- Contacta a `info.origencultural@gmail.com` desde un canal confiable para reportarlo. **No envíes contraseñas, enlaces de recuperación, tokens o documentos sensibles por email**.
- El equipo investigará y podrá requerir verificación proporcional antes de cualquier gestión de cuenta. Nunca basta con afirmar conocer un nombre o correo.

## 2. English — User guide

### Show or hide password

Use the eye icon beside **Password**, **Confirm password**, **Current password**, and **New password**. The first click reveals the text; the next masks it. Each field works independently and defaults to hidden. Do not reveal credentials in public.

### Forgot password

1. From **Sign in**, choose **Forgot your password?** and enter your account email.
2. The notice intentionally does not say whether the account exists.
3. Check inbox and junk mail; never share the email link or recovery token.
4. Open the link only if you requested it, and confirm that the destination is the official HTTPS site.
5. After the recovery session is verified, enter the new password **twice**, then save.
6. For expired or failed links, request another link. If delivery fails, use the official support address without sharing secret data.

### Change password while signed in

Open **My profile → Edit profile → Security: change password**. Enter **current password**, **new password** and **confirm new password**. If you cannot remember the current password, use the email recovery process instead.

For suspicious activity, write to `info.origencultural@gmail.com`. Never share passwords, tokens or recovery links.

## 3. Implementation inventory (verified in beta source)

| Flow | Route / UI | Backend operation | Status |
|---|---|---|---|
| Signup | `#registro` / password + confirm + eye | `auth.signUp` | UI/code updated; no live E2E |
| Sign in | `#login` / eye | `auth.signInWithPassword` | UI/code updated; no live E2E |
| Request recovery | `#recuperar` | `auth.resetPasswordForEmail` with `redirectTo` | Implemented; email/redirect QA pending |
| Set new password | `#restablecer` / password + confirm + eye | `auth.updateUser({password})` following Auth `PASSWORD_RECOVERY` event | UI guard and code updated; real-link QA pending |
| Change while signed in | `#cambiar-contrasena` / current + new + confirm + eye | `auth.updateUser({password,current_password})` | New; server enforcement/QA pending |
| In-app help | `#ayuda-contrasena` | Informational | New; bilingual |
| Show/hide | Each relevant password field | Only switches input `type` locally | New; browser QA required |

**Important:** Browser event checks are **UX guards**, not an authorization boundary. Supabase Auth is authoritative. Anyone could construct a direct API request; do not claim backend-enforced possession of a recovery token simply because the browser displays an eye button or a guarded route. Confirm Auth settings, current-password enforcement and approved email redirects on Staging; consider server-side reauthentication controls as required.

## 4. Security protocol for Trust / support

1. **No password handling by staff:** never request or send passwords via email/chat/phone; never look up or transmit password hashes.
2. **No user enumeration:** recovery notices must not reveal whether the address has an account; verify this in both successful and error scenarios.
3. **Token verification:** use Supabase's signed recovery link and verified session. Deny direct reset without a verified recovery context. Check expired, reused, malformed, and foreign-domain links.
4. **Change with known password:** require a current password; evaluate Supabase Auth server-side “Require current password when changing password” setting for this flow. Confirm that it remains compatible with email recovery before enforcing it.
5. **Password rules:** HTML minimum 8 characters; configure Supabase Auth rules on the server. Recommend long, unique passwords and password managers. Never rely solely on HTML validation.
6. **Security configuration:** CAPTCHA on registration/login/recovery, appropriate rate limits, exact HTTPS Site URL and redirect allow-list, sender domain/SMTP delivery and email template links must all be tested. Verify against the deployed staging host, not just localhost.
7. **Privacy:** do not log plaintext passwords, reset links, full tokens, credentials in screenshots or GitHub issues. Do not put Secrets/Service Role keys into a browser bundle.
8. **Compromised accounts:** escalate to the designated Trust lead; verify identity and ownership through a proportionate process, consider incident response/session revocation, document a restricted audit decision, do not auto-transfer ownership based only on an email or screenshot.
9. **Failed delivery:** investigate SMTP/provider and throttling at the infrastructure level without changing a user's password by hand. Escalate unresolved delivery rather than encouraging unlimited retries.
10. **Vendor constraints:** Supabase's leaked-password protection may require a paid plan; the Staging Security Advisor has reported it disabled. Evaluate mitigation and costs first. **No upgrade or billable feature without founder approval.**

## 5. Release QA checklist — must be completed before GO

- [ ] Browser QA passes for eye icons on registration (both fields), login, password reset (both) and change password (all three); mouse, touch, keyboard and screen reader; ES/EN; 390px mobile and desktop.
- [ ] A displayed password remains unchanged when shown/hidden and never appears in console logs or persistent app storage.
- [ ] Registration rejects mismatched passwords even after toggling; confirmation works after editing either field.
- [ ] Recovery password requires matching confirmation, rejects direct navigation without a verified recovery event, rejects expired/invalid/reused links.
- [ ] Two synthetic accounts in isolated Staging: send recovery email, open on permitted HTTPS host, update password, sign in with new password; old password rejected.
- [ ] Changing password while signed in requires correct current password; wrong or missing current password rejected by Supabase Auth (server-side), not only frontend.
- [ ] Verify password change does not affect another user or expose access under different session/user.
- [ ] Check valid/invalid email requests have neutral user-facing responses, limits, CAPTCHA and accessibility; validate deliveries without exposing user identifiers to logs.
- [ ] Verify redirect handling on the actual Cloudflare Pages Staging deployment with Access protection, not the public domain.
- [ ] Validate recovery with URL/hash routing and Supabase auth callback event on Android/iOS browsers and mail apps.
- [ ] Test interruption, retry, page reload, network failure and expired session; do not promise seamless resume if no recovery session survives.
- [ ] Confirm Supabase security advisor warnings, approved fallback/migration and legal/privacy review; add sign-off to `RELEASE_GATE.md`.

## 6. References

- Supabase Password-based Auth: https://supabase.com/docs/guides/auth/passwords
- Supabase Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase Password Security: https://supabase.com/docs/guides/auth/password-security
- Supabase Auth State Events: https://supabase.com/docs/reference/javascript/auth-onauthstatechange
- ORIGEN: `RELEASE_GATE.md`, `RELEASE_QA_RUNBOOK.md`, `STAGING_PLAN.md`, `INCIDENT_RECOVERY_RUNBOOK.md`

**GO/NO-GO:** Keep private pilot and public signups **NO-GO** until approved deployment, email/auth end-to-end QA, RLS, cultural protections, moderation and legal review. No changes to `main`, Production, `origencultural.com` or paid providers from this document.
