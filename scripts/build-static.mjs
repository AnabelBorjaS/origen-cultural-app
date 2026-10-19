import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const out = path.join(root, 'dist');
const visualPreviewOnly = process.env.ORIGEN_VISUAL_PREVIEW_ONLY === '1';

const runtimeEntries = [
  'index.html',
  'runtime-config.js',
  'locations.js',
  'app.js',
  'data.js',
  'trust.js',
  'mundo.js',
  'styles.css',
  'supabase-client.js',
  'service-worker.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  '_headers',
  'assets'
];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const entry of runtimeEntries) {
  const source = path.join(root, entry);
  if (!fs.existsSync(source)) {
    throw new Error(`Missing required runtime entry: ${entry}`);
  }

  const destination = path.join(out, entry);
  fs.cpSync(source, destination, { recursive: true });
}

// Fail-closed isolation: checked-in beta sources MUST be disconnected.
// Only build-time injection for the single approved Staging project is allowed.
// Neither a raw local preview nor a build may embed Production credentials.
const rejectStagingBuild = message => {
  fs.rmSync(out, { recursive: true, force: true });
  throw new Error(message);
};
const clientPath = path.join(out, 'supabase-client.js');
const clientSource = fs.readFileSync(clientPath, 'utf8');
const urlMatch = clientSource.match(/^  const PROJECT_URL = '([^']+)';$/m);
const keyMatch = clientSource.match(/^  const PUBLISHABLE_KEY = '([^']+)';$/m);
if (!urlMatch || !keyMatch) {
  rejectStagingBuild('Supabase client configuration shape changed; refusing staging build until reviewed.');
}
const disabledClientURL = 'https://unconfigured-staging.invalid';
const disabledClientKey = 'sb_publishable_disabled_staging_preview';
if (urlMatch[1] !== disabledClientURL || keyMatch[1] !== disabledClientKey) {
  rejectStagingBuild('Checked-in beta browser client must have a disabled, non-Production backend.');
}
// Do not reintroduce Production's public key into source control. Only its
// SHA-256 digest is needed to reject accidental reuse at build time.
const productionHost = 'xwkjvoyicrrwjybjolld.supabase.co';
const legacyProductionPublicKeySha256 = '0842eb46eeee05ba28d3c3be1d5d529ed84ceaf8528d11886e3629f631594c5a';
// Founder-approved isolated Free Staging project (not just any Supabase project).
const approvedStagingOrigin = 'https://egujmptgnrpajgfpjjxu.supabase.co';
const stagingURL = String(process.env.ORIGEN_STAGING_SUPABASE_URL || '').trim();
const stagingKey = String(process.env.ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY || '').trim();
if (visualPreviewOnly && (stagingURL || stagingKey || String(process.env.ORIGEN_TURNSTILE_SITE_KEY || '').trim())) {
  rejectStagingBuild('Visual-only Cloudflare preview must never configure Supabase or Turnstile.');
}
if (Boolean(stagingURL) !== Boolean(stagingKey)) {
  rejectStagingBuild('Staging Supabase URL and publishable key must both be set or both be absent.');
}

let apiURL = 'https://unconfigured-staging.invalid';
let apiKey = 'sb_publishable_disabled_staging_preview';
let stagingBackendConnected = false;
if (stagingURL) {
  let target;
  try { target = new URL(stagingURL); }
  catch { rejectStagingBuild('Staging Supabase URL must be valid and HTTPS.'); }
  if (target.protocol !== 'https:' ||
      !/^[a-z0-9]{20}\.supabase\.co$/.test(target.hostname) ||
      target.username || target.password || target.port ||
      target.pathname !== '/' || target.search || target.hash ||
      target.hostname === productionHost ||
      target.origin !== approvedStagingOrigin) {
    rejectStagingBuild('Staging backend must match the approved isolated ORIGEN Staging project, never Production or another project.');
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(stagingKey) ||
      stagingKey === disabledClientKey ||
      crypto.createHash('sha256').update(stagingKey).digest('hex') === legacyProductionPublicKeySha256) {
    rejectStagingBuild('Staging requires its own publishable key; never use a secret or Production key.');
  }
  apiURL = target.origin;
  apiKey = stagingKey;
  stagingBackendConnected = true;
}

const patchedClient = clientSource
  .replace(urlMatch[0], '  const PROJECT_URL = ' + JSON.stringify(apiURL) + ';')
  .replace(keyMatch[0], '  const PUBLISHABLE_KEY = ' + JSON.stringify(apiKey) + ';');
if (patchedClient.includes(productionHost) ||
    /sb_secret_[A-Za-z0-9_-]+/.test(patchedClient)) {
  rejectStagingBuild('Production Supabase credentials found in staging runtime; refusing to build.');
}
fs.writeFileSync(clientPath, patchedClient);
console.log(stagingBackendConnected
  ? 'Staging bundle: separate Supabase project configured (public key not logged).'
  : 'Staging bundle: VISUAL PREVIEW ONLY; no Supabase Auth or database available.');

// A visual-only preview must be visibly labelled, not disguised as a live
// community where registration or uploads are available.
if (!stagingBackendConnected) {
  const indexPath = path.join(out, 'index.html');
  const originalHTML = fs.readFileSync(indexPath, 'utf8');
  if (!originalHTML.includes('<body>')) rejectStagingBuild('Cannot label offline staging HTML safely.');
  fs.writeFileSync(indexPath, originalHTML.replace('<body>', `<body>
  <div id="staging-preview-banner" role="status">
    Vista previa interna / Internal preview — sin base de datos de pruebas conectada.
    Registro y publicaciones reales deshabilitados. / No live accounts or uploads.
  </div>`));
}

