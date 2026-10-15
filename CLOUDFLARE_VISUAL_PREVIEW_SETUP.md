# ORIGEN — enlace navegable protegido (Cloudflare Pages)

**Estado:** el código para compilar la demostración está preparado. **No existe todavía una URL de Cloudflare configurada o publicada.**

## Objetivo

Ver desde tablet/móvil/PC la **beta real**, con portada y globo 3D flotante, navegación y Mundo Cultural. El ejemplo no podrá registrar, subir fotos, guardar, comentar o modificar datos; **no** conectará a Supabase de pruebas ni de Production.

Costos objetivo: **$0 mensuales**, usando cuotas gratuitas de Cloudflare Pages y Cloudflare Zero Trust Access. Esto depende de la elegibilidad y configuración de la cuenta; no autorizar extras, métodos de pago o subidas de plan sin una nueva confirmación explícita.

## Paquete listo en GitHub

- Rama: `reconcile-main-beta-2026-10-07`
- Comando exclusivo de demo: `npm run build:visual-preview`
- Carpeta a publicar: `dist`
- Entorno de build: sin variables `ORIGEN_STAGING_SUPABASE_URL`, `ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY` ni `ORIGEN_TURNSTILE_SITE_KEY`. Si se proporcionan, **el build falla**.
- El código enviado incluye un banner bilingüe claro: preview interno, sin cuentas ni publicaciones reales. El CSP de la demo impide conexiones a Supabase y bloquea frames y indexación.
- No configurar `origencultural.com` como dominio personalizado ni modificar su DNS.

## Acceso protegido: precaución obligatoria

**Cloudflare Pages crea URLs públicamente accesibles por defecto.** La política Access de **preview deployments** protege solo las direcciones de los despliegues de preview; **no protege automáticamente el hostname principal `project.pages.dev`**. La política debe estar activada antes de enviar el enlace privado. **No realizar el despliegue de la beta si todavía no está configurado y probado Access.**

Cloudflare exige que la cuenta/proyecto Pages se cree/configure desde el panel de la titular. Una opción segura es habilitar primero un proyecto aislado con contenido neutro o sin datos, proteger su ruta de producción y sus rutas preview, y solo entonces desplegar la beta. No usar la rama `main` del repositorio existente como producción del proyecto de demo: confundiría esa rama con el despliegue autorizado.

**Pasos guiados que quedan en la cuenta Cloudflare (aún pendientes):**

1. Confirmar que existe una cuenta Cloudflare propia y que se acepta exclusivamente el plan **Free / $0** (Pages y Zero Trust). Algunos procesos de alta Zero Trust pueden pedir detalles de pago aunque el plan sea gratuito; no introducirlos sin decisión de la titular.
2. Crear proyecto Pages **separado** de los servicios públicos de ORIGEN. Antes de exponer la beta, configurar **Cloudflare Access** para el/los hostnames exactos (producción de demostración y previews) con política `Allow` únicamente para la cuenta autorizada.
3. Verificar en navegación privada que una visita no autorizada no ve el sitio, ni por el dominio principal ni por una URL preview/hash/alias. Si alguna ruta devuelve la página sin identificarse, **NO-GO**.
4. Conectar GitHub a Pages, desplegar solo la rama de demo autorizada con `npm run build:visual-preview` y output `dist`. Mantener desactivadas las demás ramas y proteger la URL resultante con Access.
5. Comprobar en la URL final los siete recorridos visuales, el globo 3D, las restricciones del CSP y el mensaje de preview; verificar coste estimado **$0** antes de autorizar cualquier servicio adicional.
6. Compartir únicamente la URL **real obtenida en el Dashboard**, no una URL inventada a partir del nombre del repositorio.

## Pruebas de aceptación

- [ ] Página protegida: visitante anónimo recibe Access/denegación, no ORIGEN
- [ ] Propietaria autenticada ve portada, globo 3D y Mundo Cultural en móvil
- [ ] Acceso por alias, URL hash de deployment y proyecto principal protegido
- [ ] Registro/guardar/publicar reportan claramente estar deshabilitados
- [ ] Sin peticiones a Supabase (ni Production ni Staging)
- [ ] Costos y funcionalidades muestran $0, sin suscripciones pagadas
- [ ] `origencultural.com` y la rama `main` permanecen intactos

**Fuentes oficiales:** [Cloudflare Pages preview deployments y Access](https://developers.cloudflare.com/pages/configuration/preview-deployments/), [Cloudflare Pages Free](https://developers.cloudflare.com/pages/platform/limits/), [Cloudflare Access Free](https://www.cloudflare.com/en-au/plans/zero-trust-services/).

## Estado de autorización

Código de compilación visual solamente. No se ha creado el proyecto Cloudflare ni publicado su contenido. La configuración de Access y la puesta en línea requieren acciones de la titular en Cloudflare o un conector autorizado en un turno futuro.
