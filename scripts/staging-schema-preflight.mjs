// ORIGEN staging bootstrap preflight: local file inventory, NO network or DB access.
// Default reports missing migrations but exits 0 for ordinary beta quality checks.
// --strict blocks staging bootstrap until the tracked baseline is complete.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'supabase', 'STAGING_PRODUCTION_MIGRATION_VERSIONS.json'), 'utf8'));
const directory = path.join(root, 'supabase', 'migrations');
if (!fs.existsSync(directory)) {
  console.error('ORIGEN STAGING BLOCKED: supabase/migrations directory missing.');
  process.exit(1);
}
const files = fs.readdirSync(directory).filter(name => /^\d{14}_[a-z0-9_]+\.sql$/.test(name)).sort();
const recorded = new Set();
let malformed = false;
for (const file of files) {
  const version = file.slice(0, 14);
  if (recorded.has(version) || fs.statSync(path.join(directory, file)).size === 0) {
    console.error('Invalid or duplicate migration file: ' + file);
    malformed = true;
  }
  recorded.add(version);
}
const missing = manifest.versions.filter(item => !files.includes(item.version + '_' + item.name + '.sql'));
const more = files.filter(file => !manifest.versions.some(item => file === item.version + '_' + item.name + '.sql'));
console.log('ORIGEN migration inventory: ' + (manifest.versions.length - missing.length) + '/' + manifest.versions.length + ' historical migrations represented in GitHub.');
console.log('Source snapshot: ' + manifest.snapshot_date + ' (historical metadata; refresh before staging).');
for (const item of missing) console.warn('MISSING: ' + item.version + '_' + item.name + '.sql');
for (const file of more) console.log('ADDITIONAL (not in snapshot): ' + file);
if (malformed) process.exit(1);
if (missing.length) {
  console.warn('STAGING SCHEMA NOT REPRODUCIBLE from repository history. No migrations were executed.');
  if (strict) process.exit(1);
} else {
  console.log('Metadata parity ONLY: run isolated staging schema/RLS/Storage/Auth tests before use.');
}