const turnstileSiteKey = String(process.env.ORIGEN_TURNSTILE_SITE_KEY || '').trim();
if (visualPreviewOnly && (stagingBackendConnected || apiURL !== disabledClientURL || apiKey !== disabledClientKey)) {
  rejectStagingBuild('Visual-only Cloudflare preview attempted to connect a live backend.');
}
fs.writeFileSync(
  path.join(out, 'runtime-config.js'),
  `window.ORIGEN_CONFIG = Object.freeze(${JSON.stringify({ turnstileSiteKey, stagingBackendConnected, disableServiceWorker: true })});\n`
);

// Cloudflare Access governs access at the edge. Never let a staging HTML,
// JavaScript or other same-origin asset survive in browser/HTTP offline caches.
// PWA offline support remains available in the unchecked-in public configuration.
const headersForStaging = path.join(out, '_headers');

// In the separate Cloudflare visual demo, the browser must also fail closed.
// The ordinary staging/release headers are unchanged in other build modes.
if (visualPreviewOnly) {
  const headersPath = path.join(out, '_headers');
  fs.writeFileSync(headersPath, `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Resource-Policy: same-origin
  X-Robots-Tag: noindex, nofollow, noarchive
  Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://cdn.jsdelivr.net; media-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net; font-src 'self' data:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
`);
  const client = fs.readFileSync(clientPath, 'utf8');
  const config = fs.readFileSync(path.join(out, 'runtime-config.js'), 'utf8');
  if (!client.includes(disabledClientURL) ||
      !client.includes(disabledClientKey) ||
      !config.includes('"stagingBackendConnected":false') ||
      config.includes('"turnstileSiteKey":"') === false) {
    rejectStagingBuild('Visual-only bundle has unexpected authentication config.');
  }
  console.log('VISUAL-ONLY: Browser CSP blocks Supabase, live Auth, uploads, frames and indexing.');
}

// Both Auth Staging and visual-only preview must avoid offline persistence.
// Enforce no-store in the compiled artifact only, never in Production source.
const stagingHeaders = fs.readFileSync(headersForStaging, 'utf8');
if (!stagingHeaders.startsWith('/*\n')) {
  rejectStagingBuild('Staging Cloudflare _headers format changed: cannot set no-store safely.');
}
fs.writeFileSync(headersForStaging,
  stagingHeaders.replace('/*\n', '/*\n  Cache-Control: no-store\n'));

// Cloudflare Pages otherwise treats this deployment as an SPA and may serve
// index.html (HTTP 200) for *unknown* paths, including internal filenames.
// ORIGEN uses hash-based routes (#feed, #confianza), not history fallbacks.
// A top-level custom 404.html forces missing files to return a real HTTP 404,
// allowing the live staging audit to distinguish absence from SPA rewriting.
// This file exists only in the compiled staging artifact, never Production.
fs.writeFileSync(path.join(out, '404.html'), `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <title>ORIGEN · Página no encontrada / Not found</title>
</head>
<body>
  <main>
    <h1>404 · Página no encontrada / Page not found</h1>
    <p>Esta ruta no existe en la vista de pruebas de ORIGEN.</p>
    <p>This path does not exist in the ORIGEN staging preview.</p>
    <a href="/">Volver al inicio / Return home</a>
  </main>
</body>
</html>
`);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(out);
const forbidden = files.filter(file => {
  const rel = path.relative(out, file).replaceAll('\\', '/').toLowerCase();
  return rel.endsWith('.md') ||
    rel.endsWith('.sql') ||
    rel.includes('.github/') ||
    rel.includes('.agents/') ||
    rel.includes('replit');
});

if (forbidden.length) {
  throw new Error(`Internal/development files leaked into dist:\n${forbidden.join('\n')}`);
}

const textRuntime = [
  'index.html',
  'runtime-config.js',
  'locations.js',
  'app.js',
  'data.js',
  'trust.js',
  'mundo.js',
  'styles.css',
  'supabase-client.js',
  'service-worker.js',
  'manifest.webmanifest',
  '_headers'
].map(file => fs.readFileSync(path.join(out, file), 'utf8')).join('\n').toLowerCase();

if (textRuntime.includes('service_role')) {
  throw new Error('Forbidden service-role reference found in deployable runtime.');
}
if (textRuntime.includes('turnstile_secret') || textRuntime.includes('turnstile-secret') || textRuntime.includes('secretkey')) {
  throw new Error('Forbidden Turnstile secret material/reference found in deployable runtime.');
}

const ordered = files
  .map(file => ({
    path: path.relative(out, file).replaceAll('\\', '/'),
    sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    bytes: fs.statSync(file).size
  }))
  .sort((a, b) => a.path.localeCompare(b.path));

const contentFingerprint = ordered.map(file => `${file.path}:${file.sha256}`).join('\n');
const bundleSha256 = crypto.createHash('sha256').update(contentFingerprint).digest('hex');
const bytes = ordered.reduce((sum, file) => sum + file.bytes, 0);

const evidenceDir = path.join(root, '.release-evidence');
fs.rmSync(evidenceDir, { recursive: true, force: true });
fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(path.join(evidenceDir, 'bundle-manifest.json'), JSON.stringify({
  bundle_sha256: bundleSha256,
  file_count: ordered.length,
  total_bytes: bytes,
  files: ordered
}, null, 2) + '\n');

console.log(`ORIGEN static bundle ready: ${ordered.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`ORIGEN bundle content SHA256: ${bundleSha256}`);
console.log('Output: dist/');
console.log('Evidence: .release-evidence/bundle-manifest.json');
