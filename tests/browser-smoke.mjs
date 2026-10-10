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
  const desktopOffline = page.locator('#connection-status');
  check(await desktopOffline.isHidden(), 'Connection notice must be hidden when the browser reports online');
  await page.context().setOffline(true);
  await page.waitForFunction(() => !document.querySelector('#connection-status')?.hidden);
  check((await desktopOffline.innerText()).includes('sin conexión'),
    'Desktop offline notice should explain unavailable account and publishing features in Spanish');
  await page.context().setOffline(false);
  await page.waitForFunction(() => document.querySelector('#connection-status')?.hidden);
  check(await desktopOffline.isHidden(), 'Desktop offline notice should disappear after reconnection');

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
  await page.context().setOffline(true);
  await page.waitForFunction(() => !document.querySelector('#connection-status')?.hidden);
  check((await page.locator('#connection-status').innerText()).includes('You appear to be offline.'),
    'Offline notice must follow the active English language');
  await page.context().setOffline(false);
  await page.waitForFunction(() => document.querySelector('#connection-status')?.hidden);

  check(await page.evaluate(() => localStorage.getItem('origen-lang')) === 'en', 'English preference should persist in localStorage');
  check(await page.locator('#report-dialog').getAttribute('aria-labelledby') === 'report-title', 'Report dialog should expose an accessible title relationship');
  const reportValues = await page.locator('#report-reason option').evaluateAll(options => options.map(option => option.value));
  check(['cultural_rights','harassment','impersonation','spam','copyright','other'].every(value => reportValues.includes(value)), 'Report dialog should expose canonical moderation reason codes');
  check((await page.locator('#report-submit').innerText()).trim() === 'Submit report', 'Report dialog controls should follow active English locale');
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
  check(swAudit.names.includes('origen-cultural-v8'), 'Service worker should create origen-cultural-v8 cache. Diagnostics: ' + JSON.stringify(swAudit));
  check(swAudit.entries.length > 0, 'Service worker cache should contain public static assets');
  check(swAudit.entries.every(entry => new URL(entry.url).origin === swAudit.origin), 'Service worker cache must contain same-origin URLs only');
  check(swAudit.entries.every(entry => !/supabase\.co|cdn\.jsdelivr\.net|\/auth\//i.test(entry.url)), 'Service worker cache must not contain Supabase/CDN/Auth responses');
  check(swAudit.entries.every(entry => !/\/(?:supabase-client|runtime-config)\.js(?:[?#]|$)/i.test(entry.url)),
    'Service worker must never cache old Supabase backend code or runtime configuration');
  // Force a normal network request while the service worker is installed.
  // Neither security file may enter Cache Storage as a side effect.
  await page.evaluate(async () => {
    await Promise.all(['supabase-client.js', 'runtime-config.js'].map(file =>
      fetch(file, { cache: 'reload' }).then(r => {
        if (!r.ok) throw new Error('Could not fetch security runtime for SW cache QA: '+file);
      })
    ));
  });
  const securityCacheEntries = await page.evaluate(async () => {
    const urls = [];
    for (const name of await caches.keys()) {
      const store = await caches.open(name);
      for (const req of await store.keys()) urls.push(req.url);
    }
    return urls.filter(url => /\/(?:supabase-client|runtime-config)\.js(?:[?#]|$)/i.test(url));
  });
  check(securityCacheEntries.length === 0,
    'Security runtime must remain uncached after explicit network fetch: ' + securityCacheEntries.join(', '));
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

  await page.context().setOffline(true);
  await page.waitForFunction(() => !document.querySelector('#connection-status')?.hidden);
  check(await page.locator('#connection-status').isVisible(),
    'Mobile offline warning should remain visible without obscuring navigation');
  check(await page.locator('#connection-status').evaluate(el => el.scrollWidth <= el.clientWidth + 1),
    'Mobile connectivity message must not overflow horizontally');
  await page.context().setOffline(false);
  await page.waitForFunction(() => document.querySelector('#connection-status')?.hidden);

  await page.evaluate(() => { location.hash = '#registro'; });
  await page.waitForSelector('.auth-card');
  check(await page.locator('.auth-card').innerText().then(t => t.includes('Agente Cultural')), 'Registration should render Cultural Agent option');
  check(await page.locator('.auth-card').innerText().then(t => t.includes('Explorador Cultural')), 'Registration should render Cultural Explorer option');

  // Cultural Agent onboarding from a real 390px mobile viewport, without
  // signing up or making authenticated Supabase write requests.
  await page.locator('[data-atype="creator"]').click();
  await page.locator('#reg-next').click();
  await page.locator('#reg-basic [name="name"]').fill('Artisana Yaruquí');
  await page.locator('#reg-basic [name="email"]').fill('piloto@qa.invalid');
  await page.locator('#reg-basic [name="password"]').fill('ExampleSecure2026!');
  await page.locator('#reg-basic [name="location"]').fill('Yaruquí, Ecuador');
  await page.locator('#reg-basic [name="location"]').press('Enter');
  await page.locator('#reg-avatar-input').waitFor({ state: 'attached', timeout: 8000 });
  const currentSignupStep = await page.locator('.wizard-label').innerText();
  check(/(?:paso|step)\s+3\b/i.test(currentSignupStep),
    'Pressing Enter in mobile signup should advance to step 3 (actual: ' + currentSignupStep + ')');

  await page.locator('#reg-back').click();
  check(await page.locator('#reg-basic [name="name"]').inputValue() === 'Artisana Yaruquí',
    'Returning from photo step must retain the mobile creator name');
  check(await page.locator('#reg-basic [name="password"]').inputValue() === 'ExampleSecure2026!',
    'Returning to basic step should not force retyping the password mid-wizard');
  check(await page.locator('#reg-basic [name="location"]').inputValue() === 'Yaruquí, Ecuador',
    'Returning from photo step must retain the creator territory');
  await page.locator('#reg-next').click();

  await page.locator('#reg-avatar-input').setInputFiles({
    name: 'not-an-image.pdf', mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.7 sample')
  });
  check((await page.locator('#reg-error').innerText()).includes('Formato no permitido'),
    'Invalid registration avatar must be rejected immediately');
  check(await page.locator('#reg-avatar-zone img').count() === 0,
    'Rejected avatar must not create a misleading preview');
  await page.locator('#reg-avatar-input').setInputFiles({
    name: 'artisan-portrait.jpg', mimeType: 'image/jpeg',
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9])
  });
  check(await page.locator('#reg-avatar-zone img').count() === 1,
    'Valid optional avatar should preview on mobile');
  await page.locator('#reg-next').click();

  await page.locator('#reg-story [name="story"]').fill('Un oficio que aprendimos de nuestras mayores.');
  await page.locator('#reg-story [name="providerHeadline"]').fill('Tejidos tradicionales de Yaruquí');
  await page.locator('#reg-story [name="services"]').fill('Talleres, Demostraciones');
  await page.locator('[data-cat="Artesanía y tradición"]').click();
  await page.locator('#reg-back').click();
  await page.locator('#reg-next').click();
  check(await page.locator('#reg-story [name="story"]').inputValue() === 'Un oficio que aprendimos de nuestras mayores.',
    'Going back to photo step must not erase an unsaved cultural story');
  check(await page.locator('#reg-story [name="services"]').inputValue() === 'Talleres, Demostraciones',
    'Creator offerings must survive back and next');
  check(await page.locator('[data-cat="Artesanía y tradición"]').getAttribute('aria-pressed') === 'true',
    'Canonical cultural category selection must persist across wizard steps');
  await page.locator('#reg-next').click();
  await page.locator('#reg-social [name="instagram"]').fill('@tejidosyaruqui');
  await page.locator('#reg-social [name="acceptedLegal"]').check();
  await page.locator('#reg-back').click();
  await page.locator('#reg-next').click();
  check(await page.locator('#reg-social [name="instagram"]').inputValue() === '@tejidosyaruqui',
    'Mobile creator social link must persist when revisiting legal step');
  check(await page.locator('#reg-social [name="acceptedLegal"]').isChecked(),
    'Explicit user-ticked legal acceptance must stay checked after going back');

  // Real-browser regression: reading legal terms must not navigate away from
  // or erase the partially completed multi-step mobile registration wizard.
  const legalLink = page.locator('#reg-social .legal-consent a[href="#confianza"]');
  check(await legalLink.getAttribute('target') === '_blank',
    'Trust Center review link must open a separate tab');
  check(await legalLink.getAttribute('rel') === 'noopener noreferrer',
    'Legal review link must not expose the original signup tab via window.opener');
  const [trustTab] = await Promise.all([
    page.waitForEvent('popup', { timeout: 10000 }),
    legalLink.click()
  ]);
  await trustTab.waitForSelector('#main-content h1', { timeout: 10000 });
  check((await trustTab.locator('#main-content h1').innerText()).includes('Centro de confianza'),
    'Opening legal review should show the Trust Center in a new tab');
  check(await page.evaluate(() => location.hash === '#registro'),
    'Opening legal review must keep the original registration route intact');
  check(await page.locator('#reg-social [name="instagram"]').inputValue() === '@tejidosyaruqui',
    'Legal review must not discard social links entered in mobile registration');
  check(await page.locator('#reg-social [name="acceptedLegal"]').isChecked(),
    'Legal review must preserve the explicit consent checkbox without resetting it');
  await trustTab.close();

  check((await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)),
    'Mobile signup must not overflow viewport horizontally');

  check(pageErrors.length === 0, 'Mobile page should have no uncaught JavaScript errors: ' + pageErrors.join(' | '));
  await page.close();
}


async function roleChecks(role) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.addInitScript(({ role }) => {
    const id = role === 'creator'
      ? '11111111-1111-1111-1111-111111111111'
      : '22222222-2222-2222-2222-222222222222';
    const profile = {
      id,
      role,
      display_name: role === 'creator' ? 'QA Cultural Agent' : 'QA Cultural Explorer',
      location: 'QA Territory',
      story: '',
      categories: [],
      links: {},
      avatar_url: null,
      cover_url: null
    };
    const normalized = {
      id,
      email: role + '@qa.invalid',
      name: profile.display_name,
      accountType: role,
      role,
      location: profile.location,
      story: '',
      categories: [],
      links: {},
      avatar: null,
      cover: null,
      providerHeadline: '',
      services: [],
      serviceDescription: ''
    };

    let currentApi;
    window.__postSafetyQA = { uploads: 0, writes: 0, payload: null };
    Object.defineProperty(window, 'ORIGEN_API', {
      configurable: true,
      get() { return currentApi; },
      set(api) {
        currentApi = api;
        api.upload = async () => {
          window.__postSafetyQA.uploads++;
          return 'https://xwkjvoyicrrwjybjolld.supabase.co/storage/v1/object/public/post-media/qa/preview.webm';
        };
        api.createPost = async payload => {
          window.__postSafetyQA.writes++;
          window.__postSafetyQA.payload = payload;
          return { id: 'qa-post' };
        };
        const prime = () => {
          api.cache.session = { user: { id, email: normalized.email } };
          api.cache.profile = profile;
          api.cache.culturalProfiles = [];
          api.cache.publicProfiles = [];
          api.cache.posts = [];
          api.cache.follows = [];
          api.cache.favorites = [];
          api.cache.likes = [];
          api.cache.saves = [];
          api.cache.comments = [];
        };
        prime();
        api.restoreSession = async () => { prime(); return normalized; };
        api.listCulturalProfiles = async () => { api.cache.culturalProfiles = []; return []; };
        api.listPublicProfiles = async () => { api.cache.publicProfiles = []; return []; };
        api.ensureCreatorCulturalProfile = async () => null;
        api.myFollows = async () => { api.cache.follows = []; return []; };
        api.myFavorites = async () => { api.cache.favorites = []; return []; };
        api.listPosts = async () => { api.cache.posts = []; return []; };
        api.loadPostInteractions = async () => {
          api.cache.likes = [];
          api.cache.saves = [];
          api.cache.comments = [];
        };
      }
    });
  }, { role });

  await page.goto(baseURL + '#crear', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => (document.querySelector('#main-content')?.innerText || '').trim().length > 20, null, { timeout: 20000 });

  if (role === 'explorer') {
    check(await page.locator('#create-form').count() === 0, 'Explorer should not receive the create-post form during Beta');
    check(await page.locator('#main-content').innerText().then(t => t.includes('El feed cultural es para Agentes Culturales')), 'Explorer create route should explain Beta publishing scope');
    check(await page.locator('.desktop-nav a[href="#crear"]').count() === 0, 'Explorer desktop navigation should not expose Create');
  } else {
    await page.waitForSelector('#create-form');
    check(await page.locator('#create-form').count() === 1, 'Cultural Agent should receive the create-post form');
    check(await page.locator('.desktop-nav a[href="#crear"]').count() === 1, 'Cultural Agent desktop navigation should expose Create');
    check(await page.locator('[data-ctype="text"]').count() === 0, 'Cultural Agent should not receive a text-only post type');

    // A live preview must not destroy the text input when the creator pauses.
    const title = page.locator('#create-form [name="title"]');
    await title.fill('Memoria del tejido');
    await page.waitForTimeout(460);
    check(await title.evaluate(el => el === document.activeElement),
      'Typing pause must retain title focus instead of re-rendering the form');
    await page.keyboard.type(' en Ecuador');
    check(await title.inputValue() === 'Memoria del tejido en Ecuador',
      'Cultural Agent must be able to keep writing after preview refresh');

    const story = page.locator('#create-form [name="description"]');
    await story.fill('Una historia de nuestras raíces.');
    await page.waitForTimeout(460);
    check(await story.evaluate(el => el === document.activeElement),
      'Typing pause must retain cultural story textarea focus');
    check((await page.locator('#create-live-preview').innerText()).includes('Una historia de nuestras raíces.'),
      'Non-destructive live preview should update with cultural story');

    // Video uploads must display a playable element, not a broken img tag.
    await page.locator('[data-ctype="video"]').click();
    await page.locator('#post-media-input').setInputFiles({
      name: 'qa-culture.webm', mimeType: 'video/webm',
      buffer: Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x9f])
    });
    check(await page.locator('#post-media-zone video[controls]').count() === 1,
      'Video upload should display video controls in upload preview');
    check(await page.locator('#create-live-preview video').count() === 1,
      'Video upload should display a video in live post preview');
    check(await page.locator('#post-media-zone img').count() === 0,
      'Video upload must not render a broken image thumbnail');
    check(await page.locator('#create-form [name="title"]').inputValue() === 'Memoria del tejido en Ecuador',
      'Switching media type must preserve the unsaved cultural story title');

    const pickerTriggers = await page.evaluate(() => {
      const input = document.getElementById('post-media-input');
      let calls = 0;
      input.click = () => { calls++; };
      document.querySelector('#post-media-zone video')
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return calls;
    });
    check(pickerTriggers === 0, 'Interacting with video playback must not open the file chooser');

    // Publishing declarations must be explicit, per draft, before any upload.
    const rights = page.locator('#create-form [name="rightsAcknowledged"]');
    const cultural = page.locator('#create-form [name="culturalAcknowledged"]');
    check(await rights.count() === 1 && await cultural.count() === 1,
      'Creator needs two independent pre-publication rights declarations');
    await page.locator('#create-form button[type="submit"]').click();
    check(await page.evaluate(() => window.__postSafetyQA.uploads) === 0,
      'Native required validation prevents upload without consent');
    await rights.check();
    await page.locator('#create-form button[type="submit"]').click();
    check(await page.evaluate(() => window.__postSafetyQA.uploads) === 0,
      'One declaration cannot authorize media upload');
    await cultural.check();

    // Replacing any part of the content must invalidate prior declarations.
    await story.fill('Una historia ampliada y revisada.');
    check(!await rights.isChecked() && !await cultural.isChecked(),
      'Changing cultural story invalidates both prior declarations');
    await rights.check();
    await cultural.check();
    await page.locator('#post-media-input').setInputFiles({
      name: 'updated-culture.webm', mimeType: 'video/webm',
      buffer: Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0xa0])
    });
    check(!await rights.isChecked() && !await cultural.isChecked(),
      'Replacing attached video invalidates both prior declarations');

    await rights.check();
    await cultural.check();
    await page.locator('#create-form button[type="submit"]').click();
    await page.waitForFunction(() => window.__postSafetyQA.writes === 1, null, { timeout: 12000 });
    const safety = await page.evaluate(() => window.__postSafetyQA);
    check(safety.uploads === 1 && safety.writes === 1,
      'Completed declarations permit exactly one media upload and post');
    check(safety.payload?.rightsAcknowledged === true && safety.payload?.culturalAcknowledged === true,
      'The client API receives explicit permissions declarations');

    // Signed-in report route must keep the current reporter identity,
    // canonical reason, target and details. This is a mocked server response.
    await page.evaluate(() => {
      const api = window.ORIGEN_API;
      const id = api.cache.session.user.id;
      api.cache.posts = [{
        id: 'qa-cultural-rights-post', authorId: id, type: 'photo', media: [],
        title: 'QA Cultural Story', description: 'A fictional weaving story.',
        timestamp: new Date().toISOString(), category: 'Artesanía', likes: 0
      }];
      window.__reportQA = { writes: 0, payload: null, expectedId: '' };
      api.report = async (payload, expectedId) => {
        window.__reportQA = { writes: 1, payload, expectedId };
        return { id: 'qa-report-id' };
      };
      location.hash = '#explorar';
    });
    await page.waitForSelector('#explore-grid', { timeout: 12000 });
    await page.evaluate(() => { location.hash = '#feed'; });
    const reportPost = page.locator('[data-report="qa-cultural-rights-post"]');
    await reportPost.waitFor({ timeout: 12000 });
    await reportPost.click();
    check(await page.locator('#report-dialog').evaluate(el => el.open),
      'Signed-in reporter can open the report modal from a post');
    await page.locator('#report-reason').selectOption('cultural_rights');
    await page.locator('#report-details').fill('Solicito revisión por conocimientos sensibles.');
    await page.locator('#report-submit').click();
    await page.waitForFunction(() => window.__reportQA.writes === 1, null, { timeout: 8000 });
    const reportQA = await page.evaluate(() => ({
      ...window.__reportQA, uid: window.ORIGEN_API.cache.session.user.id,
      dialogOpen: document.getElementById('report-dialog').open
    }));
    check(reportQA.expectedId === reportQA.uid,
      'Report must pass original signed-in account ID to API');
    check(reportQA.payload?.target_type === 'post' &&
      reportQA.payload?.target_id === 'qa-cultural-rights-post' &&
      reportQA.payload?.reason === 'cultural_rights',
      'Report sends the exact canonical target and reason');
    check(reportQA.payload?.details === 'Solicito revisión por conocimientos sensibles.',
      'Report preserves the submitted complaint context');
    check(reportQA.dialogOpen === false,
      'Report modal should close only after mocked submission succeeds');
  }

  await page.close();
}

