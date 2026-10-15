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
  { name: '07-centro-de-confianza', route: 'confianza', width: 1440, height: 950 }
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
  note: 'Rendered screenshots, NOT a live website. A 3D globe requires a capable browser, internet to load globe.gl and map textures. The simplified globe is a real application fallback, not proof that the 3D experience is broken for everyone.',
  snapshots
};
await fs.writeFile(path.join(out, 'preview-manifest.json'), JSON.stringify(report, null, 2) + '\n');
if (snapshots.length !== pages.length) throw new Error('Incomplete ORIGEN preview screenshot set.');
