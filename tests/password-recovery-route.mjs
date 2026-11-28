import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Execute the real startup and Auth-event handlers. Supabase may consume the
// callback fragment before either runs; no email, account or token is needed.
const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const routeStart = source.indexOf('  function restorePasswordRecoveryRoute()');
const routeEnd = source.indexOf('\n  // Restricted moderation', routeStart);
const initStart = source.indexOf('  let authUiGeneration = 0;');
const initEnd = source.indexOf('\n  initDeletePostDialog();', initStart);
assert.ok(routeStart > 0 && routeEnd > routeStart && initEnd > initStart);

function setup({ verified = false, ready = false, hash = '', user = null } = {}) {
  const state = { user, authReady: ready };
  const location = { hash };
  const renders = [], replacements = [];
  let handler, directoryReads = 0, profileFailure = false;
  const current = { id: 'synthetic-recovery-user', role: 'explorer' };
  const api = {
    hasPasswordRecoverySession: () => verified,
    async restoreSession() { return current; },
    async listCulturalProfiles() { directoryReads++; if (profileFailure) throw Error('Unavailable directory'); },
    async listPublicProfiles() {}, async listPosts() {},
    async ensureCreatorCulturalProfile() {}, async myFollows() {},
    async myFavorites() {}, async loadPostInteractions() {}
  };
  const context = vm.createContext({
    state, location,
    history: { replaceState(_state, _title, url) { replacements.push(url); location.hash = url; } },
    window: { ORIGEN_API: api, addEventListener(name, fn) { assert.equal(name, 'origen-auth-change'); handler = fn; } },
    currentRoute: () => location.hash.replace(/^#/, '') || (state.user ? 'feed' : 'inicio'),
    render: route => renders.push(route), clearAccountDrafts() {}, updateShell() {},
    go: route => { location.hash = '#' + route; }, console
  });
  vm.runInContext(source.slice(routeStart, routeEnd) + '\n' + source.slice(initStart, initEnd), context);
  return { state, location, renders, replacements, api,
    start: () => vm.runInContext('initApp()', context),
    event: () => handler(), reads: () => directoryReads,
    failDirectory: () => { profileFailure = true; },
    setVerified: value => { verified = value; } };
}

// Link already processed before startup (no route left in location.hash).
const initial = setup({ verified: true });
initial.failDirectory();
await initial.start();
assert.equal(initial.location.hash, '#restablecer');
assert.equal(initial.renders.at(-1), 'restablecer');
assert.equal(initial.state.authReady, true);
assert.equal(initial.reads(), 0, 'Recovery cannot depend on feed availability');

// Recovery event can arrive after the home/login UI has finished loading,
// including when the same account already had a normal session.
for (const hash of ['', '#inicio', '#login', '#restablecer']) {
  const late = setup({ verified: true, ready: true, hash, user: { id: 'synthetic-recovery-user', role: 'explorer' } });
  await late.event();
  assert.equal(late.renders.at(-1), 'restablecer');
  assert.equal(late.location.hash, '#restablecer');
  assert.equal(late.reads(), 0);
  assert.equal(late.replacements.length, hash === '#restablecer' ? 0 : 1);
}

// URL fragments/normal login alone cannot grant recovery or trigger a reset.
for (const hash of ['', '#inicio', '#login', '#type=recovery&access_token=synthetic-invalid']) {
  const ordinary = setup({ hash });
  await ordinary.start();
  await ordinary.event();
  assert.equal(ordinary.replacements.length, 0);
  assert.ok(!ordinary.renders.includes('restablecer'));
}
const manual = setup({ hash: '#restablecer' });
await manual.start();
assert.equal(manual.api.hasPasswordRecoverySession(), false, 'Manual route does not authorise password updates');
assert.equal(manual.replacements.length, 0);

// An expired/revoked recovery flag cannot hijack subsequent navigation.
initial.setVerified(false);
initial.location.hash = '#login';
await initial.event();
assert.equal(initial.location.hash, '#login');
console.log('PASS Verified recovery opens reset on startup/late Auth events without feed reads; ordinary sessions and forged URL text do not activate it.');
