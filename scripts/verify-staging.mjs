import { accessHeaders, stagingURL } from './staging-access.mjs';

const raw = process.argv[2] || process.env.ORIGEN_STAGING_URL;
if (!raw) {
  console.error('Usage: node scripts/verify-staging.mjs https://your-project.pages.dev');
  process.exit(2);
}

const base = stagingURL(raw);

const cloudflareAccessHeaders = accessHeaders();
const checks = [];
const record = (name, ok, detail='') => checks.push({ name, ok, detail });

async function get(pathname='/', options={}) {
  const url = new URL(pathname, base);
  if (url.origin !== base.origin) throw new Error('Staging audit refuses cross-origin requests.');

  // Do not auto-follow Cloudflare Access redirects with service credentials.
  // The same-origin restriction and manual redirect handling protect tokens.
  return fetch(url, {
    ...options,
    headers: { ...cloudflareAccessHeaders, ...(options.headers || {}) },
    redirect: 'manual'
  });
}

const home = await get('/');
if (home.status >= 300 && home.status < 400) {
  throw new Error('Staging redirected instead of serving ORIGEN. If Cloudflare Access is enabled, configure a Service Auth policy and add the two ORIGEN_CF_ACCESS_* GitHub Actions secrets.');
}
const html = await home.text();

record('Homepage responds 200', home.status === 200, String(home.status));
record('Final URL remains HTTPS', home.url.startsWith('https://'), home.url);
record('HTML content type', (home.headers.get('content-type') || '').includes('text/html'), home.headers.get('content-type') || '');
record('Anti-framing header', (home.headers.get('x-frame-options') || '').toUpperCase() === 'DENY', home.headers.get('x-frame-options') || '');
record('MIME sniffing disabled', (home.headers.get('x-content-type-options') || '').toLowerCase() === 'nosniff', home.headers.get('x-content-type-options') || '');
record('Referrer policy present', Boolean(home.headers.get('referrer-policy')), home.headers.get('referrer-policy') || '');
record('Permissions policy present', Boolean(home.headers.get('permissions-policy')), home.headers.get('permissions-policy') || '');
const csp = home.headers.get('content-security-policy') || '';
record('CSP present', Boolean(csp), csp);
record('CSP prevents framing', csp.includes("frame-ancestors 'none'"), csp);
record('CSP blocks objects', csp.includes("object-src 'none'"), csp);
record('Turnstile CSP script origin', csp.includes('script-src') && csp.includes('https://challenges.cloudflare.com'), csp);
record('Turnstile CSP frame origin', csp.includes('frame-src https://challenges.cloudflare.com'), csp);
record('ORIGEN app shell present', html.includes('runtime-config.js') && html.includes('app.js') && html.includes('supabase-client.js') && html.includes('trust.js'));

for (const file of ['runtime-config.js','app.js','supabase-client.js','styles.css','manifest.webmanifest','service-worker.js','_headers']) {
  const response = await get('/' + file);
  record(`Public runtime available: ${file}`, response.ok, String(response.status));
}

for (const forbidden of ['PROJECT_STATUS.md','SECURITY_BASELINE.md','schema.sql','package.json','STAGING_PLAN.md','.github/workflows/quality.yml']) {
  const response = await get('/' + forbidden);
  record(`Internal file not publicly served: ${forbidden}`, response.status === 404, String(response.status));
}

// Verify that the DEPLOYED asset, not merely the CI workspace, cannot
// connect a test account to ORIGEN's Production Supabase project.
const backendAsset = await get('/supabase-client.js');
const configAsset = await get('/runtime-config.js');
const backendJS = backendAsset.ok ? await backendAsset.text() : '';
const configJS = configAsset.ok ? await configAsset.text() : '';
const backendURL = backendJS.match(/^  const PROJECT_URL = "([^"]+)";$/m)?.[1] || '';
const backendKey = backendJS.match(/^  const PUBLISHABLE_KEY = "([^"]+)";$/m)?.[1] || '';
const backendReady = configJS.match(/"stagingBackendConnected":(true|false)/)?.[1] || '';
const productionProjectHost = 'xwkjvoyicrrwjybjolld.supabase.co';
const configuredIsolated = backendReady === 'true' &&
  /^https:\/\/[a-z0-9]{20}\\.supabase\\.co$/.test(backendURL) &&
  backendURL !== 'https://' + productionProjectHost &&
  /^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(backendKey);
const configuredOffline = backendReady === 'false' &&
  backendURL === 'https://unconfigured-staging.invalid' &&
  backendKey === 'sb_publishable_disabled_staging_preview';
record('Deployed staging never embeds Production Supabase host',
  backendAsset.ok && !backendJS.includes(productionProjectHost));
record('Deployed staging declares isolated backend or visual-only mode',
  configAsset.ok && (configuredIsolated || configuredOffline));
record('Staging is correctly isolated before Auth testing',
  configAsset.ok && configuredIsolated,
  configuredOffline ? 'Visual-only preview: intentionally blocks real Auth tests' :
    configuredIsolated ? 'Separate Supabase project configured' : 'Configuration invalid or unavailable');

const sw = await get('/service-worker.js');
record('Service worker JavaScript content type', sw.ok && /javascript|text\/plain/.test(sw.headers.get('content-type') || ''), sw.headers.get('content-type') || '');

const failed = checks.filter(check => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? '✓' : '✗'} ${check.name}${check.detail ? ' — ' + check.detail : ''}`);
}

if (failed.length) {
  console.error(`\n${failed.length} deployed staging check(s) failed.`);
  process.exit(1);
}
console.log(`\nORIGEN deployed staging audit passed: ${checks.length} checks.`);
