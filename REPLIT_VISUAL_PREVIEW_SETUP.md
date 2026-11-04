# ORIGEN — visualizar la beta actual en Replit, sin Agent ni publicar

**Estado del proyecto:** la versión segura para previsualización está preparada en la rama de GitHub `reconcile-main-beta-2026-10-07`. La aplicación antigua de Replit **todavía NO se ha sincronizado**. No se ha iniciado una actualización mediante Replit Agent ni se ha contratado nada.

## Por qué Replit

Replit puede ejecutar una aplicación de desarrollo y mostrarla en **Preview**. Esto no exige una publicación formal, pero **la dirección temporal de desarrollo es pública por defecto**. Una vista previa con URL accesible solo por la fundadora requiere habilitar **Private development URL** en herramientas de desarrollador → Networking, y verificarlo desde una ventana privada. Las URLs de desarrollo solo están disponibles mientras la app está ejecutándose.

## Preparación hecha en GitHub

- Código: https://github.com/AnabelBorjaS/origen-cultural-app/tree/reconcile-main-beta-2026-10-07
- El botón `Run` configurado en `.replit` construirá el sitio con `npm run build:visual-preview` y servirá la carpeta `dist` en el puerto 5000.
- El build falla si se introducen variables de Supabase o Turnstile. La beta visual utiliza una URL ficticia y un CSP que no permite conexiones a Supabase.
- Globo y Mundo Cultural funcionan en un navegador compatible con WebGL si se pueden descargar las librerías e imágenes 3D externas. Sin WebGL se usa la alternativa simplificada.

## Actualizar **sin sobrescribir** el Replit anterior

**No importar sobre la aplicación existente ni ejecutar `git reset --hard` ni reemplazar sus archivos antes de disponer de una copia comprobada.**

**Ruta recomendada:** crear un Replit de demostración **separado** por importación de GitHub. El asistente de importación de Replit suele utilizar la rama principal por defecto, que **NO** es nuestra beta; tras importar habría que escoger de manera explícita `reconcile-main-beta-2026-10-07` en Git antes de ejecutar el proyecto. Confirmar que la ruta temporal y `Run` ya usan la rama beta, no `main`.

Si Replit avisa de cobro, de uso de Agent o de consumo de créditos, **cancelar** y pedir confirmación de precio: Replit documenta que importaciones con trabajo de migración del Agent pueden gastar créditos y que el consumo depende de la complejidad. No podemos garantizar importe cero sin ver los límites de la cuenta.

Si la cuenta **no permite crear otra aplicación sin pagar** y la aplicación existente ya está vinculada al repositorio correcto, se podrá estudiar una actualización directa usando la pestaña Git y respaldo confirmado. Primero comprobar los cambios locales pendientes. **No sobrescribir una app de Replit solo porque coincida su nombre.**

## Pasos de visualización tras importar la rama correcta

1. Abrir el editor y la sección Preview.
2. En las herramientas del editor, Developer tools → Networking → activar **Private development URL** (si está disponible). Si no aparece, usar exclusivamente el panel Preview dentro de Replit; no enviar la URL temporal como privada.
3. Pulsa **Run**. El workflow debe indicar el modo visual sin backend y servir `dist` en el puerto 5000.
4. Explora `#inicio`, `#mundo`, `#explorar`, `#registro` y `#confianza`. No habrá usuarios reales.
5. Comprueba en ventana privada que, con el acceso privado habilitado, no se pueda entrar a la URL desde otra sesión.

## Opciones pendientes

- [ ] Verificar plan Replit y coste exacto mostrado para importar o actualizar la app.
- [ ] Confirmar que el proyecto importado apunta a la **rama beta**.
- [ ] Confirmar que la vista previa tiene acceso privado efectivo, no solo URL difícil de adivinar.
- [ ] Revisar visualmente 3D / tipografías / pantallas en Samsung y escritorio.
- [ ] No publicar, no usar dominio `origencultural.com`, no conectar Supabase.

Fuentes: [Replit Git Version Control](https://docs.replit.com/learn/projects-and-artifacts/version-control), [Import / Billing](https://docs.replit.com/build/import-from-providers), [Development URLs](https://docs.replit.com/core-concepts/project-editor/app-setup/development-urls).