async function publicCulturalStoryChecks() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const postId = '11111111-1111-4111-8111-111111111111';
  const creatorId = '22222222-2222-4222-8222-222222222222';
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(({ postId, creatorId }) => {
    window.__storyQA = { reads: [], copied: '', exists: true };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: { writeText: async url => { window.__storyQA.copied = url; } }
    });
    let currentApi;
    Object.defineProperty(window, 'ORIGEN_API', {
      configurable: true,
      get() { return currentApi; },
      set(api) {
        currentApi = api;
        api.restoreSession = async () => null;
        api.listPosts = async () => [];
        api.listCulturalProfiles = async () => [];
        api.listPublicProfiles = async () => {
          api.cache.publicProfiles = [{
            id: creatorId, role: 'creator', display_name: 'Artesana de prueba',
            country: 'Ecuador', city: 'Yaruquí', bio: '', links: {},
            categories: ['Artesanía']
          }];
          return api.cache.publicProfiles;
        };
        api.listComments = async id => {
          api.cache.comments = [{
            id: 'story-comment-qa', post_id: id, user_id: creatorId,
            body: 'Gracias por compartir esta historia',
            created_at: new Date().toISOString()
          }];
          return api.cache.comments;
        };
        api.getPublicPost = async id => {
          window.__storyQA.reads.push(id);
          if (!window.__storyQA.exists || id !== postId) return null;
          return {
            id: postId, authorId: creatorId, type: 'video', title: 'Arte del tejido',
            description: 'Una historia de tejido, narrada con permiso.',
            timestamp: new Date().toISOString(), territory: 'Ecuador', media: [],
            contentPurpose: 'education', tags: [], likes: 0, category: 'Artesanía'
          };
        };
      }
    });
  }, { postId, creatorId });

  try {
    await page.goto(baseURL + '#publicacion/' + postId, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('#public-story-content .post-card').waitFor({ timeout: 18000 });
    check(await page.locator('#public-story-content .post-title').innerText() === 'Arte del tejido',
      'Anonymous visitor can read exact public cultural story without logging in');
    check(await page.locator('#public-story-content .post-author-info strong').innerText().then(t => t.includes('Artesana de prueba')),
      'Shared story keeps its Cultural Agent attribution');
    check(await page.locator('#public-story-content .post-desc').innerText().then(t => t.includes('con permiso')),
      'Shared story keeps cultural explanation and context');
    check(await page.locator('#public-story-content .post-author-link').getAttribute('href') === '#usuario/' + creatorId,
      'Shared story links to its creator profile');
    check(await page.locator('#public-story-content .post-title a').getAttribute('href') === '#publicacion/' + postId,
      'Story title links to its own permanent route');

    await page.locator('#public-story-content [data-share]').click();
    await page.waitForFunction(() => !!window.__storyQA.copied, null, { timeout: 6000 });
    const copied = await page.evaluate(() => window.__storyQA.copied);
    check(copied.endsWith('#publicacion/' + postId) && !copied.includes('#feed'),
      'Share action copies URL for the exact post, not generic feed');

    await page.locator('#public-story-content [data-tcoms]').click();
    await page.locator('#public-story-content .com-bubble').waitFor({ timeout: 7000 });
    check((await page.locator('#public-story-content .com-bubble').innerText()).includes('Gracias por compartir'),
      'Comments can be opened on a permalink not present in the paginated feed cache');

    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      'Public story must not overflow mobile viewport');

    await page.evaluate(() => { document.getElementById('language-toggle').click(); });
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    check((await page.locator('#main-content h1').innerText()).includes('A story to discover'),
      'Public story works in English');

    await page.evaluate(() => { window.__storyQA.exists = false; location.hash = '#publicacion/33333333-3333-4333-8333-333333333333'; });
    await page.locator('#public-story-content .empty-feed').waitFor({ timeout: 10000 });
    check((await page.locator('#public-story-content').innerText()).includes('Story unavailable'),
      'Missing/unpublished post route does not show previous story');
    check(!await page.locator('#public-story-content .post-card').count(),
      'No stale story remains visible after post becomes unavailable');

    await page.evaluate(() => { location.hash = '#publicacion/javascript:alert(1)'; });
    await page.waitForFunction(() => (document.querySelector('#public-story-content')?.innerText || '').includes('Story unavailable'));
    check(!await page.locator('#public-story-content .post-card').count(),
      'Malformed permalink does not display cultural content');
    check(pageErrors.length === 0, 'Public cultural story has no uncaught browser errors: ' + pageErrors.join(' | '));
  } catch (error) {
    failures.push('Public cultural story regression: ' + (error?.message || error));
  } finally {
    await page.close();
  }
}

