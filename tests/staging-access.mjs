import assert from 'node:assert/strict';
import { accessHeaders, stagingURL, STAGING_ROOT_HOST } from '../scripts/staging-access.mjs';

// No credentials: initial unprotected staging audit can still run.
assert.deepEqual(accessHeaders({}), {});

// A partial configuration must fail closed, without exposing secrets.
for (const value of [
  { ORIGEN_CF_ACCESS_CLIENT_ID: 'id-only' },
  { ORIGEN_CF_ACCESS_CLIENT_SECRET: 'secret-only' },
  { ORIGEN_CF_ACCESS_CLIENT_ID: '  ', ORIGEN_CF_ACCESS_CLIENT_SECRET: 'hidden' }
]) {
  assert.throws(() => accessHeaders(value), /must be set together/);
}

// The service token is only inserted into the two Cloudflare Access headers.
const headers = accessHeaders({
  ORIGEN_CF_ACCESS_CLIENT_ID: 'staging-id',
  ORIGEN_CF_ACCESS_CLIENT_SECRET: 'staging-secret'
});
assert.deepEqual(headers, {
  'CF-Access-Client-Id': 'staging-id',
  'CF-Access-Client-Secret': 'staging-secret'
});
assert.equal(Object.keys(headers).length, 2);
assert.equal(stagingURL('https://origen-cultural-staging.pages.dev/').hostname, STAGING_ROOT_HOST);
assert.equal(stagingURL('https://preview-123.origen-cultural-staging.pages.dev/').hostname,
  'preview-123.origen-cultural-staging.pages.dev');

for (const url of [
  'https://attacker.example/',
  'https://origen-cultural-staging.pages.dev.evil.example/',
  'https://another-project.pages.dev/',
  'http://origen-cultural-staging.pages.dev/',
  'https://origen-cultural-staging.pages.dev:444/',
  'https://u:p@origen-cultural-staging.pages.dev/',
  'https://origen-cultural-staging.pages.dev/?redirect=evil',
  'https://origen-cultural-staging.pages.dev/#token'
]) {
  assert.throws(() => stagingURL(url), /only accepts approved Cloudflare Pages staging/i,
    'Disallowed input must never receive staging credentials: ' + url);
}
assert.throws(() => stagingURL('not a url'), /valid HTTPS URL/i);

console.log('✓ ORIGEN staging URL allowlist rejects non-approved origins before attaching secrets');

console.log('✓ ORIGEN staging Access credentials are optional, paired, and header-scoped');
