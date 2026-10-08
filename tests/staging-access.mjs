import assert from 'node:assert/strict';
import { accessHeaders } from '../scripts/staging-access.mjs';

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
console.log('✓ ORIGEN staging Access credentials are optional, paired, and header-scoped');