async function publicRightsReviewChecks() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  try {
    await page.goto(baseURL + '#solicitar-revision/post/qa-culture-post', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('#rights-review-form').waitFor({ timeout: 15000 });
    check((await page.locator('#main-content h1').innerText()).includes('Solicitar revisión'),
      'Unauthenticated visitor should see public review request form');
    check((await page.locator('#rights-reference').inputValue()) === 'post: qa-culture-post',
      'Linked post ID should prefill the human support reference');
    check(await page.locator('#rights-email-ready').isHidden(),
      'Review request must not falsely claim email was sent');
    check(!await page.locator('#rights-email-link').getAttribute('href'),
      'No active email sending action exists until user prepares their request');

    await page.locator('#rights-reason').selectOption('cultural_knowledge');
    await page.locator('#rights-description').fill('Este contenido comparte un conocimiento comunitario sin autorización.');
    await page.locator('#rights-review-form button[type="submit"]').click();
    await page.locator('#rights-email-ready:visible').waitFor({ timeout: 5000 });
    const link = await page.locator('#rights-email-link').getAttribute('href');
    const email = new URL(link);
    const body = email.searchParams.get('body') || '';
    check(link.startsWith('mailto:info.origencultural@gmail.com?'),
      'Prepared review request must use only the official ORIGEN contact address');
    check(body.includes('qa-culture-post') && body.includes('Cultural knowledge') && body.includes('comunitario sin autorización'),
      'Prepared email should contain selected reason, accurate reference, and complaint details');
    check((await page.locator('#rights-email-ready').innerText()).includes('NO se ha enviado'),
      'Prepared email must clearly say that it has not been submitted');

    await page.locator('#rights-description').fill('Contenido actualizado con información corregida.');
    check(await page.locator('#rights-email-ready').isHidden(),
      'Editing details must hide outdated prepared email');
    check(!await page.locator('#rights-email-link').getAttribute('href'),
      'Editing complaint must clear outdated email body link');

    await page.evaluate(() => document.getElementById('language-toggle').click());
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    check((await page.locator('#main-content h1').innerText()).includes('Request a content review'),
      'Public rights review form should support English');
    check((await page.locator('#main-content').innerText()).includes('does not guarantee automatic removal'),
      'Public rights review should not promise automatic takedown');
    check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      'Public request flow must not overflow a 390px mobile viewport');
    check(pageErrors.length === 0, 'Public review page should not throw JavaScript errors: ' + pageErrors.join(' | '));

    await page.evaluate(() => { location.hash = '#perfil/pakarina'; });
    await page.locator('.profile-trust-notice').waitFor({ timeout: 10000 });
    check(await page.locator('.profile-trust-notice a[href="#solicitar-revision/perfil/pakarina"]').count() === 1,
      'Editorial reference must offer direct correction route with profile context');
  } catch (error) {
    failures.push('Public rights review regression: ' + (error?.message || error));
  } finally {
    await page.close();
  }
}

