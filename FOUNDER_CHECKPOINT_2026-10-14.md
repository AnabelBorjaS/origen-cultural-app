# ORIGEN — Founder Checkpoint · 14 Oct 2026

## Estado ejecutivo
ORIGEN está en **pre-release controlado**. PR #3 es la única Release Candidate activa, permanece Draft / NO-GO y GitHub la reporta mergeable.

## Verificaciones realizadas hoy
- PR #3: abierta, Draft, mergeable.
- Rama release candidate: 530 commits por delante de `main`, 0 por detrás.
- CI reciente: Quality Gate, CodeQL y Browser QA completaron en success.
- Supabase Staging `egujmptgnrpajgfpjjxu`: ACTIVE_HEALTHY.
- Staging mantiene 0 Auth users, 0 profiles, 0 legal acceptances, 0 cultural posts y 0 moderation reports.
- `public.origen_before_user_created(event jsonb)` existe en Staging como SECURITY INVOKER.
- `private.handle_new_user()` existe en Staging como SECURITY DEFINER.
- Security Advisor Staging: 1 INFO-only en `private.cultural_post_rights_events` por RLS sin policy; tabla privada sin exposición directa de navegador prevista.

## Producto incluido en la Release Candidate
- Identidad visual ORIGEN y globo 3D cultural.
- Perfiles profesionales de Agentes/Proveedores Culturales.
- Feed cultural visual, propósito cultural, videos y carga infinita.
- Pasaporte Cultural, colecciones, niveles y bienestar digital.
- Trust Center, consentimiento visible, reportes, reclamaciones y privacidad.
- Hardening CSP/XSS/PWA/uploads.
- Arquitectura futura de Partners + Academia ORIGEN documentada.

## P0 que todavía bloquean Public Beta
1. Activar y comprobar el hook Before User Created en Supabase Auth Staging.
2. Desplegar el bundle en staging HTTPS protegido.
3. Configurar Site URL / redirect allow-list exacta.
4. Configurar Turnstile + CAPTCHA enforcement.
5. Crear Explorer A + Cultural Agent B sintéticos.
6. Ejecutar Auth/RLS/Storage/claims/reports/anti-spam/rights E2E.
7. Probar ciclo completo de eliminación de cuenta de prueba.
8. Crear backup lógico independiente fuera del repositorio público y validar recuperación.
9. Verificar inventario real de Trust/Privacy/Cookies sobre el deployment.
10. QA autenticado mobile/desktop/accessibility y revisión jurídica proporcional.

## Regla
No merge a `main`, no migrar `origencultural.com`, no abrir registros públicos y no activar pagos hasta cerrar P0.
