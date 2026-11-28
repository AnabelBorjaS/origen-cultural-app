import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../supabase-client.js', import.meta.url), 'utf8');
function optionsFor(script) {
  let options;
  const window = { supabase: { createClient(_url, _key, value) {
    options = value;
    return { auth: { onAuthStateChange() {} } };
  } } };
  vm.runInNewContext(script, { window, URL, Response, console });
  return options;
}
const preview = optionsFor(source);
assert.equal(preview.auth.persistSession, false);
assert.equal(preview.auth.autoRefreshToken, false);
assert.equal(preview.auth.detectSessionInUrl, false);
for (const resource of ['rest/v1/cultural_posts', 'auth/v1/signup', 'storage/v1/object/post-media/example']) {
  const response = await preview.global.fetch('https://unconfigured-staging.invalid/' + resource);
  assert.equal(response.status, 400, 'Disconnected calls must fail without network or retryable status');
  assert.equal((await response.json()).code, 'ORIGEN_PREVIEW_ONLY');
}
// Exercise the same URL replacement as the controlled build, with no real key.
const connected = optionsFor(source.replace(
  "const PROJECT_URL = 'https://unconfigured-staging.invalid';",
  "const PROJECT_URL = 'https://egujmptgnrpajgfpjjxu.supabase.co';"
));
assert.equal(connected.global, undefined, 'Configured Staging must retain the SDK network transport');
for (const setting of ['persistSession', 'autoRefreshToken', 'detectSessionInUrl']) {
  assert.equal(connected.auth[setting], true, 'Configured Staging must retain normal Auth: ' + setting);
}
console.log('PASS Disconnected preview rejects REST/Auth/Storage locally; configured Staging keeps normal transport and Auth.');
