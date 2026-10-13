import assert from 'node:assert/strict';
import { selectAuditMode, anonymousDenied, inspectBundle, AUDIT_MODES } from '../scripts/staging-audit-policy.mjs';

const base = 'https://origen-cultural-staging.pages.dev';
const backend = (url, key) => '  const PROJECT_URL = ' + JSON.stringify(url) + ';\n' +
  '  const PUBLISHABLE_KEY = ' + JSON.stringify(key) + ';\n';
const common = {
  html: '<body><script src="app.js"></script></body>',
  csp: "default-src 'self'; object-src 'none'; frame-ancestors 'none';",
  robots: 'noindex, nofollow'
};
const visual = {
  ...common, mode: AUDIT_MODES.VISUAL,
  html: '<body><div id="staging-preview-banner">Vista previa interna</div></body>',
  backendJS: backend('https://unconfigured-staging.invalid', 'sb_publishable_disabled_staging_preview'),
  configJS: 'window.ORIGEN_CONFIG = {"turnstileSiteKey":"","stagingBackendConnected":false};',
  csp: common.csp + " connect-src 'self' https://cdn.jsdelivr.net; frame-src 'none';"
};
const auth = {
  ...common, mode: AUDIT_MODES.AUTH,
  backendJS: backend('https://egujmptgnrpajgfpjjxu.supabase.co','sb_publishable_staging_unit_test_only_123'),
  configJS: 'window.ORIGEN_CONFIG = {"turnstileSiteKey":"0x4AAAA_unit_test_only","stagingBackendConnected":true};',
  csp: common.csp + " script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com;"
};
const failed = sample => inspectBundle(sample).filter(x => !x.ok).map(x => x.name);
assert.deepEqual(failed(visual), [], 'A disconnected visual preview should pass its own audit');
assert.deepEqual(failed(auth), [], 'A configured Auth Staging bundle should pass its separate audit');
assert.notDeepEqual(failed({...visual,mode:AUDIT_MODES.AUTH}), [], 'Visual-only cannot satisfy Auth QA');
assert.notDeepEqual(failed({...auth,mode:AUDIT_MODES.VISUAL}), [], 'Connected Auth cannot masquerade as visual-only');
assert.ok(failed({...visual,html:'<body></body>'}).some(x => /warning/.test(x)));
assert.ok(failed({...visual,csp:visual.csp + ' https://*.supabase.co'}).some(x => /CSP/.test(x)));
assert.ok(failed({...visual,robots:''}).some(x => /noindex/.test(x)));
assert.ok(failed({...visual,configJS:visual.configJS.replace('"turnstileSiteKey":""', '"turnstileSiteKey":"injected"')}).length>0);
assert.ok(failed({...auth,configJS:auth.configJS.replace('0x4AAAA_unit_test_only','')}).length>0);
assert.ok(failed({...auth,backendJS:backend('https://xwkjvoyicrrwjybjolld.supabase.co','sb_publishable_bad_key_123')}).length>0);
assert.equal(selectAuditMode({}), AUDIT_MODES.AUTH, 'Default mode must remain strict Auth staging');
assert.equal(selectAuditMode({ORIGEN_STAGING_AUDIT_MODE:'visual-only'}), AUDIT_MODES.VISUAL);
assert.throws(()=>selectAuditMode({ORIGEN_STAGING_AUDIT_MODE:'disabled'}),/Invalid audit mode/);
for (const status of [401,403]) assert.equal(anonymousDenied(status,'',base),true);
assert.equal(anonymousDenied(302,'/cdn-cgi/access/login',base),true);
assert.equal(anonymousDenied(302,'https://origen.cloudflareaccess.com/cdn-cgi/access/login/x',base),true);
for (const [status,location] of [
  [200,''],[404,''],[302,'https://evil.example/login'],
  [302,'https://origen-cultural-staging.pages.dev.evil.example/cdn-cgi/access/login'],
  [302,'https://origen.cloudflareaccess.com.evil.example/cdn-cgi/access/login'],
  [302,'/login'],[301,'/cdn-cgi/access/login']
]) assert.equal(anonymousDenied(status,location,base),false,'Anonymous request must not falsely pass');
console.log('PASS Mode-aware visual/Auth staging audit and independent Cloudflare Access denial tests.');
