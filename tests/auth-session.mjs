import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../supabase-client.js', import.meta.url), 'utf8');
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const makeSession = id => ({ user: { id, email: id + '@qa.invalid' } });

let authListener;
let activeSession = null;
let profileReads = 0;
let failSignOut = false;
let deferredProfile = null;
const events = [];
const queued = [];

const client = {
  auth: {
    onAuthStateChange(fn) { authListener = fn; },
    async getSession() { return { data: { session: activeSession }, error: null }; },
    async signOut() {
      if (failSignOut) return { error: new Error('Auth unavailable') };
      activeSession = null;
      authListener('SIGNED_OUT', null);
      return { error: null };
    }
  },
  from(table) {
    assert.equal(table, 'profiles', 'Auth tests should only load user profiles');
    return {
      select() { return this; },
      eq(key, value) { assert.equal(key, 'id'); this.uid = value; return this; },
      async maybeSingle() {
        profileReads++;
        if (deferredProfile) return deferredProfile.promise;
        return { data: { id: this.uid, display_name: 'QA user', role: 'explorer' }, error: null };
      }
    };
  }
};

class CustomEvent {
  constructor(type) { this.type = type; }
}
const window = {
  supabase: { createClient: () => client },
  location: { href: 'https://staging.example/' },
  dispatchEvent(event) { events.push(event.type); }
};
vm.runInNewContext(source, {
  window, URL, CustomEvent, console,
  setTimeout(fn, delay) { assert.equal(delay, 0); queued.push(fn); return queued.length; }
}, { filename: 'supabase-client.js' });
const api = window.ORIGEN_API;
assert.ok(api, 'Supabase browser adapter must be created');
assert.equal(typeof authListener, 'function');

function seedPrivateData() {
  api.cache.profile = { id: A };
  api.cache.follows = ['following-A'];
  api.cache.favorites = ['favorite-A'];
  api.cache.likes = ['liked-A'];
  api.cache.saves = ['saved-A'];
  api.cache.comments = [{ body: 'private session content' }];
}
function assertPrivateEmpty() {
  assert.equal(api.cache.profile, null);
  for (const key of ['follows', 'favorites', 'likes', 'saves', 'comments']) {
    assert.equal(api.cache[key].length, 0, key + ' should not carry across accounts');
  }
}
function flushEvents() {
  while (queued.length) queued.shift()();
}

// No asynchronous Supabase requests may run inside onAuthStateChange.
api.cache.session = makeSession(A);
seedPrivateData();
const priorQueries = profileReads;
const result = authListener('SIGNED_OUT', null);
assert.equal(result, undefined, 'Auth callback must be synchronous');
assert.equal(profileReads, priorQueries, 'Auth callback must not query Supabase');
assert.equal(api.cache.session, null);
assertPrivateEmpty();
assert.equal(events.length, 0, 'UI events must be deferred until after Auth lock releases');
flushEvents();
assert.deepEqual(events, ['origen-auth-change']);

// New-account login must evict the prior account's private in-memory state.
api.cache.session = makeSession(A);
seedPrivateData();
authListener('SIGNED_IN', makeSession(B));
assert.equal(api.cache.session.user.id, B);
assertPrivateEmpty();
flushEvents();

// Token refresh should not trigger expensive full UI/database reloads.
const scheduledBeforeRefresh = queued.length;
authListener('TOKEN_REFRESHED', makeSession(B));
assert.equal(queued.length, scheduledBeforeRefresh);

// A fresh session must load the right account profile.
activeSession = makeSession(B);
const userB = await api.restoreSession();
assert.equal(userB.id, B);
assert.equal(api.cache.profile.id, B);

// A failed network logout must preserve the authenticated session/cache.
failSignOut = true;
seedPrivateData();
await assert.rejects(api.signOut(), /Auth unavailable/);
assert.equal(api.cache.session.user.id, B);
assert.equal(api.cache.likes[0], 'liked-A');
failSignOut = false;

// A successful logout clears all user-scoped state.
await api.signOut();
assert.equal(api.cache.session, null);
assertPrivateEmpty();
flushEvents();

// getSession returning null must also evict any stale profile / interaction state.
api.cache.session = makeSession(A);
seedPrivateData();
activeSession = null;
assert.equal(await api.restoreSession(), null);
assertPrivateEmpty();

// An older in-flight profile read cannot write back after sign-out.
let release;
deferredProfile = { promise: new Promise(resolve => { release = resolve; }) };
activeSession = makeSession(A);
const pending = api.restoreSession();
await new Promise(resolve => setImmediate(resolve)); // allow profile request to start
authListener('SIGNED_OUT', null);
release({ data: { id: A, role: 'creator', display_name: 'Old user' }, error: null });
assert.equal(await pending, null);
assertPrivateEmpty();
flushEvents();

console.log('✓ ORIGEN Auth callback isolation, cross-user cache clearing, sign-out failure and stale-request checks passed');
