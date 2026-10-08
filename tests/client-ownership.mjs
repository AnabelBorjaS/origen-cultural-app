import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// An isolated browser-client contract test. No live Supabase requests or test users.
const source = fs.readFileSync(new URL('../supabase-client.js', import.meta.url), 'utf8');
const projectURL = 'https://xwkjvoyicrrwjybjolld.supabase.co';
const selfId = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';

function makeHarness({ owner = selfId, deleteReturnsRow = true, mediaUrls = [] } = {}) {
  const queries = [];
  const removals = [];
  const warnings = [];
  const record = { id: 'post-1', author_id: owner, media_urls: mediaUrls };
  class Query {
    constructor(table) {
      this.table = table;
      this.mode = 'select';
      this.filters = {};
    }
    select() { return this; }
    delete() { this.mode = 'delete'; return this; }
    eq(field, value) { this.filters[field] = value; return this; }
    order() { return this; }
    maybeSingle() {
      queries.push({ mode: this.mode, table: this.table, filters: { ...this.filters } });
      const matches = this.filters.id === record.id && this.filters.author_id === record.author_id;
      return Promise.resolve({ data: matches ? record : null, error: null });
    }
    range() {
      queries.push({ mode: 'list', table: this.table, filters: { ...this.filters } });
      return Promise.resolve({ data: [], error: null });
    }
    then(resolve, reject) {
      queries.push({ mode: this.mode, table: this.table, filters: { ...this.filters } });
      const matches = this.filters.id === record.id && this.filters.author_id === record.author_id;
      const data = this.mode === 'delete' && deleteReturnsRow && matches ? [{ id: record.id }] : [];
      return Promise.resolve({ data, error: null }).then(resolve, reject);
    }
  }
  const client = {
    auth: { onAuthStateChange() {} },
    from(table) {
      assert.equal(table, 'cultural_posts', 'Only post data should be touched during this test');
      return new Query(table);
    },
    storage: {
      from(bucket) {
        return {
          async remove(paths) {
            removals.push({ bucket, paths });
            return { error: null };
          }
        };
      }
    }
  };
  const window = {
    supabase: { createClient: () => client },
    location: { href: 'https://origen-cultural-staging.pages.dev/' },
    dispatchEvent() {}
  };
  const context = { window, URL, console: { error() {}, warn: s => warnings.push(s) } };
  vm.runInNewContext(source, context, { filename: 'supabase-client.js' });
  assert.ok(window.ORIGEN_API, 'Browser client should initialize');
  return { api: window.ORIGEN_API, queries, removals, warnings };
}

const ownedMedia = `${projectURL}/storage/v1/object/public/post-media/${selfId}/1700000000000-photo.webp`;

// Signed-out callers cannot delete or touch storage.
{
  const h = makeHarness({ mediaUrls: [ownedMedia] });
  await assert.rejects(h.api.deletePost('post-1'), /iniciar sesi[oó]n/i);
  assert.equal(h.queries.length, 0);
  assert.equal(h.removals.length, 0);
}

// Even if the post ID is known, a different author cannot delete it.
{
  const h = makeHarness({ owner: otherId, mediaUrls: [ownedMedia] });
  h.api.cache.session = { user: { id: selfId } };
  await assert.rejects(h.api.deletePost('post-1'), /permiso/i);
  assert.equal(h.queries.filter(q => q.mode === 'delete').length, 0);
  assert.equal(h.removals.length, 0);
  assert.equal(h.queries[0].filters.author_id, selfId);
}

// No media cleanup if the server confirms zero deleted rows.
{
  const h = makeHarness({ deleteReturnsRow: false, mediaUrls: [ownedMedia] });
  h.api.cache.session = { user: { id: selfId } };
  await assert.rejects(h.api.deletePost('post-1'), /No se pudo eliminar/i);
  const del = h.queries.find(q => q.mode === 'delete');
  assert.equal(del.filters.id, 'post-1');
  assert.equal(del.filters.author_id, selfId);
  assert.equal(h.removals.length, 0);
}

// A confirmed owner deletion may clean only owner-managed media.
{
  const h = makeHarness({ mediaUrls: [ownedMedia] });
  h.api.cache.session = { user: { id: selfId } };
  await h.api.deletePost('post-1');
  await new Promise(resolve => setImmediate(resolve));
  const del = h.queries.find(q => q.mode === 'delete');
  assert.equal(del.filters.author_id, selfId);
  assert.equal(h.removals.length, 1);
  assert.equal(h.removals[0].bucket, 'post-media');
  assert.equal(h.removals[0].paths[0], `${selfId}/1700000000000-photo.webp`);
  assert.equal(h.warnings.length, 0);
}

// Off-origin lookalike URLs and path traversal must never count as managed media.
{
  const h = makeHarness();
  h.api.cache.session = { user: { id: selfId } };
  assert.equal(h.api.parseManagedMediaUrl('https://evil.example/storage/v1/object/public/post-media/' + selfId + '/x.jpg'), null);
  assert.equal(h.api.parseManagedMediaUrl(projectURL + '/storage/v1/object/public/post-media/' + selfId + '/%2e%2e/out.jpg'), null);
  assert.equal(h.api.parseManagedMediaUrl(projectURL + '/storage/v1/object/public/post-media/' + selfId + '/x%5cy.jpg'), null);
  assert.equal(h.api.parseManagedMediaUrl(ownedMedia)?.bucket, 'post-media');
  assert.equal(h.removals.length, 0);
}

console.log('✓ ORIGEN isolated client ownership, confirmed deletion and managed-media URL checks passed');
