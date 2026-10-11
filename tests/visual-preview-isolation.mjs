import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const dist = path.join(root, 'dist');
const oldStagingURL = process.env.ORIGEN_STAGING_SUPABASE_URL;
const oldStagingKey = process.env.ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY;

function run(extra = {}) {
  const env = { ...process.env };
  delete env.ORIGEN_STAGING_SUPABASE_URL;
  delete env.ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY;
  delete env.ORIGEN_TURNSTILE_SITE_KEY;
  env.ORIGEN_VISUAL_PREVIEW_ONLY = '1';
  Object.assign(env, extra);
  return spawnSync(process.execPath, ['scripts/build-static.mjs'], {
    cwd: root, env, encoding: 'utf8', timeout: 30000
  });
}

const forbidden = [
  {
    ORIGEN_STAGING_SUPABASE_URL: 'https://egujmptgnrpajgfpjjxu.supabase.co',
    ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_testing_only_example_123456789'
  },
  { ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_testing_only_example_123456789' },
  { ORIGEN_TURNSTILE_SITE_KEY: 'turnstile_testing_not_live' }
];
for (const sample of forbidden) {
  const result = run(sample);
  assert.notEqual(result.status, 0, 'A preview with live Auth/CAPTCHA setup must fail');
  assert.match(result.stderr, /Visual-only Cloudflare preview must never configure Supabase or Turnstile/);
  assert.ok(!fs.existsSync(dist), 'Failed preview cannot leave a deployable dist behind');
}
console.log('✓ Preview refuses any Supabase Auth backend or Turnstile configuration');

const okay = run();
assert.equal(okay.status, 0, okay.stderr);
const client = fs.readFileSync(path.join(dist, 'supabase-client.js'), 'utf8');
const runtime = fs.readFileSync(path.join(dist, 'runtime-config.js'), 'utf8');
const index = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const headers = fs.readFileSync(path.join(dist, '_headers'), 'utf8');
assert.ok(client.includes("const PROJECT_URL = 'https://unconfigured-staging.invalid';"));
assert.ok(client.includes("const PUBLISHABLE_KEY = 'sb_publishable_disabled_staging_preview';"));
assert.ok(!client.includes('xwkjvoyicrrwjybjolld.supabase.co'), 'Must not reference Production backend');
assert.ok(runtime.includes('"stagingBackendConnected":false'));
assert.ok(runtime.includes('"turnstileSiteKey":""'));
assert.ok(index.includes('id="staging-preview-banner"'));
assert.ok(/Content-Security-Policy:.*connect-src 'self' https:\/\/cdn\.jsdelivr\.net;/.test(headers));
assert.ok(!headers.includes('supabase.co'), 'CSP must never allow a Supabase endpoint');
assert.ok(!headers.includes('challenges.cloudflare.com'), 'No live account CAPTCHAs');
assert.ok(headers.includes('X-Robots-Tag: noindex'));
assert.ok(!headers.includes("frame-src https://challenges.cloudflare.com"));
console.log('✓ Browser visual demo permits globe CDN while blocking Auth, uploads and production endpoints');
