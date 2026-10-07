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

const turnstileSiteKey = String(process.env.ORIGEN_TURNSTILE_SITE_KEY || '').trim();
fs.writeFileSync(
  path.join(out, 'runtime-config.js'),
  `window.ORIGEN_CONFIG = Object.freeze(${JSON.stringify({ turnstileSiteKey })});\n`
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
