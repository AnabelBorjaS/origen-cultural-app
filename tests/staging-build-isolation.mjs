import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const source = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');
const productionURL = source.match(/^  const PROJECT_URL = '([^']+)';$/m)?.[1];
const productionKey = source.match(/^  const PUBLISHABLE_KEY = '([^']+)';$/m)?.[1];
assert.ok(productionURL && productionKey, 'Must recognize the checked-in Supabase client config');

function build(vars = {}) {
  const env = { ...process.env };
  delete env.ORIGEN_STAGING_SUPABASE_URL;
  delete env.ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY;
  delete env.ORIGEN_TURNSTILE_SITE_KEY;
  Object.assign(env, vars);
  return spawnSync(process.execPath, ['scripts/build-static.mjs'], {
    cwd: root, env, encoding: 'utf8', timeout: 30000
  });
}
function assertSafeArtifact(expectedHost, backendConnected) {
  const output = fs.readFileSync(path.join(dist, 'supabase-client.js'), 'utf8');
  const config = fs.readFileSync(path.join(dist, 'runtime-config.js'), 'utf8');
  assert.ok(!output.includes(productionURL), 'Production URL must not be deployable');
  assert.ok(!output.includes(productionKey), 'Production public key must not be deployable');
  assert.ok(output.includes(expectedHost), 'Expected safe project URL in artifact');
  assert.ok(config.includes('"stagingBackendConnected":' + backendConnected),
    'Visual-only versus isolated staging mode must be explicit');
  const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
  assert.equal(html.includes('id="staging-preview-banner"'), !backendConnected,
    'Visual-only preview must be visibly labelled; connected staging must not be mislabeled');
}

let result = build();
assert.equal(result.status, 0, result.stderr);
assertSafeArtifact('https://unconfigured-staging.invalid', false);
console.log('✓ Default staging build contains no production connection or key');

function rejects(vars, expected) {
  const attempt = build(vars);
  assert.notEqual(attempt.status, 0, 'Dangerous staging configuration must fail');
  assert.match(attempt.stderr, expected);
  assert.ok(!fs.existsSync(dist), 'A failed build must remove unsafe partial dist');
}
rejects({ ORIGEN_STAGING_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co' }, /must both be set/);
rejects({ ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_staging_mock_123456789' }, /must both be set/);
rejects({
  ORIGEN_STAGING_SUPABASE_URL: productionURL,
  ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_staging_mock_123456789'
}, /never Production/);
rejects({
  ORIGEN_STAGING_SUPABASE_URL: 'http://abcdefghijklmnopqrst.supabase.co',
  ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_staging_mock_123456789'
}, /separate Supabase HTTPS project/);
rejects({
  ORIGEN_STAGING_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co.evil.example',
  ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_staging_mock_123456789'
}, /separate Supabase HTTPS project/);
rejects({
  ORIGEN_STAGING_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
  ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_unsafe_never_for_browsers'
}, /own publishable key/);
rejects({
  ORIGEN_STAGING_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
  ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY: productionKey
}, /own publishable key/);
console.log('✓ Partial settings, Production, insecure hosts, secret and reused keys are blocked');

result = build({
  ORIGEN_STAGING_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
  ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_staging_mock_123456789'
});
assert.equal(result.status, 0, result.stderr);
assertSafeArtifact('https://abcdefghijklmnopqrst.supabase.co', true);
console.log('✓ Explicit isolated staging project can be configured without a production endpoint');

// Leave the artifact in its safest mode for subsequent local release checks.
result = build();
assert.equal(result.status, 0, result.stderr);
assertSafeArtifact('https://unconfigured-staging.invalid', false);