async function publicProfileStatusChecks() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  try {
    await page.goto(baseURL + '#explorar', { waitUntil: 'domcontentloaded' });
    await page.locator('#explore-grid .creator-card').first().waitFor({ timeout: 15000 });
    check(await page.locator('#explore-grid .profile-trust-reference').count() >= 4,
      'Editorial references need visible status on directory cards');
    await page.evaluate(() => { location.hash = '#perfil/pakarina'; });
    await page.locator('.profile-trust-notice.profile-trust-reference').waitFor({ timeout: 12000 });
    check((await page.locator('.profile-trust-notice').innerText()).includes('no oficial'),
      'Editorial reference should disclose non-official status');
    check(await page.locator('.profile-trust-notice a[href="#reclamar/pakarina"]').count() === 1,
      'Reference should expose a controlled claim route');
    check((await page.locator('.profile-aside').innerText()).includes('Perfil de referencia · no oficial'),
      'Reference metadata must match its explicit status');
    check(!(await page.locator('.profile-aside').innerText()).includes('En proceso'),
      'Reference cannot imply a verification process');

    const publicId = '99999999-9999-4999-8999-999999999999';
    await page.evaluate(id => {
      window.ORIGEN_API.cache.publicProfiles = [{
        id, role: 'creator', display_name: 'QA Artisan',
        location: 'Yaruquí, Ecuador', categories: ['Artesanía y tradición'],
        links: {}, avatar_url: '', created_at: '2026-10-08'
      }];
      location.hash = '#explorar';
    }, publicId);
    const card = page.locator('#explore-grid .creator-card').filter({ hasText: 'QA Artisan' });
    await card.waitFor({ timeout: 12000 });
    check((await card.innerText()).includes('Cuenta sin verificar'),
      'Registered Cultural Agent should not be described as verified');
    await page.evaluate(id => { location.hash = '#usuario/' + id; }, publicId);
    await page.locator('.profile-trust-notice.profile-trust-unverified').waitFor({ timeout: 12000 });
    check(await page.locator('.profile-trust-notice a[href^="#reclamar/"]').count() === 0,
      'Registered profile must not inherit a reference claim action');
    await page.evaluate(() => document.getElementById('language-toggle').click());
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    check((await page.locator('.profile-trust-notice').innerText()).includes('Self-managed account'),
      'Self-managed disclosure needs English translation');
  } catch (error) {
    failures.push('Public reference trust QA: ' + (error?.message || error));
  } finally {
    await page.close();
  }
}

