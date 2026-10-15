import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// No network or user data: emulate PostgREST INSERT and subsequent feed SELECT.
const source = fs.readFileSync(new URL('../supabase-client.js', import.meta.url), 'utf8');
const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';
const POST = '33333333-3333-4333-8333-333333333333';
const MEDIA = 'https://unconfigured-staging.invalid/storage/v1/object/public/post-media/' +
  USER_A + '/1234567890123-culture.webp';
const complete = {
  type: 'photo', media: [MEDIA], title: 'Cultural knowledge', description: 'Story',
  rightsAcknowledged: true, culturalAcknowledged: true
};

function harness({ insertError = false, feedError = false, feedReject = false, onSave = null } = {}) {
  let api;
  const saved = [];
  const warnings = [];
  const reads = [];
  const removals = [];
  const existingPost = {
    id: '44444444-4444-4444-8444-444444444444',
    author_id: USER_A, is_published: true, post_type: 'photo', media_urls: []
  };
  class Query {
    constructor(table) { assert.equal(table, 'cultural_posts'); this.mode = 'read'; }
    insert(row) { this.mode = 'insert'; this.row = row; return this; }
    select() { return this; }
    eq() { return this; }
    order() { return this; }
    single() {
      assert.equal(this.mode, 'insert');
      if (insertError) return Promise.resolve({ data: null, error: new Error('Simulated INSERT rejection') });
      const row = { id: POST, ...this.row, created_at: '2026-10-13T00:00:00.000Z' };
      saved.push(row);
      if (onSave) onSave(api);
      return Promise.resolve({ data: row, error: null });
    }
    range() {
      assert.equal(this.mode, 'read');
      reads.push('listPosts');
      if (feedReject) return Promise.reject(new Error('Simulated network failure'));
      if (feedError) return Promise.resolve({ data: null, error: new Error('Simulated feed read failure') });
      return Promise.resolve({ data: [saved[0], existingPost].filter(Boolean), error: null });
    }
  }
  const client = {
    auth: { onAuthStateChange() {} },
    from: table => new Query(table),
    storage: { from: bucket => ({
      remove: async paths => { removals.push({bucket, paths}); return {data: [], error: null}; }
    }) }
  };
  const window = {
    supabase: { createClient: () => client },
    location: { href: 'https://origen-cultural-staging.pages.dev/' },
    dispatchEvent() {}
  };
  vm.runInNewContext(source, { window, URL, console: { warn: value => warnings.push(value), error() {} } },
    { filename: 'supabase-client.js' });
  api = window.ORIGEN_API;
  api.cache.session = { user: { id: USER_A } };
  api.cache.profile = { id: USER_A, role: 'creator' };
  api.cache.posts = [{ id: existingPost.id, authorId: USER_A }];
  return { api, saved, warnings, reads, removals };
}

// A feed API error after a committed INSERT is NOT a publication failure.
// Reaching the form's error handler would risk deleting the real post's media.
for (const scenario of [{feedError:true},{feedReject:true}]) {
  const h = harness(scenario);
  const result = await h.api.createPost(complete, USER_A);
  assert.equal(result.id, POST);
  assert.equal(h.saved.length, 1);
  assert.equal(h.saved[0].media_urls[0], MEDIA);
  assert.equal(h.saved[0].rights_acknowledged, true);
  assert.equal(h.saved[0].cultural_acknowledged, true);
  assert.equal(h.reads.length, 1);
  assert.equal(h.removals.length, 0);
  assert.equal(h.warnings.length, 1);
  assert.equal(h.api.cache.posts[0].id, POST, 'Local fallback keeps committed cultural story visible');
  assert.equal(h.api.cache.posts.filter(p => p.id === POST).length, 1);
}

// Normal INSERT and refresh continue to work without duplication or warnings.
{
  const h = harness();
  const created = await h.api.createPost(complete, USER_A);
  assert.equal(created.id, POST);
  assert.equal(h.saved.length, 1);
  assert.equal(h.reads.length, 1);
  assert.equal(h.warnings.length, 0);
  assert.equal(h.api.cache.posts[0].id, POST);
}

// Before the DB confirms INSERT, failures must still reject the submission.
{
  const h = harness({insertError:true});
  await assert.rejects(h.api.createPost(complete, USER_A), /Simulated INSERT rejection/);
  assert.equal(h.saved.length, 0);
  assert.equal(h.reads.length, 0);
  assert.equal(h.removals.length, 0);
}

// The creator guard and both strict boolean attestations stay enforced.
for (const patch of [
  {rightsAcknowledged:false}, {culturalAcknowledged:false},
  {rightsAcknowledged:'true'}, {culturalAcknowledged:1}
]) {
  const h = harness();
  await assert.rejects(h.api.createPost({...complete,...patch}, USER_A), /Confirma derechos/);
  assert.equal(h.saved.length, 0);
}
{
  const h = harness();
  h.api.cache.profile.role = 'explorer';
  await assert.rejects(h.api.createPost(complete, USER_A), /Agentes Culturales/);
  assert.equal(h.saved.length, 0);
}
{
  const h = harness();
  await assert.rejects(h.api.createPost(complete, USER_B), /sesión cambió/);
  assert.equal(h.saved.length, 0);
}

// A valid post saved by A just before switching to B is not reinserted into
// B's feed; the successful INSERT result itself must not be falsified.
{
  const h = harness({onSave: api => {
    api.cache.session = {user:{id:USER_B}};
    api.cache.profile = {id:USER_B,role:'explorer'};
    api.cache.posts = [{id:'B-post'}];
  }});
  const result = await h.api.createPost(complete, USER_A);
  assert.equal(result.id, POST);
  assert.equal(h.saved.length, 1);
  assert.equal(h.reads.length, 0);
  assert.equal(h.api.cache.posts[0].id, 'B-post');
  assert.equal(h.warnings.length, 0);
}

console.log('PASS Committed cultural posts remain successful and visible even if feed refresh fails.');
console.log('PASS Failed INSERTs, strict rights declarations, role checks and account-switch isolation.');
console.log('PASS Offline mock: no real Supabase requests, no storage deletion, no Production changes.');
