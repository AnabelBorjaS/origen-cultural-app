const raw = process.argv[2] || process.env.ORIGEN_STAGING_URL;
if (!raw) {
  console.error('Usage: node scripts/verify-staging.mjs https://your-project.pages.dev');
  process.exit(2);
}

const base = new URL(raw);
if (base.protocol !== 'https:') {
  throw new Error('Staging must use HTTPS.');
}
if (!/\.pages\.dev$/i.test(base.hostname) && !['localhost','127.0.0.1'].includes(base.hostname)) {
  console.warn('Warning: staging host is not a pages.dev hostname. Confirm this is intentional.');
}

const checks = [];
const record = (name, ok, detail='') => checks.push({ name, ok, detail });

async function get(pathname='/', options={}) {
  const url = new URL(pathname, base);
  return fetch(url, { redirect: 'follow', ...options });
}

const home = await get('/');
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
