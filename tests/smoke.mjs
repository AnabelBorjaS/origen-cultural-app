import fs from 'node:fs';

const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const index = read('index.html');
const app = read('app.js');
const supabase = read('supabase-client.js');
const styles = read('styles.css');
const mundo = read('mundo.js');
const trust = read('trust.js');
const headers = read('_headers');

const checks = [
  ['Supabase SDK version is pinned', index.includes('@supabase/supabase-js@2.117.2')],
  ['Trust Center is loaded', index.includes('<script src="trust.js"></script>')],
  ['Trust route exists', app.includes("route === 'confianza'") && app.includes('trustCenterView')],
  ['Signup shows explicit consent', app.includes('name="acceptedLegal" required')],
  ['Backend client refuses signup without consent', supabase.includes("if (!payload?.acceptedLegal)")],
  ['Auth client is CAPTCHA-ready for signup', supabase.includes('payload.captchaToken') && supabase.includes('options.captchaToken = payload.captchaToken')],
  ['Auth client is CAPTCHA-ready for password login', supabase.includes('signIn(email, password, captchaToken = null)') && supabase.includes('credentials.options = { captchaToken }')],
  ['Auth client is CAPTCHA-ready for password recovery', supabase.includes('resetPassword(email, captchaToken = null)') && supabase.includes('options.captchaToken = captchaToken')],
  ['Auth redirects require HTTPS outside localhost', supabase.includes("ORIGEN Auth requires HTTPS outside local development.") && supabase.includes("url.protocol !== 'https:'")],
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
  ['Managed media cleanup enforces current-user folder ownership', supabase.includes('function parseManagedMediaUrl(publicUrl)') && supabase.includes('function removeOwnMedia(publicUrl)') && supabase.includes("parsed.path.startsWith(uid + '/')")],
  ['Profile media is cleaned only after successful profile update', app.includes('const updated = await window.ORIGEN_API.updateMyProfile') && app.includes('Promise.allSettled(cleanup)') && app.includes('removeOwnMedia(previousAvatar)')],
  ['Upload pickers use supported MIME types', app.includes('image/jpeg,image/png,image/webp') && app.includes('video/mp4,video/webm,video/quicktime')],
  ['No legacy local auth session remains in Mundo', !mundo.includes("localStorage.getItem('oc-session')")],
  ['No legacy local profile-follow map remains in Mundo', !mundo.includes("localStorage.getItem('oc-follows')") && !mundo.includes("localStorage.setItem('oc-follows')")],
  ['Public Spanish copy uses Agente Cultural terminology', !app.includes('Proveedor Cultural') && !app.includes('PROVEEDORES CULTURALES')],
  ['Trust disclosure includes Cache Storage', trust.includes('Cache Storage')],
  ['App sanitizes persisted media URLs', app.includes('function safeMediaUrl(value)') && app.includes('safeMediaUrl(post.media[cidx])') && app.includes('safeMediaUrl(profile.cover)')],
  ['Directory profile copy is escaped before innerHTML', app.includes('esc(c.short)') && app.includes('esc(c.location)') && app.includes('esc(c.category)')],
  ['Mundo sanitizes live Cultural Agent fields', mundo.includes('function _esc(value)') && mundo.includes('function _safeMediaUrl(value)') && mundo.includes('_esc(c.name)')],
  ['Deployable runtime has no inline event handlers', ![app, index, mundo, trust].some(src => /\\son[a-z]+\\s*=/i.test(src))],
  ['File upload buttons use CSP-safe delegated triggers', app.includes('data-file-trigger=') && app.includes('function bindCspSafeDelegates()')],
  ['Edit profile upload zones survive input replacement', app.includes("avaZone.addEventListener('change'") && app.includes("covZone.addEventListener('change'")],
  ['Hosting headers prevent framing', headers.includes('X-Frame-Options: DENY') && headers.includes("frame-ancestors 'none'")],
  ['Hosting headers disable MIME sniffing', headers.includes('X-Content-Type-Options: nosniff')],
  ['Hosting headers restrict sensitive browser capabilities', headers.includes('Permissions-Policy:') && headers.includes('camera=()') && headers.includes('microphone=()')],
  ['Mobile drawer exposes dialog semantics', index.includes('id="mobile-drawer" role="dialog"') && index.includes('aria-modal="true"') && index.includes(' inert>')],
  ['Mobile drawer manages keyboard focus', app.includes('drawerFocusable') && app.includes("event.key === 'Escape'") && app.includes("event.key !== 'Tab'")],
  ['Mobile drawer restores opener focus', app.includes('drawerPreviousFocus') && app.includes('closeDrawer(restoreFocus = true)')],
  ['Navigation exposes current page to assistive tech', app.includes("setAttribute('aria-current', 'page')") && app.includes("removeAttribute('aria-current')")],
  ['Rendered forms receive programmatic label associations', app.includes('function enhanceAccessibility()') && app.includes("label.setAttribute('for', control.id)")],
  ['Global search has an accessible name', index.includes('aria-label="Buscar cultura viva"')],
  ['Globe icon controls have accessible names', app.includes('aria-label="Acercar globo"') && app.includes('aria-label="Alejar globo"') && app.includes('aria-label="Restablecer vista del globo"')],
  ['Cultural story close control has accessible name', mundo.includes('aria-label="Cerrar historia"')],
  ['Keyboard focus is visibly styled', styles.includes(':focus-visible') && styles.includes('outline: 3px solid var(--sand)')],
  ['Reduced motion preference is respected', styles.includes('@media (prefers-reduced-motion: reduce)')],
  ['Profile claims require explicit authority declaration in client', supabase.includes("payload?.authority_declaration !== true") && supabase.includes('authority_declaration: payload.authority_declaration')],
  ['Profile claim flow includes ES/EN copy', app.includes('PROFILE CLAIM') && app.includes('Submit claim for review') && app.includes('RECLAMACIÓN DE PERFIL')],
    ['Reports use an accessible dialog instead of browser prompts', index.includes('id="report-dialog"') && app.includes('function initReportDialog()') && !app.includes('window.prompt(')],
  ['Report reasons use canonical moderation codes', index.includes('value="cultural_rights"') && index.includes('value="impersonation"') && index.includes('value="copyright"')],
  ['Report flow includes ES/EN feedback', app.includes('Report received. Thank you for helping keep ORIGEN safe.') && app.includes('Reporte recibido. Gracias por ayudarnos a cuidar ORIGEN.')],
    ['Critical Auth views include ES/EN copy', app.includes("const es = state.lang === 'es';") && app.includes('Welcome back') && app.includes('Reset your password') && app.includes('New password')],
  ['Persistent shell supports ES/EN translation', app.includes('function updateStaticLanguage()') && app.includes('Skip to content') && app.includes('DIGITAL WELLBEING') && app.includes('Search living culture')],
  ['Document language follows active locale', app.includes('document.documentElement.lang = state.lang')],
  ['Registration flow includes ES/EN copy', app.includes('Cultural Agent') && app.includes('Cultural Explorer') && app.includes('Create my profile') && app.includes('Already have an account?')],
  ['Registration preserves canonical category values', app.includes("['Artesanía y tradición','Crafts and tradition']") && app.includes('data-cat=')],
  ['Legal consent is translated without changing version', app.includes('Community Guidelines and Cultural Rights v1.2') && app.includes('Términos de Uso, Privacidad, Normas de Comunidad y Derechos Culturales v1.2')],
  ['Account and category selectors expose pressed state', app.includes('aria-pressed=') && app.includes("setAttribute('aria-pressed'")]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? '✓' : '✗'} ${name}`);

if (failed.length) {
  console.error(`\n${failed.length} smoke check(s) failed.`);
  process.exit(1);
}

console.log('\nORIGEN smoke checks passed.');
