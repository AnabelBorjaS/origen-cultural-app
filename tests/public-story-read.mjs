import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// No production reads. Verify the exact Data API query in a local mock.
const source = fs.readFileSync(new URL('../supabase-client.js', import.meta.url), 'utf8');
const ID = '11111111-1111-4111-8111-111111111111';
const P = '22222222-2222-4222-8222-222222222222';
let calls = [];
let row = null;
let queryError = null;

class Query {
  constructor(table) { this.table = table; this.filters = []; }
  select(cols) { this.columns = cols; return this; }
  eq(key, value) { this.filters.push([key, value]); return this; }
  maybeSingle() {
    calls.push({ table: this.table, columns: this.columns, filters: this.filters });
    return Promise.resolve({ data: row, error: queryError });
  }
}
const client = {
  auth: { onAuthStateChange() {} },
  from: table => new Query(table)
};
const window = {
  supabase: { createClient: () => client },
  location: { href: 'http://127.0.0.1:4173/#inicio' },
  dispatchEvent() {}
};
vm.runInNewContext(source, { window, URL, console, CustomEvent: class {}, setTimeout() {} }, { filename: 'supabase-client.js' });
const api = window.ORIGEN_API;

assert.equal(await api.getPublicPost('../other'), null);
assert.equal(await api.getPublicPost('javascript:alert(1)'), null);
assert.equal(await api.getPublicPost('not-a-post-id'), null);
assert.equal(calls.length, 0, 'Invalid ID must never request a database row');
console.log('✓ Invalid/malicious permalink IDs never reach the Data API');

row = { id: ID, author_id: P, is_published: true, post_type: 'video', title: 'A cultural story', body: 'A safe example', media_urls: [] };
const published = await api.getPublicPost(ID);
assert.equal(published.id, ID);
assert.equal(published.authorId, P);
assert.equal(published.type, 'video');
assert.equal(calls.length, 1);
assert.equal(calls[0].table, 'cultural_posts');
assert.equal(calls[0].columns, '*');
assert.ok(calls[0].filters.some(([key,value]) => key === 'id' && value === ID));
assert.ok(calls[0].filters.some(([key,value]) => key === 'is_published' && value === true));
console.log('✓ Exact public UUID and published-only filters are required; no reliance on feed cache');

row = { ...row, is_published: false };
assert.equal(await api.getPublicPost(ID), null, 'Defence in depth: never show unpublished responses');
row = null;
assert.equal(await api.getPublicPost(ID), null, 'Deleted/missing post must show no story');
console.log('✓ Unpublished, removed and missing stories return no public content');

queryError = new Error('Simulated database failure');
await assert.rejects(api.getPublicPost(ID), /Simulated database failure/);
console.log('✓ Database errors do not fabricate or cache a cultural story');
