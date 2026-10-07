import fs from 'node:fs';

const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const index = read('index.html');
const app = read('app.js');
const supabase = read('supabase-client.js');
const styles = read('styles.css');
const mundo = read('mundo.js');
const trust = read('trust.js');

const checks = [
  ['Trust Center is loaded', index.includes('<script src="trust.js"></script>')],
  ['Trust route exists', app.includes("route === 'confianza'") && app.includes('trustCenterView')],
  ['Signup shows explicit consent', app.includes('name="acceptedLegal" required')],
  ['Backend client refuses signup without consent', supabase.includes("if (!payload?.acceptedLegal)")],
  ['CSP allows approved globe CDN images', index.includes("img-src 'self' data: blob: https://*.supabase.co https://cdn.jsdelivr.net")],
  ['Globe uses HTTPS Earth texture', mundo.includes("https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-dark.jpg")],
  ['Globe uses HTTPS space texture', mundo.includes("https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png")],
  ['Infinite feed sentinel exists', app.includes('id="feed-sentinel"')],
  ['Wellbeing target exists', app.includes("origen-wellbeing-minutes") && app.includes('120')],
  ['Brand black is exact', styles.includes('--black: #000000;')],
  ['Brand sand is exact', styles.includes('--sand: #c8a97e;')],
  ['No service-role key in frontend files', ![index, app, supabase, mundo, trust].join('\n').toLowerCase().includes('service_role')],
  ['Legacy local user database removed', !app.includes('oc-users') && !app.includes('oc-posts') && !mundo.includes('oc-users') && !mundo.includes('oc-posts')],
  ['Cultural world reads live providers', mundo.includes('ORIGEN_API?.cache?.publicProfiles')],
  ['Provider feed requires cultural purpose', app.includes('name="contentPurpose" required') && supabase.includes('content_purpose')],
  ['Provider text-only post option is removed', app.includes("const types = isProvider") && app.includes("state.createData.type === 'text'")],
  ['Upload type/size preflight exists', supabase.includes('UPLOAD_RULES') && supabase.includes('validateUpload(bucket, file)')],
  ['Upload pickers use supported MIME types', app.includes('image/jpeg,image/png,image/webp') && app.includes('video/mp4,video/webm,video/quicktime')]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? '✓' : '✗'} ${name}`);

if (failed.length) {
  console.error(`\n${failed.length} smoke check(s) failed.`);
  process.exit(1);
}

console.log('\nORIGEN smoke checks passed.');
