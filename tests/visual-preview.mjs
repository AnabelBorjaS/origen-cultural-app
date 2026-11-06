// ORIGEN Cultural — visual-only review of actual disconnected beta bundle.
// Captures rendered pages in Chromium running on localhost; never deploys or signs in.
import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.ORIGEN_BASE_URL || 'http://127.0.0.1:4173/dist/';
const out = process.env.ORIGEN_PREVIEW_DIR || 'visual-preview';
if (!/^http:\/\/127\.0\.0\.1:4173\/dist\/$/.test(base)) {
  throw new Error('Visual preview may only capture the local disconnected bundle.');
}
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader']
});
const snapshots = [];
const pages = [
  { name: '01-portada-escritorio', route: 'inicio', width: 1440, height: 950, globe: 'hero' },
  { name: '02-portada-movil', route: 'inicio', width: 390, height: 844, globe: 'hero' },
  { name: '03-mundo-cultural-escritorio', route: 'mundo', width: 1440, height: 950, globe: 'world' },
  { name: '04-mundo-cultural-movil', route: 'mundo', width: 390, height: 844, globe: 'world' },
  { name: '05-explorar-comunidades', route: 'explorar', width: 1440, height: 950 },
  { name: '06-registro-beta-movil', route: 'registro', width: 390, height: 844 },
  { name: '07-centro-de-confianza', route: 'confianza', width: 1440, height: 950 },
  // Screenshots of real rendered controls, never a real account or secret.
  { name: '08-registro-contrasenas-movil', route: 'registro', width: 390, height: 844, capture: 'registration-passwords' },
  { name: '09-ojito-contrasena-movil', route: 'registro', width: 390, height: 844, capture: 'registration-eye' },
  { name: '10-recuperar-acceso-movil', route: 'recuperar', width: 390, height: 844 },
  { name: '11-restablecer-contrasena-movil', route: 'restablecer', width: 390, height: 844 },
  { name: '12-ayuda-contrasenas-movil', route: 'ayuda-contrasena', width: 390, height: 844 },
  { name: '13-brand-b-ecuador-con-fuente', route: 'inicio', width: 1440, height: 950, globe: 'hero', capture: 'hero-country', country: 'ecuador' },
  { name: '14-brand-b-japon-en-movil', route: 'inicio', width: 390, height: 844, globe: 'hero', capture: 'hero-country', country: 'japan', lang: 'en' },
  { name: '15-globo-dia-permanente-tablet', route: 'inicio', width: 768, height: 960, globe: 'hero' },
  { name: '16-mundo-cultural-dia-tablet', route: 'mundo', width: 768, height: 960, globe: 'world' }
];
try {
  for (const spec of pages) {
    const context = await browser.newContext({
      viewport: { width: spec.width, height: spec.height },
      locale: 'es-ES',
      colorScheme: 'light',
      serviceWorkers: 'block',
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    if (spec.lang === 'en') await page.addInitScript(() => localStorage.setItem('origen-lang', 'en'));
    let globeMode = null;
    try {
      await page.goto(base + '#' + spec.route, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      await page.waitForFunction(() =>
        (document.querySelector('#main-content')?.innerText || '').trim().length > 40,
      null, { timeout: 20000 });
      if (spec.globe) {
        const selector = spec.globe === 'hero' ? '#hero-globe-container' : '#globe-container';
        await page.locator(selector).waitFor({ timeout: 12000 });
        try {
          await page.waitForFunction(selector => {
            const el = document.querySelector(selector);
            return el && !!el.querySelector('canvas, .hero-globe-fallback, .fallback-globe');
          }, selector, { timeout: 17000 });
          globeMode = await page.locator(selector).evaluate(el => {
            return el.querySelector('canvas') ? '3D canvas' : 'simplified fallback';
          });
        } catch {
          globeMode = 'still loading / unavailable';
        }
        // Let the globe settle so its actual appearance is visible.
        await page.waitForTimeout(1000);
      }
      if (spec.capture === 'registration-passwords' || spec.capture === 'registration-eye') {
        // Display only the internal disconnected signup UI; no form submission.
        await page.locator('[data-atype="explorer"]').click();
        await page.locator('#reg-next').click();
        await page.locator('#register-password-confirm').waitFor();
        if (spec.capture === 'registration-eye') {
          // Clearly synthetic example, never an actual credential or API request.
          await page.locator('#register-password').fill('SoloEjemploNoUsar123!');
          await page.locator('[aria-controls="register-password"]').click();
        }
        await page.locator('#register-password-confirm').scrollIntoViewIfNeeded();
      }
      if (spec.capture === 'hero-country') {
        // Open the real bilingual cultural card with its official source.
        // No HTTP request to the source institution is made by this test.
        await page.locator('[data-hgt="' + spec.country + '"]').click();
        await page.locator('#hero-globe-popup:not([hidden]) .hpop-source-link').waitFor({ timeout: 12000 });
      }
      const title = await page.title();
      const mainText = (await page.locator('#main-content').innerText()).slice(0, 500);
      const filename = spec.name + '.png';
      await page.screenshot({ path: path.join(out, filename), fullPage: false, animations: 'disabled' });
      snapshots.push({
        filename, route: '#' + spec.route,
        viewport: spec.width + 'x' + spec.height,
        globeMode, title, rendered: true,
        visibleHeading: mainText.slice(0, 145)
      });
      console.log('[preview] ' + filename + (globeMode ? ' — ' + globeMode : ''));
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
const report = {
  provenance: 'Actual ORIGEN beta build, captured on ephemeral local GitHub Actions runner',
  source: 'reconcile-main-beta-2026-10-07',
  auth: 'DISABLED; no real account sign-in, no live backend, no deployment',
  note: 'Rendered screenshots, NOT a live website. ORIGEN intentionally uses a permanently daytime Earth image, independent of visitor time. 3D globe requires browser graphics support and internet access to load its map textures; the simplified globe is a fallback. No location access, real account, or publication is involved.',
  snapshots
};
await fs.writeFile(path.join(out, 'preview-manifest.json'), JSON.stringify(report, null, 2) + '\n');
if (snapshots.length !== pages.length) throw new Error('Incomplete ORIGEN preview screenshot set.');
