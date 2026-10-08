import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Local mock-only verification. Does not create, edit or upload Production data.
const source = fs.readFileSync(new URL('../supabase-client.js', import.meta.url), 'utf8');
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

let profileChanges = [];
let postWrites = [];
let profileResolve = null;
let postResolve = null;
let postLists = 0;
let authListener = null;

class Query {
  constructor(table) { this.table = table; this.operation = 'read'; this.filters = {}; }
  update(row) { this.operation = 'update'; this.row = row; return this; }
  insert(row) { this.operation = 'insert'; this.row = row; return this; }
  select() { return this; }
  eq(key, value) { this.filters[key] = value; return this; }
  order() { return this; }
  range() { postLists++; return Promise.resolve({ data: [], error: null }); }
  single() {
    if (this.table === 'profiles') {
      profileChanges.push({ row: this.row, filters: { ...this.filters } });
      return new Promise(resolve => { profileResolve = resolve; });
    }
    if (this.table === 'cultural_posts') {
      postWrites.push({ row: this.row, filters: { ...this.filters } });
      return new Promise(resolve => { postResolve = resolve; });
    }
    throw new Error('Unexpected mutation of ' + this.table);
  }
}
const client = {
  auth: { onAuthStateChange(fn) { authListener = fn; } },
  from(table) { return new Query(table); }
};
class CustomEvent { constructor(type) { this.type = type; } }
const window = {
  supabase: { createClient: () => client },
  location: { href: 'https://origen-cultural-staging.pages.dev/' },
  dispatchEvent() {}
};
vm.runInNewContext(source, {
  window, URL, CustomEvent, console,
  setTimeout(fn) { return 1; }
}, { filename: 'supabase-client.js' });
const api = window.ORIGEN_API;
assert.ok(api);
assert.equal(typeof authListener, 'function');
const setAccount = (uid, role = 'creator') => {
  authListener('SIGNED_IN', { user: { id: uid, email: uid + '@qa.invalid' } });
  api.cache.profile = { id: uid, role, display_name: 'Test Agent' };
};

setAccount(A);
await assert.rejects(api.updateMyProfile({ name: 'old account' }, B), /sesión cambió/i);
await assert.rejects(api.createPost({ title: 'old account' }, B), /sesión cambió/i);
assert.equal(profileChanges.length, 0);
assert.equal(postWrites.length, 0);
console.log('✓ Writes with mismatched originating account rejected before any database call');

// Simulate a successful database save returning AFTER an account switch.
const pendingProfile = api.updateMyProfile({ name: 'Original creator', accountType: 'creator' }, A);
assert.equal(profileChanges.length, 1);
assert.equal(profileChanges[0].filters.id, A);
setAccount(B);
const bCache = api.cache.profile;
profileResolve({
  data: { id: A, role: 'creator', display_name: 'Original creator' },
  error: null
});
const updatedA = await pendingProfile;
assert.equal(updatedA.id, A, 'Successful save should still return original owner');
assert.equal(api.cache.profile, bCache, 'Old profile result must not enter new account cache');
assert.equal(api.cache.session.user.id, B);
console.log('✓ Delayed successful profile save cannot overwrite another account');

// Missing community permission cannot reach the database even through the
// browser API, though real enforcement still requires server-side controls.
setAccount(A);
await assert.rejects(
  api.createPost({ title: 'Craft', type: 'photo', rightsAcknowledged: true, culturalAcknowledged: false }, A),
  /Confirma derechos de contenido/i
);
await assert.rejects(
  api.createPost({ title: 'Craft', type: 'photo', rightsAcknowledged: false, culturalAcknowledged: true }, A),
  /Confirma derechos de contenido/i
);
assert.equal(postWrites.length, 0, 'Incomplete declarations cannot issue a post insert');
console.log('✓ Client API blocks incomplete cultural rights declarations before database writes');

// The request starts while signed in as A; the write succeeds after switching.
const pendingPost = api.createPost({
  title: 'Cultural craft',
  contentPurpose: 'education',
  type: 'photo',
  rightsAcknowledged: true,
  culturalAcknowledged: true,
  media: []
}, A);
assert.equal(postWrites.length, 1);
assert.equal(postWrites[0].row.author_id, A);
setAccount(B);
postResolve({ data: { id: 'post-qa', author_id: A }, error: null });
const savedPost = await pendingPost;
assert.equal(savedPost.author_id, A, 'A completed insert must report its real owner');
assert.equal(postLists, 0, 'Switching accounts must not trigger an old user post refresh');
assert.equal(api.cache.profile.id, B);
console.log('✓ Completed post insert cannot refresh other account or duplicate on retry');
