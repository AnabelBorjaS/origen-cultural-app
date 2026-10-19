import fs from 'node:fs';

const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const index = read('index.html');
const app = read('app.js');
const locations = read('locations.js');
const buildScript = read('scripts/build-static.mjs');
const supabase = read('supabase-client.js');
const styles = read('styles.css');
const manifest = read('manifest.webmanifest');
const mundo = read('mundo.js');
const trust = read('trust.js');
const headers = read('_headers');
const runtimeConfig = read('runtime-config.js');
const serviceWorker = read('service-worker.js');

const checks = [
  ['Supabase SDK version is pinned', index.includes('@supabase/supabase-js@2.117.2')],
  ['Trust Center is loaded', index.includes('<script src="trust.js"></script>')],
  ['Offline warning is a bilingual accessible live status', index.includes('id="connection-status"') && index.includes('aria-live="polite"') && app.includes('function updateConnectionStatus()') && app.includes("window.addEventListener('offline', updateConnectionStatus)") && app.includes("window.addEventListener('online', updateConnectionStatus)")],
  ['Offline notice does not claim backend/server health', app.includes('navigator.onLine !== false') && app.includes('You appear to be offline.')],
  ['Trust route exists', app.includes("route === 'confianza'") && app.includes('trustCenterView')],
  ['Signup shows explicit consent', app.includes('name="acceptedLegal" required')],
  ['Signup separates cultural identity from current city and country', app.includes('Cultura, comunidad o tradición que compartes') && app.includes('locationFieldsMarkup(d, L, true)') && app.includes('cityGeonameId')],
  ['Explorer directory can search by shared culture and display location', app.includes('c.culturalIdentity, c.short') && app.includes('Cultura que comparte') && app.includes('Dónde se encuentra')],
  ['City choices come from an attributed, pinned global reference dataset', locations.includes('datasets/world-cities@73c9f54ab9f305168c76d0802db151e30a157b28') && locations.includes('CC BY 4.0')],
  ['Location data ships in the runtime bundle and is scanned for forbidden secrets', buildScript.includes("'locations.js'") && buildScript.match(/'locations\.js'/g)?.length === 2],
  ['Public permalink offers consent-neutral optional sign-in and return', app.includes('data-story-login href="#login"') && app.includes("state.authReturnRoute = 'publicacion/' + id") && app.includes("go(returnRoute || 'feed')")],
  ['Shared-story return is consumed only after successful login', app.includes('const returnRoute = state.authReturnRoute;') && app.includes('await doLogin(email, password, captchaToken);\n        state.authReturnRoute = null;') && app.includes("go(returnRoute || 'feed')")],
  ['Registration legal documents open in a separate tab, preserving the wizard', app.includes('href="#confianza" target="_blank" rel="noopener noreferrer"') && app.includes('id="reg-accepted-legal"') && app.includes('new tab') && app.includes('nueva pestaña')],
  ['Browser Auth client requires explicit boolean legal consent', supabase.includes("payload?.acceptedLegal !== true")],
  ['Auth client is CAPTCHA-ready for signup', supabase.includes('payload.captchaToken') && supabase.includes('options.captchaToken = payload.captchaToken')],
  ['Auth client is CAPTCHA-ready for password login', supabase.includes('signIn(email, password, captchaToken = null)') && supabase.includes('credentials.options = { captchaToken }')],
  ['Auth client is CAPTCHA-ready for password recovery', supabase.includes('resetPassword(email, captchaToken = null)') && supabase.includes('options.captchaToken = captchaToken')],
  ['Turnstile is disabled safely without a site key', runtimeConfig.includes("turnstileSiteKey: ''") && app.includes('function turnstileEnabled()')],
  ['Turnstile uses explicit SPA rendering', app.includes('turnstile/v0/api.js?render=explicit') && app.includes('window.turnstile.render')],
  ['Turnstile tokens are required only when configured', app.includes('function requireCaptchaToken(action)') && app.includes('if (!turnstileEnabled()) return null')],
  ['Turnstile token resets after Auth attempts', app.includes("resetTurnstile('login')") && app.includes("resetTurnstile('recovery')") && app.includes("resetTurnstile('signup')")],
  ['Turnstile CSP origins are explicit', index.includes('https://challenges.cloudflare.com') && headers.includes('frame-src https://challenges.cloudflare.com')],
  ['Auth redirects require HTTPS outside localhost', supabase.includes("ORIGEN Auth requires HTTPS outside local development.") && supabase.includes("url.protocol !== 'https:'")],
  ['CSP allows approved globe CDN images', index.includes("img-src 'self' data: blob: https://*.supabase.co https://cdn.jsdelivr.net")],
  ['Globe uses a brighter Earth texture against space', mundo.includes("https://cdn.jsdelivr.net/npm/three-globe@2.45.3/example/img/earth-blue-marble.jpg")],
  ['Globe leaves country surfaces visible above the texture', mundo.includes("return 'rgba(18,18,18,0.04)'") && mundo.includes("'rgba(210,220,235,0.14)'")],
  ['Landing country popup renders a flag and sourced cultural fact', mundo.includes('function hEsc(value)') && mundo.includes('db.microhistorias?.[0]') && mundo.includes('hpop-fact') && mundo.includes('hpop-source')],
  ['Landing country popup does not rely on missing stats or tradition fields', !mundo.includes('function stats(key)') && !mundo.includes('db.traditions.length')],
  ['English translations cover all 30 cultural stories', (() => { const ids=[...mundo.matchAll(/id: '([a-z]{2}-\d+)'/g)].map(m=>m[1]); const en=[...mundo.matchAll(/"([a-z]{2}-\d+)":\[/g)].map(m=>m[1]); return ids.length===30 && en.length===30 && ids.every(id=>en.includes(id)); })()],
  ['Country fact cards use the selected locale', mundo.includes('function isEnglish()') && mundo.includes('Did you know…?') && mundo.includes('Source:') && mundo.includes('document.documentElement.lang')],
  ['Maya cacao fact is corrected in both languages', mundo.includes('Long before chocolate became a sweet dessert in Europe') && mundo.includes('Mucho antes de que el chocolate se convirtiera en un postre dulce en Europa')],
  ['Globe uses pinned HTTPS space texture', mundo.includes("https://cdn.jsdelivr.net/npm/three-globe@2.45.3/example/img/night-sky.png")],
  ['World atlas dependency is pinned', mundo.includes('world-atlas@2.0.2/countries-110m.json')],
  ['Globe runtime dependency is pinned', mundo.includes('globe.gl@2.30.0/dist/globe.gl.min.js')],
  ['No mutable master/raw GitHub runtime dependency remains', !mundo.includes('@master') && !mundo.includes('raw.githubusercontent.com') && !index.includes('raw.githubusercontent.com') && !headers.includes('raw.githubusercontent.com')],
  ['Infinite feed sentinel exists', app.includes('id="feed-sentinel"')],
  ['Refreshing a post binds only the replaced card', app.includes('bindPostInteractions(newCard);') && app.includes('bindFollowButtons(newCard);') && app.includes('function bindPostInteractions(root = document)') && app.includes('function bindFollowButtons(root = document)')],
  ['Permalink carousels use the standalone public post', app.includes('function displayedPost(pid)') && app.includes('const post = displayedPost(pid);')],
  ['Wellbeing target exists', app.includes("origen-wellbeing-minutes") && app.includes('120')],
  ['Brand black is exact', styles.includes('--black: #0d0d0d;')],
  ['Brand display stack prioritises Cormorant Garamond', styles.includes('--serif: "Cormorant Garamond"')],
  ['Brand interface stack prioritises DM Sans', styles.includes('--sans: "DM Sans"')],
  ['Browser theme matches PWA manifest black', index.includes('<meta name="theme-color" content="#0d0d0d" />') && manifest.includes('"theme_color": "#0d0d0d"')],
  ['Brand sand is exact', styles.includes('--sand: #c8a97e;')],
  ['No service-role key in frontend files', ![index, app, supabase, mundo, trust].join('\n').toLowerCase().includes('service_role')],
  ['Legacy local user database removed', !app.includes('oc-users') && !app.includes('oc-posts') && !mundo.includes('oc-users') && !mundo.includes('oc-posts')],
  ['Cultural world reads live providers', mundo.includes('ORIGEN_API?.cache?.publicProfiles')],
  ['Provider feed requires cultural purpose', app.includes('name="contentPurpose" required') && supabase.includes('content_purpose')],
  ['Cultural Agent feed excludes text-only posts', app.includes("state.createData.type === 'text'") && app.includes('Agentes Culturales requiere foto, carrusel o video')],
  ['Explorer beta does not expose post creation', app.includes("user.accountType !== 'creator'") && app.includes('La publicación de contenido para Exploradores no forma parte de esta beta.')],
  ['Post client rejects non-Cultural-Agent authors', supabase.includes("cache.profile?.role !== 'creator'")],
  ['Upload type/size preflight exists', supabase.includes('UPLOAD_RULES') && supabase.includes('validateUpload(bucket, file)')],
  ['Managed media cleanup enforces current-user folder ownership', supabase.includes('function parseManagedMediaUrl(publicUrl)') && supabase.includes('function removeOwnMedia(publicUrl)') && supabase.includes("parsed.path.startsWith(uid + '/')")],
  ['Deleted posts trigger owned post-media cleanup including legacy images', supabase.includes("select('id,author_id,media_urls,image_url')") && supabase.includes("parsed?.bucket === 'post-media' ? removeOwnMedia(url) : false") && supabase.includes("const parsed = parseManagedMediaUrl(url);")],
  ['Failed post creation cleans newly uploaded media', app.includes('const uploaded = []') && app.includes('removeOwnMedia(url)') && app.includes('post upload cleanup incomplete')],
  ['Profile media is cleaned only after successful profile update', app.includes('const updated = await window.ORIGEN_API.updateMyProfile') && app.includes('Promise.allSettled(cleanup)') && app.includes('removeOwnMedia(previousAvatar)')],
  ['Upload pickers use supported MIME types', app.includes('image/jpeg,image/png,image/webp') && app.includes('video/mp4,video/webm,video/quicktime')],
  ['No legacy local auth session remains in Mundo', !mundo.includes("localStorage.getItem('oc-session')")],
  ['No legacy local profile-follow map remains in Mundo', !mundo.includes("localStorage.getItem('oc-follows')") && !mundo.includes("localStorage.setItem('oc-follows')")],
  ['Public Spanish copy uses Agente Cultural terminology', !app.includes('Proveedor Cultural') && !app.includes('PROVEEDORES CULTURALES')],
  ['Trust disclosure includes Cache Storage', trust.includes('Cache Storage')],
  ['Trust Center exposes privacy/account deletion requests', trust.includes("id: 'privacy-requests'") && trust.includes('info.origencultural@gmail.com') && trust.includes('eliminación de cuenta')],
  ['Own profile exposes controlled privacy request route', app.includes('Solicitar privacidad / eliminación de cuenta') && app.includes('mailto:info.origencultural@gmail.com')],
  ['Browser runtime does not expose admin Auth deletion', !app.includes('auth.admin.deleteUser') && !supabase.includes('auth.admin.deleteUser') && !app.includes('deleteUser(') && !supabase.includes('deleteUser(')],
  ['Service worker bypasses cross-origin traffic', serviceWorker.includes("url.origin !== self.location.origin")],
  ['Service worker bypasses Authorization requests', serviceWorker.includes("req.headers.has('authorization')")],
  ['Service worker does not precache browser Supabase client', !serviceWorker.split('function isStaticAsset')[0].includes("'./supabase-client.js'")],
  ['Service worker always fetches Auth configuration without using cached fallback', serviceWorker.includes("if (isSensitiveRuntime(url))") && serviceWorker.includes("event.respondWith(fetch(req, { cache: 'no-store' }))")],
  ['Service worker clears only its own obsolete caches', serviceWorker.includes("key.startsWith('origen-cultural-v')")],
  ['Service worker caches only navigation/static assets', serviceWorker.includes('if (!isNavigation && !isStatic) return;')],
  ['Service worker rejects private/no-store/error responses', serviceWorker.includes('response.ok') && serviceWorker.includes('no-store|private')],
  ['App sanitizes persisted media URLs', app.includes('function safeMediaUrl(value)') && app.includes('safeMediaUrl(post.media[cidx])') && app.includes('safeMediaUrl(profile.cover)')],
  ['Dynamic profile and post identifiers are escaped before HTML insertion', app.includes('data-pid="${esc(post.id)}"') && app.includes('href="${esc(authorHref)}"') && app.includes('data-fuser="${esc(post.authorId)}"') && app.includes('id="coms-${esc(postId)}"') && app.includes('data-favorite="${esc(c.id)}"')],
  ['Directory profile copy is escaped before innerHTML', app.includes('esc(c.short)') && app.includes('esc(c.location)') && app.includes('esc(c.category)')],
  ['Mundo sanitizes live Cultural Agent fields', mundo.includes('function _esc(value)') && mundo.includes('function _safeMediaUrl(value)') && mundo.includes('_esc(c.name)')],
  ['Globe tooltips escape external/profile labels', mundo.includes('_esc(n)') && mundo.includes('_esc(d.label)')],
  ['Cultural micro-story links use safe href validation', mundo.includes('function _safeHref(value') && mundo.includes('_safeHref(story.href)')],
  ['Cultural card story text is escaped', mundo.includes('_esc(story.txt)') && mundo.includes('_esc(story.src)') && mundo.includes('_esc(localizedCountryName(data))')],
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
  ['Globe icon controls have accessible names', app.includes("${es ? 'Acercar globo' : 'Zoom in on globe'}") && app.includes("${es ? 'Alejar globo' : 'Zoom out on globe'}") && app.includes("${es ? 'Restablecer vista del globo' : 'Reset globe view'}")],
  ['Cultural story close control has accessible name', mundo.includes("aria-label=\"${english ? 'Close' : 'Cerrar'}\"")],
  ['Keyboard focus is visibly styled', styles.includes(':focus-visible') && styles.includes('outline: 3px solid var(--sand)')],
  ['Reduced motion preference is respected', styles.includes('@media (prefers-reduced-motion: reduce)')],
  ['Profile claims require explicit authority declaration in client', supabase.includes("payload?.authority_declaration !== true") && supabase.includes('authority_declaration: payload.authority_declaration')],
  ['Profile claim flow includes ES/EN copy', app.includes('PROFILE CLAIM') && app.includes('Submit claim for review') && app.includes('RECLAMACIÓN DE PERFIL')],
    ['Post deletion uses accessible dialog instead of native confirm', index.includes('id="delete-post-dialog"') && app.includes('function initDeletePostDialog()') && !app.includes("confirm('¿Eliminar esta publicación?')")],
  ['Post deletion dialog includes ES/EN feedback', app.includes('Post deleted.') && app.includes('Publicación eliminada.')],
  ['Post deletion client scopes delete to current author', supabase.includes(".eq('author_id', uid)") && supabase.includes('async function deletePost(postId)')],
  ['Reports use an accessible dialog instead of browser prompts', index.includes('id="report-dialog"') && app.includes('function initReportDialog()') && !app.includes('window.prompt(')],
  ['Report reasons use canonical moderation codes', index.includes('value="cultural_rights"') && index.includes('value="impersonation"') && index.includes('value="copyright"')],
  ['Report flow includes ES/EN feedback', app.includes('Report received. Thank you for helping keep ORIGEN safe.') && app.includes('Reporte recibido. Gracias por ayudarnos a cuidar ORIGEN.')],
    ['Critical Auth views include ES/EN copy', app.includes("const es = state.lang === 'es';") && app.includes('Welcome back') && app.includes('Reset your password') && app.includes('New password')],
  ['Persistent shell supports ES/EN translation', app.includes('function updateStaticLanguage()') && app.includes('Skip to content') && app.includes('DIGITAL WELLBEING') && app.includes('Search living culture')],
  ['Document language follows active locale', app.includes('document.documentElement.lang = state.lang')],
  ['Registration flow includes ES/EN copy', app.includes('Cultural Agent') && app.includes('Cultural Explorer') && app.includes('Create my profile') && app.includes('Already have an account?')],
  ['Registration preserves canonical category values', app.includes("['Artesanía y tradición','Crafts and tradition']") && app.includes('data-cat=')],
  ['Legal consent is translated without changing version', app.includes('Community Guidelines and Cultural Rights v1.2') && app.includes('Términos de Uso, Privacidad, Normas de Comunidad y Derechos Culturales v1.2')],
  ['Account and category selectors expose pressed state', app.includes('aria-pressed=') && app.includes("setAttribute('aria-pressed'")],
  ['English destination screens cover create and edit profile copy while preserving canonical values', app.includes("Share culture") && app.includes("Cultural purpose *") && app.includes("Edit profile") && app.includes('data-cat="${cat}"')],
  ['Trust Center has complete English content for all Spanish sections', trust.includes('sections_en:') && trust.includes('Digital wellbeing') && trust.includes('Privacy requests and account deletion') && app.includes('trust.sections_en || trust.sections')]
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? '✓' : '✗'} ${name}`);

if (failed.length) {
  console.error(`\n${failed.length} smoke check(s) failed.`);
  process.exit(1);
}

console.log('\nORIGEN smoke checks passed.');
