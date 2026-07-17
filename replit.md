# Origen Cultural — MVP

Red social cultural global que conecta Exploradores Culturales con Creadores Culturales.

## Stack

- HTML + CSS + JavaScript puro (sin framework)
- PWA instalable con Service Worker
- `localStorage` para favoritos y seguidos
- Servidor de desarrollo: Python `http.server`

## Cómo ejecutar

```bash
python3 -m http.server 5000
```

El workflow **Start application** ya está configurado — simplemente usa el botón Run.

## Estructura de archivos

```
index.html          # Página principal (SPA de una sola página)
styles.css          # Sistema de diseño completo
app.js              # Toda la lógica de la app (routing, render, estado)
data.js             # Datos de los perfiles culturales (window.ORIGEN_DATA)
service-worker.js   # Cache offline (PWA)
manifest.webmanifest
assets/
  logo-lockup.svg          # Logo horizontal (navbar, footer, pasaporte)
  logo-mark.svg            # Isotipo (favicon)
  ORIGEN-isotipo-oficial.svg
  icon-192.png
  icon-512.png
  images/
    embroidery.jpg
    mural.jpg
    chawar.jpg
    territory.jpg
    gastronomy.jpg
    landscape.jpg
    dance.jpg
    caves.jpg
```

## Identidad visual oficial

| Token     | Valor     |
|-----------|-----------|
| Negro     | `#0D0D0D` |
| Blanco    | `#FFFFFF` |
| Dorado    | `#C8A97E` |
| Gris suave | `#E7E7E7` |

Tipografía: Libre Baskerville (titulares serif) + Garet / Avenir (cuerpo sans-serif)

## User preferences

- Mantener identidad visual oficial: negro `#0D0D0D`, blanco `#FFFFFF`, dorado `#C8A97E`
- Estilo premium, minimalista y cultural — sin cambios de stack ni restructuración
