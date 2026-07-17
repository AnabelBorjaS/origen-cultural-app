# Origen Cultural — MVP social cultural

Aplicación web progresiva, responsive y lista para GitHub Pages. El prototipo convierte la identidad estratégica de **Origen Cultural** en una experiencia digital premium centrada en perfiles culturales, historias, exploración, seguimiento, favoritos, contacto directo y Pasaporte Cultural.

## Visión del producto

Origen Cultural es una red social cultural global que conecta **Exploradores Culturales** con **Creadores Culturales**. La primera etapa no administra ventas, inventario ni pagos: funciona como una puerta digital hacia los canales propios de cada creador.

## Funcionalidades incluidas

- Landing editorial y bilingüe ES/EN.
- Directorio cultural con búsqueda y filtros.
- Perfiles culturales premium con historia, galería, etiquetas y enlaces propios.
- Guardar perfiles y seguir creadores mediante `localStorage`.
- Feed de historias culturales por perfil.
- Pasaporte Cultural de demostración.
- Registro inicial de Explorador o Creador Cultural.
- Página de impacto, valores y roadmap.
- PWA instalable y navegación móvil.
- Accesibilidad básica: etiquetas, enfoque, contraste y reducción de movimiento.

## Sistema visual

- Negro `#000000`
- Blanco `#FFFFFF`
- Beige arena `#C8A97E`
- Gris claro `#E7E7E7`
- Titulares serif editorial + cuerpo sans serif limpio
- Fotografía cultural real, espacio visual, líneas finas y alto contraste

El isotipo oficial proporcionado por la fundadora fue vectorizado y está integrado en `assets/logo-mark.svg`. También se incluye el archivo maestro de entrega `assets/ORIGEN-isotipo-oficial.svg`. El logotipo horizontal de la navegación usa el mismo isotipo oficial en `assets/logo-lockup.svg`.

## Ejecutar localmente

```bash
python3 -m http.server 4173
```

Abrir `http://localhost:4173`.

## Publicar en GitHub Pages

1. Crear un repositorio nuevo en GitHub.
2. Copiar estos archivos en la rama `main`.
3. Hacer `git push`.
4. En **Settings → Pages**, seleccionar **GitHub Actions**.
5. El workflow `.github/workflows/pages.yml` publicará la app automáticamente.

## Estructura

```text
.
├── index.html
├── styles.css
├── app.js
├── data.js
├── service-worker.js
├── manifest.webmanifest
├── assets/
├── docs/
├── supabase/schema.sql
└── .github/workflows/pages.yml
```

## Próxima fase productiva

La base está preparada conceptualmente para migrar a Next.js + Supabase. Ver `docs/PRODUCT_ROADMAP.md`, `docs/BRAND_SYSTEM.md` y `docs/ARCHITECTURE.md`.

## Propiedad

© 2026 Origen Cultural. Todos los derechos reservados.
