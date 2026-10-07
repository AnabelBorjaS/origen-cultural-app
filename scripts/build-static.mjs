import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');

const runtimeEntries = [
  'index.html',
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

const bytes = files.reduce((sum, file) => sum + fs.statSync(file).size, 0);
console.log(`ORIGEN static bundle ready: ${files.length} files, ${(bytes / 1024 / 1024).toFixed(2)} MB`);
console.log('Output: dist/');
