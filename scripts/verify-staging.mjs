import { accessHeaders, stagingURL } from './staging-access.mjs';
import { selectAuditMode, anonymousDenied, inspectBundle } from './staging-audit-policy.mjs';

const raw = process.argv[2] || process.env.ORIGEN_STAGING_URL;
if (!raw) {
  console.error('Usage: node scripts/verify-staging.mjs https://your-project.pages.dev');
  process.exit(2);
}

const base = stagingURL(raw);

// The audit is for PRIVATE staging, never for a publicly readable pages.dev site.
const mode = selectAuditMode();
const cloudflareAccessHeaders = accessHeaders();
if (!cloudflareAccessHeaders['CF-Access-Client-Id']) {
  throw new Error('Protected staging audit requires Cloudflare Access service credentials. Do not treat an unprotected site as private.');
}
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

// Read without any credentials to prove Cloudflare Access guards BOTH the
// page and assets. A login redirect must point to Cloudflare Access itself.
for (const pathname of ['/', '/index.html', '/app.js', '/supabase-client.js', '/runtime-config.js']) {
  const probe = await fetch(new URL(pathname, base), { redirect: 'manual', signal: AbortSignal.timeout(12000) });
  record('Cloudflare Access denies anonymous ' + pathname,
    anonymousDenied(probe.status, probe.headers.get('location') || '', base.origin),
    String(probe.status));
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
record('Protected HTML forbids browser/offline caching', /\bno-store\b/i.test(home.headers.get('cache-control') || ''), home.headers.get('cache-control') || '');
record('Referrer policy present', Boolean(home.headers.get('referrer-policy')), home.headers.get('referrer-policy') || '');
record('Permissions policy present', Boolean(home.headers.get('permissions-policy')), home.headers.get('permissions-policy') || '');
const csp = home.headers.get('content-security-policy') || '';
record('CSP present', Boolean(csp), csp);
record('CSP prevents framing', csp.includes("frame-ancestors 'none'"), csp);
record('CSP blocks objects', csp.includes("object-src 'none'"), csp);
record('ORIGEN app shell present', html.includes('runtime-config.js') && html.includes('app.js') && html.includes('supabase-client.js') && html.includes('trust.js'));

for (const file of ['runtime-config.js','app.js','supabase-client.js','styles.css','manifest.webmanifest','service-worker.js']) {
  const response = await get('/' + file);
  record(`Public runtime available: ${file}`, response.ok, String(response.status));
  record(`Protected asset is not cacheable: ${file}`,
    /\bno-store\b/i.test(response.headers.get('cache-control') || ''),
    response.headers.get('cache-control') || '');
}

for (const forbidden of ['_headers','PROJECT_STATUS.md','SECURITY_BASELINE.md','schema.sql','package.json','STAGING_PLAN.md','.github/workflows/quality.yml']) {
  const response = await get('/' + forbidden);
  record(`Internal file not publicly served: ${forbidden}`, response.status === 404, String(response.status));
}

// Pages defaults to SPA fallback if no top-level 404.html exists, which can
// make a nonexistent "secret" path misleadingly return HTTP 200/index.html.
// The staging-only builder installs an inert bilingual custom 404 instead.
// Verify that behavior over deployed HTTPS, not just from build output.
const missing = await get('/origen-staging-audit-missing-path-404');
const missingBody = missing.status === 404 ? await missing.text() : '';
record('Unknown Pages URL returns real HTTP 404 (no SPA fallback)',
  missing.status === 404 && missingBody.includes('404 · Página no encontrada'),
  String(missing.status));
record('Missing-path page never bootstraps Staging client runtime',
  !missingBody.includes('runtime-config.js') && !missingBody.includes('supabase-client.js'));

// Verify that the DEPLOYED asset, not merely the CI workspace, cannot
// connect a test account to ORIGEN's Production Supabase project.
const backendAsset = await get('/supabase-client.js');
const configAsset = await get('/runtime-config.js');
const backendJS = backendAsset.ok ? await backendAsset.text() : '';
const configJS = configAsset.ok ? await configAsset.text() : '';
record('Deployed backend and runtime assets return 200', backendAsset.status === 200 && configAsset.status === 200);
for (const check of inspectBundle({
  mode, html, backendJS, configJS, csp,
  robots: home.headers.get('x-robots-tag') || ''
})) record(check.name, check.ok);

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
console.log(`\nORIGEN deployed staging audit passed [${mode}]: ${checks.length} checks.`);
