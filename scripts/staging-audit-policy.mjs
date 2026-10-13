// Pure policy checks for HTTPS staging audits; no requests or credentials here.
export const AUDIT_MODES = Object.freeze({ AUTH: 'auth-staging', VISUAL: 'visual-only' });
const PROD = 'xwkjvoyicrrwjybjolld.supabase.co';
const STAGING = 'https://egujmptgnrpajgfpjjxu.supabase.co';
const OFFLINE = 'https://unconfigured-staging.invalid';
const DISABLED_KEY = 'sb_publishable_disabled_staging_preview';

export function selectAuditMode(env = process.env) {
  const mode = String(env.ORIGEN_STAGING_AUDIT_MODE || AUDIT_MODES.AUTH).trim();
  if (!Object.values(AUDIT_MODES).includes(mode)) {
    throw Error('Invalid audit mode. Use auth-staging (default) or explicit visual-only.');
  }
  return mode;
}

// Cloudflare Access may deny directly or redirect to its own login.
// A generic redirect, an unprotected 200, or an unrelated 404 is not proof.
export function anonymousDenied(status, location = '', base = 'https://origen-cultural-staging.pages.dev') {
  if (status === 401 || status === 403) return true;
  if (![302, 303, 307, 308].includes(status) || !location) return false;
  let target;
  try { target = new URL(location, base); } catch { return false; }
  return target.protocol === 'https:' && (
    (target.origin === new URL(base).origin && target.pathname.startsWith('/cdn-cgi/access/')) ||
    (target.hostname.endsWith('.cloudflareaccess.com') && target.hostname !== 'cloudflareaccess.com' &&
      target.pathname.startsWith('/cdn-cgi/access/'))
  );
}

export function inspectBundle({ mode, html = '', backendJS = '', configJS = '', csp = '', robots = '' }) {
  if (!Object.values(AUDIT_MODES).includes(mode)) throw Error('Unsupported audit mode');
  const backendURL = backendJS.match(/^  const PROJECT_URL = ["']([^"']+)["'];$/m)?.[1] || '';
  const backendKey = backendJS.match(/^  const PUBLISHABLE_KEY = ["']([^"']+)["'];$/m)?.[1] || '';
  const backendReady = configJS.match(/"stagingBackendConnected":(true|false)/)?.[1] || '';
  const turnstileKey = configJS.match(/"turnstileSiteKey":"([^"]*)"/)?.[1];
  const connected = backendReady === 'true' && backendURL === STAGING &&
    /^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(backendKey) && backendKey !== DISABLED_KEY;
  const offline = backendReady === 'false' && backendURL === OFFLINE && backendKey === DISABLED_KEY;
  const report = (name, ok) => ({ name, ok: Boolean(ok) });
  const checks = [
    report('No Production Supabase host in deployed client', !backendJS.includes(PROD)),
    report('No private keys in deployed client', !/sb_secret_|service_role/i.test(backendJS)),
    report('CSP blocks framing and object embeds',
      csp.includes("frame-ancestors 'none'") && csp.includes("object-src 'none'"))
  ];
  if (mode === AUDIT_MODES.VISUAL) {
    checks.push(
      report('Explicitly disconnected visual-only backend', offline && !connected),
      report('Visual-only bilingual preview warning is visible', html.includes('id="staging-preview-banner"')),
      report('Visual-only mode has no CAPTCHA widget key', turnstileKey === ''),
      report('Visual-only CSP prevents all Supabase / Turnstile connections',
        !/supabase\.co|challenges\.cloudflare\.com/i.test(csp) &&
        csp.includes("connect-src 'self'") && csp.includes("frame-src 'none'")),
      report('Visual-only preview is marked noindex', /\bnoindex\b/i.test(robots))
    );
  } else {
    checks.push(
      report('Auth testing uses the single approved Supabase Staging project', connected && !offline),
      report('Auth staging has a configured public Turnstile site key',
        typeof turnstileKey === 'string' && /^[A-Za-z0-9_-]{10,}$/.test(turnstileKey)),
      report('Auth staging CSP permits Turnstile script and frame',
        /script-src[^;]*https:\/\/challenges\.cloudflare\.com/.test(csp) &&
        /frame-src[^;]*https:\/\/challenges\.cloudflare\.com/.test(csp)),
      report('Real Auth staging must not carry the offline-preview banner',
        !html.includes('id="staging-preview-banner"'))
    );
  }
  return checks;
}
