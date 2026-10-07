import { chromium } from '@playwright/test';

const baseURL = process.env.ORIGEN_BASE_URL || 'http://127.0.0.1:4173/dist/';
const failures = [];
const note = (message) => console.log('[browser-qa]', message);
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const browser = await chromium.launch({ headless: true });

async function desktopChecks() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const pageErrors = [];
  const consoleMessages = [];
  const requestFailures = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', msg => {
    if (['warning','error'].includes(msg.type())) consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('requestfailed', request => requestFailures.push(`${request.url()} :: ${request.failure()?.errorText || 'failed'}`));

  await page.goto(baseURL + '#inicio', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => (document.querySelector('#main-content')?.innerText || '').trim().length > 40, null, { timeout: 20000 });

  check(await page.title() === 'Origen Cultural', 'Document title should be Origen Cultural');
  check(await page.locator('html').getAttribute('lang') === 'es', 'Default document language should be es');
  check(await page.locator('#main-content').innerText().then(t => t.trim().length > 40), 'Home should render meaningful content');

  await page.locator('#search-button').click();
  check(await page.locator('#search-dialog').evaluate(el => el.open === true), 'Search dialog should open');
  check(await page.locator('#global-search').getAttribute('aria-label') === 'Buscar cultura viva', 'Search input should have an accessible name');
  await page.keyboard.press('Escape');

  await page.evaluate(() => { location.hash = '#confianza'; });
  await page.waitForSelector('#main-content h1');
  check((await page.locator('#main-content h1').innerText()).includes('Centro de confianza'), 'Trust Center route should render');
  check(await page.locator('#main-content').innerText().then(t => t.includes('v1.2')), 'Trust Center should expose legal version v1.2');

  await page.locator('#language-toggle').click();
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  check(await page.locator('html').getAttribute('lang') === 'en', 'Language toggle should update html lang to en');
  check((await page.locator('#language-toggle').innerText()).trim() === 'ES', 'Language toggle should offer ES after switching to English');

  check(await page.evaluate(() => localStorage.getItem('origen-lang')) === 'en', 'English preference should persist in localStorage');
  await page.waitForLoadState('load');
  const swAudit = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { supported:false };

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    let registration = await navigator.serviceWorker.getRegistration();
    const appRegistered = !!registration;
    let manualRegisterError = '';

    if (!registration) {
      try {
        registration = await navigator.serviceWorker.register('service-worker.js');
      } catch (error) {
        manualRegisterError = String(error?.message || error);
      }
    }

    if (registration) {
      for (let i = 0; i < 100 && !registration.active; i += 1) {
        await wait(100);
        registration = await navigator.serviceWorker.getRegistration();
        if (!registration) break;
      }
    }

    const names = await caches.keys();
    const entries = [];
    for (const name of names) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      for (const request of requests) entries.push({ cache: name, url: request.url });
    }

    return {
      supported: true,
      appRegistered,
      manualRegisterError,
      registration: registration ? {
        scope: registration.scope,
        active: registration.active?.state || null,
        waiting: registration.waiting?.state || null,
        installing: registration.installing?.state || null
      } : null,
      names,
      entries,
      origin: location.origin
    };
  });

  check(swAudit.supported, 'Browser should support service workers');
  check(swAudit.appRegistered, 'ORIGEN should register its service worker from app.js. Diagnostics: ' + JSON.stringify(swAudit));
  check(swAudit.registration?.active === 'activated', 'Service worker should activate. Diagnostics: ' + JSON.stringify(swAudit));
  check(swAudit.names.includes('origen-cultural-v7'), 'Service worker should create origen-cultural-v7 cache. Diagnostics: ' + JSON.stringify(swAudit));
  check(swAudit.entries.length > 0, 'Service worker cache should contain public static assets');
  check(swAudit.entries.every(entry => new URL(entry.url).origin === swAudit.origin), 'Service worker cache must contain same-origin URLs only');
  check(swAudit.entries.every(entry => !/supabase\.co|cdn\.jsdelivr\.net|\/auth\//i.test(entry.url)), 'Service worker cache must not contain Supabase/CDN/Auth responses');
  await page.evaluate(() => { location.hash = '#login'; });
  await page.waitForSelector('#login-form');
  const loginLabels = await page.locator('#login-form input').evaluateAll(inputs =>
    inputs.map(input => [...input.labels].map(label => label.textContent.trim()).join(' '))
  );
  check(loginLabels.some(label => label.includes('Email address')), 'Login email input should have an English programmatic label');
  check(loginLabels.some(label => label.includes('Password')), 'Login password input should have an English programmatic label');

  check(pageErrors.length === 0, 'Desktop page should have no uncaught JavaScript errors: ' + pageErrors.join(' | '));
  if (failures.length) {
    note('Desktop console diagnostics: ' + JSON.stringify(consoleMessages));
    note('Desktop request failures: ' + JSON.stringify(requestFailures));
  }
  await page.close();
}

async function mobileChecks() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto(baseURL + '#inicio', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => (document.querySelector('#main-content')?.innerText || '').trim().length > 40, null, { timeout: 20000 });
  await page.waitForSelector('#menu-button');

  await page.locator('#menu-button').click();
  await page.waitForFunction(() => document.activeElement?.id === 'close-menu');
  check(await page.locator('#menu-button').getAttribute('aria-expanded') === 'true', 'Menu button should expose expanded state');
  check(await page.locator('#mobile-drawer').getAttribute('aria-hidden') === 'false', 'Mobile drawer should become visible');
  check(await page.locator('#close-menu').evaluate(el => document.activeElement === el), 'Focus should move into opened drawer');

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelector('#menu-button')?.getAttribute('aria-expanded') === 'false');
  check(await page.locator('#mobile-drawer').getAttribute('aria-hidden') === 'true', 'Closed drawer should be hidden from assistive tech');
  check(await page.locator('#menu-button').evaluate(el => document.activeElement === el), 'Focus should return to menu opener');

  await page.evaluate(() => { location.hash = '#registro'; });
  await page.waitForSelector('.auth-card');
  check(await page.locator('.auth-card').innerText().then(t => t.includes('Agente Cultural')), 'Registration should render Cultural Agent option');
  check(await page.locator('.auth-card').innerText().then(t => t.includes('Explorador Cultural')), 'Registration should render Cultural Explorer option');

  check(pageErrors.length === 0, 'Mobile page should have no uncaught JavaScript errors: ' + pageErrors.join(' | '));
  await page.close();
}

try {
  await desktopChecks();
  await mobileChecks();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('\nORIGEN Browser QA failed:');
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exit(1);
}

note('PASS — desktop + mobile anonymous browser checks completed.');
