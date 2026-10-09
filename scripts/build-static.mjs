import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const out = path.join(root, 'dist');

const runtimeEntries = [
  'index.html',
  'runtime-config.js',
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

// Fail-closed staging isolation: the checked-in browser client currently
// targets the Production project. A Pages build must NEVER publish that
// endpoint/key. Visual previews get an intentionally unreachable endpoint;
// authenticated staging requires a different, explicitly provided project.
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
const productionURL = new URL(urlMatch[1]);
const stagingURL = String(process.env.ORIGEN_STAGING_SUPABASE_URL || '').trim();
const stagingKey = String(process.env.ORIGEN_STAGING_SUPABASE_PUBLISHABLE_KEY || '').trim();
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
      target.origin === productionURL.origin) {
    rejectStagingBuild('Staging backend must be a separate Supabase HTTPS project, never Production.');
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(stagingKey) || stagingKey === keyMatch[1]) {
    rejectStagingBuild('Staging requires its own publishable key; never use a secret or Production key.');
  }
  apiURL = target.origin;
  apiKey = stagingKey;
  stagingBackendConnected = true;
}

const patchedClient = clientSource
  .replace(urlMatch[0], '  const PROJECT_URL = ' + JSON.stringify(apiURL) + ';')
  .replace(keyMatch[0], '  const PUBLISHABLE_KEY = ' + JSON.stringify(apiKey) + ';');
if (patchedClient.includes(productionURL.hostname) ||
    patchedClient.includes(keyMatch[1])) {
  rejectStagingBuild('Production Supabase credentials found in staging runtime; refusing to build.');
}
fs.writeFileSync(clientPath, patchedClient);
console.log(stagingBackendConnected
  ? 'Staging bundle: separate Supabase project configured (public key not logged).'
  : 'Staging bundle: VISUAL PREVIEW ONLY; no Supabase Auth or database available.');

const turnstileSiteKey = String(process.env.ORIGEN_TURNSTILE_SITE_KEY || '').trim();
fs.writeFileSync(
  path.join(out, 'runtime-config.js'),
  `window.ORIGEN_CONFIG = Object.freeze(${JSON.stringify({ turnstileSiteKey, stagingBackendConnected })});\n`
);

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
