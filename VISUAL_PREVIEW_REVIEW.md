# ORIGEN — revisión visual de la beta real (sin lanzamiento)

**Entorno de captura:** navegador Chromium en servidor local efímero dentro de GitHub Actions.  
**Proyecto de origen:** rama `reconcile-main-beta-2026-10-07`.  
**Seguridad:** artefacto visual **sin cuentas reales, sin datos personales, sin inicio de sesión y sin conexión a Supabase**. No se despliega ningún sitio ni se modifica `origencultural.com`.

## Cómo revisar las capturas

1. Abre [ORIGEN Browser QA](https://github.com/AnabelBorjaS/origen-cultural-app/actions/workflows/browser-qa.yml).
2. Abre la ejecución más reciente de la rama de revisión `reconcile-main-beta-2026-10-07` que haya terminado satisfactoriamente.
3. Al final de esa ejecución busca el artefacto `origen-vista-visual-beta-...` y descárgalo. GitHub puede solicitar iniciar sesión para descargarlo.
4. En el ZIP encontrarás capturas PNG de la **portada con globo**, **Mundo Cultural en móvil/escritorio**, **Explorar**, **Registro** y **Centro de Confianza**, además de `preview-manifest.json`, que indica si cada globo se dibujó en 3D o en su versión simplificada.

No es una URL de la web interactiva. Es una revisión visual de la beta real, generada automáticamente con el código de la rama; las capturas no incluyen datos de personas reales. El repositorio y sus artefactos pueden tener visibilidad pública según la configuración de GitHub: **NO contienen material privado ni debemos afirmar que las capturas tienen control de acceso**.

## Identidad visual que se mantiene

- Negro `#0D0D0D`, dorado `#C8A97E`, blanco `#FFFFFF`.
- Portada con **HeroGlobe** y sección **MundoCultural**, ambas basadas en `mundo.js`.
- En equipos compatibles, globo WebGL interactivo (zoom, giro, territorios); en equipos sin WebGL o sin acceso a librerías/mapas externos, interfaz alternativa simplificada.
- Tipografías beta `Cormorant Garamond` + `DM Sans` con equivalentes seguros; auditar la tipografía final contra manual de marca antes del lanzamiento.

## Condiciones de aceptación visual de la fundadora

- [ ] Mantener el globo como pieza visual protagonista, flotante y envolvente.
- [ ] Conservar el contraste negro/dorado/blanco, con textos legibles y elegante jerarquía.
- [ ] Comprobar que móvil no recorte el globo ni el menú y que todo tenga accesibilidad.
- [ ] Mostrar referencias culturales como **referencias no verificadas**, nunca inventar alianzas.
- [ ] Corregir pantallas con exceso de texto antes del piloto.

**Pendientes técnicos para una vista previa interactiva privada:** habilitar alojamiento restringido por Access y autorización de despliegue, confirmar cero costos, completar auditoría de recursos externos y el P0 del consentimiento Auth. Las capturas permiten revisión visual **sin** saltarse esos bloqueos.