async function profileMediaRollbackChecks() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => {
    const user = {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      email: 'profile-qa@example.invalid',
      name: 'Profile QA Creator', accountType: 'creator', role: 'creator',
      location: 'QA Territory', story: '', avatar: '', cover: '', links: {},
      categories: [], services: []
    };
    window.__origenProfileQA = { uploads: [], removed: [], saved: 0 };
    let currentApi;
    Object.defineProperty(window, 'ORIGEN_API', {
      configurable: true,
      get() { return currentApi; },
      set(api) {
        currentApi = api;
        api.cache.session = { user: { id: user.id, email: user.email } };
        api.cache.profile = { id: user.id, role: 'creator', display_name: user.name };
        api.restoreSession = async () => user;
        api.ensureCreatorCulturalProfile = async () => null;
        api.listCulturalProfiles = async () => [];
        api.listPublicProfiles = async () => [];
        api.listPosts = async () => [];
        api.myFollows = async () => [];
        api.myFavorites = async () => [];
        api.loadPostInteractions = async () => null;
        api.upload = async (bucket) => {
          window.__origenProfileQA.uploads.push(bucket);
          if (bucket === 'covers') throw new Error('Simulated cover upload failure');
          return 'https://xwkjvoyicrrwjybjolld.supabase.co/storage/v1/object/public/avatars/' + user.id + '/qa-avatar.webp';
        };
        api.removeOwnMedia = async url => {
          window.__origenProfileQA.removed.push(url);
          return true;
        };
        api.updateMyProfile = async () => {
          window.__origenProfileQA.saved++;
          return user;
        };
      }
    });
  });

  try {
    await page.goto(baseURL + '#editar-perfil', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('#edit-form').waitFor({ timeout: 12000 });
    await page.locator('#edit-avatar-input').setInputFiles({
      name: 'avatar.webp', mimeType: 'image/webp',
      buffer: Buffer.from([0x52, 0x49, 0x46, 0x46, 0x01, 0, 0, 0])
    });
    await page.locator('#edit-cover-input').setInputFiles({
      name: 'cover.webp', mimeType: 'image/webp',
      buffer: Buffer.from([0x52, 0x49, 0x46, 0x46, 0x01, 0, 0, 0])
    });
    await page.locator('#edit-form button[type="submit"]').click();
    await page.waitForFunction(() => window.__origenProfileQA.removed.length === 1, null, { timeout: 12000 });
    const result = await page.evaluate(() => window.__origenProfileQA);
    check(result.uploads.join(',') === 'avatars,covers', 'Profile QA must attempt both media uploads');
    check(result.saved === 0, 'Failed cover upload must not save an incomplete profile');
    check(result.removed.length === 1 && result.removed[0].includes('/avatars/'),
      'Failed cover upload must remove previously uploaded avatar');
    check(await page.locator('#edit-form').count() === 1,
      'Failed profile media upload should keep edit form available for retry');
  } catch (error) {
    failures.push('Profile media rollback regression: ' + (error?.message || error));
  } finally {
    await page.close();
  }
}

async function sessionDraftIsolationChecks() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.addInitScript(() => {
    const creator = (id, name) => ({
      id, email: id + '@qa.invalid', name, accountType: 'creator', role: 'creator',
      location: 'QA', story: '', categories: [], links: {}, avatar: '', cover: '',
      services: [], providerHeadline: '', serviceDescription: ''
    });
    const userA = creator('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'First Cultural Agent');
    const userB = creator('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Second Cultural Agent');
    let activeUser = userA;

    window.__origenPrivacyQA = { revokedPreviews: 0, signOuts: 0 };
    const originalRevoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = url => {
      window.__origenPrivacyQA.revokedPreviews++;
      return originalRevoke(url);
    };

    let currentApi;
    Object.defineProperty(window, 'ORIGEN_API', {
      configurable: true,
      get() { return currentApi; },
      set(api) {
        currentApi = api;
        function prime() {
          api.cache.session = activeUser ? { user: { id: activeUser.id, email: activeUser.email } } : null;
          api.cache.profile = activeUser ? { id: activeUser.id, role: 'creator', display_name: activeUser.name } : null;
          api.cache.culturalProfiles = [];
          api.cache.publicProfiles = [];
          api.cache.posts = [];
          api.cache.follows = [];
          api.cache.favorites = [];
          api.cache.likes = [];
          api.cache.saves = [];
          api.cache.comments = [];
        }
        api.restoreSession = async () => { prime(); return activeUser; };
        api.signOut = async () => {
          window.__origenPrivacyQA.signOuts++;
          activeUser = null;
          prime();
        };
        api.signIn = async () => {
          activeUser = userB;
          prime();
          return userB;
        };
        api.listCulturalProfiles = async () => [];
        api.listPublicProfiles = async () => [];
        api.ensureCreatorCulturalProfile = async () => null;
        api.myFollows = async () => [];
        api.myFavorites = async () => [];
        api.listPosts = async () => [];
        api.loadPostInteractions = async () => null;
        prime();
      }
    });
  });

  try {
    await page.goto(baseURL + '#crear', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('#create-form').waitFor({ timeout: 15000 });
    await page.locator('#create-form [name="title"]').fill('CONFIDENTIAL DRAFT FROM ACCOUNT A');
    await page.waitForTimeout(500); // allow preview debounce to finish

    await page.locator('#post-media-input').setInputFiles({
      name: 'private-a.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9])
    });
    await page.waitForFunction(() => document.querySelectorAll('#post-media-zone img').length > 0, null, { timeout: 8000 });
    await page.evaluate(() => { window.location.hash = '#editar-perfil'; });
    await page.locator('#logout-btn').waitFor({ timeout: 12000 });
    await page.locator('#logout-btn').click();
    await page.waitForFunction(() => location.hash === '#inicio', null, { timeout: 12000 });

    const qaAfterLogout = await page.evaluate(() => window.__origenPrivacyQA);
    check(qaAfterLogout.signOuts === 1, 'Log-out should invoke Auth signOut exactly once');
    check(qaAfterLogout.revokedPreviews >= 1, 'Log-out should revoke a private unsaved blob preview');

    await page.evaluate(() => { window.location.hash = '#login'; });
    await page.locator('#login-form [name="email"]').fill('second@qa.invalid');
    await page.locator('#login-form [name="password"]').fill('not-a-real-password');
    await page.locator('#login-form button[type="submit"]').click();
    await page.waitForFunction(() => location.hash === '#feed', null, { timeout: 12000 });

    await page.evaluate(() => { window.location.hash = '#crear'; });
    await page.locator('#create-form [name="title"]').waitFor({ timeout: 12000 });
    const title = await page.locator('#create-form [name="title"]').inputValue();
    check(title === '', 'Account B must not inherit account A unpublished post title');
    check(await page.locator('#post-media-zone img').count() === 0, 'Account B must not inherit account A media preview');

    // Simulate a cross-tab SIGNED_OUT event while a privileged route is open.
    await page.evaluate(() => {
      const api = window.ORIGEN_API;
      api.restoreSession = async () => {
        api.cache.session = null;
        api.cache.profile = null;
        return null;
      };
      window.dispatchEvent(new CustomEvent('origen-auth-change'));
    });
    await page.waitForFunction(() => location.hash === '#inicio', null, { timeout: 12000 });
    check(await page.locator('#create-form').count() === 0, 'External sign-out must remove the privileged post form');

    // Two overlapping Auth events: a very slow A response must not overwrite
    // a newer B response after both have been dispatched.
    await page.evaluate(() => {
      window.ORIGEN_API.restoreSession = () => new Promise(resolve => {
        window.__resolveStaleAuth = resolve;
      });
      window.dispatchEvent(new CustomEvent('origen-auth-change'));
    });
    await page.waitForFunction(() => typeof window.__resolveStaleAuth === 'function', null, { timeout: 8000 });
    await page.evaluate(() => {
      const userB = {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        email: 'second@qa.invalid',
        name: 'Second Cultural Agent',
        accountType: 'creator',
        role: 'creator',
        links: {},
        categories: [],
        services: []
      };
      window.ORIGEN_API.restoreSession = async () => userB;
      window.ORIGEN_API.cache.session = { user: { id: userB.id } };
      window.dispatchEvent(new CustomEvent('origen-auth-change'));
    });
    await page.waitForTimeout(150);
    await page.evaluate(() => {
      window.__resolveStaleAuth({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        name: 'Stale Cultural Agent',
        accountType: 'creator',
        role: 'creator',
        links: {},
        categories: [],
        services: []
      });
    });
    await page.waitForTimeout(120);
    await page.evaluate(() => { window.location.hash = '#mi-perfil'; });
    await page.waitForFunction(() => document.querySelector('#main-content')?.innerText?.includes('Second Cultural Agent'), null, { timeout: 12000 });
    check(!(await page.locator('#main-content').innerText()).includes('Stale Cultural Agent'), 'Older Auth event must not restore the previous user');
  } catch (error) {
    failures.push('Account draft/session privacy regression: ' + (error?.message || error));
  } finally {
    await page.close();
  }
}

async function registrationUploadFailureChecks() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.addInitScript(() => {
    const fakeUser = {
      id: '33333333-3333-4333-8333-333333333333',
      email: 'pilot-qa@example.invalid',
      name: 'QA Cultural Agent',
      accountType: 'creator',
      role: 'creator',
      avatar: '',
      cover: '',
      location: 'Yaruquí, Ecuador',
      links: {},
      categories: [],
      services: []
    };
    let created = false;
    let currentApi;
    window.__origenRegistrationQA = { signups: 0, uploads: 0 };

    Object.defineProperty(window, 'ORIGEN_API', {
      configurable: true,
      get() { return currentApi; },
      set(api) {
        currentApi = api;
        api.restoreSession = async () => created ? fakeUser : null;
        api.signUp = async () => {
          window.__origenRegistrationQA.signups += 1;
          created = true;
          return {
            user: { id: fakeUser.id },
            session: { user: { id: fakeUser.id } },
            requiresEmailConfirmation: false
          };
        };
        api.upload = async () => {
          window.__origenRegistrationQA.uploads += 1;
          throw new Error('Simulated storage rejection');
        };
        api.listCulturalProfiles = async () => [];
        api.listPublicProfiles = async () => [];
        api.ensureCreatorCulturalProfile = async () => null;
        api.myFollows = async () => [];
        api.myFavorites = async () => [];
        api.listPosts = async () => [];
        api.loadPostInteractions = async () => null;
      }
    });
  });

  try {
    await page.goto(baseURL + '#registro', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('[data-atype="creator"]').click();
    await page.locator('#reg-next').click();
    await page.locator('#reg-basic [name="name"]').fill('QA Cultural Agent');
    await page.locator('#reg-basic [name="email"]').fill('pilot-qa@example.invalid');
    await page.locator('#reg-basic [name="password"]').fill('TestPassword2026!');
    await page.locator('#reg-basic [name="location"]').fill('Yaruquí, Ecuador');
    await page.locator('#reg-next').click();

    await page.locator('#reg-avatar-input').setInputFiles({
      name: 'qa-avatar.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9])
    });
    await page.locator('#reg-next').click(); // Story
    await page.locator('#reg-next').click(); // Social / legal consent
    await page.locator('#reg-social [name="acceptedLegal"]').check();
    await page.locator('#reg-next').click();

    await page.waitForFunction(() => window.location.hash === '#feed', null, { timeout: 15000 });
    const counts = await page.evaluate(() => window.__origenRegistrationQA);
    check(counts.signups === 1, 'Optional media failure must not restart account creation');
    check(counts.uploads === 1, 'Simulated avatar upload failure should be exercised');
    check((await page.locator('#toast').innerText()).includes('Cuenta creada'), 'Optional media failure should show account created, not signup failed');
  } catch (error) {
    failures.push('Registration optional-media regression: ' + (error?.message || error));
  } finally {
    await page.close();
  }
}

try {
  await desktopChecks();
  await mobileChecks();
  await publicCulturalStoryChecks();
  await publicRightsReviewChecks();
  await publicProfileStatusChecks();
  await roleChecks('explorer');
  await roleChecks('creator');
  await registrationUploadFailureChecks();
  await profileMediaRollbackChecks();
  await sessionDraftIsolationChecks();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('\nORIGEN Browser QA failed:');
  failures.forEach((failure, index) => console.error(`${index + 1}. ${failure}`));
  process.exit(1);
}

note('PASS — desktop + mobile anonymous + beta role browser checks completed.');
