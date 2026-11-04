export const STAGING_ROOT_HOST = 'origen-cultural-staging.pages.dev';

export function stagingURL(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('ORIGEN staging audit requires a valid HTTPS URL.');
  }

  // A workflow_dispatch input is untrusted. Never send Access credentials
  // to a hostname outside the single approved Cloudflare Pages project.
  if (url.protocol !== 'https:' ||
      (url.hostname !== STAGING_ROOT_HOST && !url.hostname.endsWith('.' + STAGING_ROOT_HOST)) ||
      (url.port && url.port !== '443') ||
      url.username || url.password || url.search || url.hash) {
    throw new Error('ORIGEN staging audit only accepts approved Cloudflare Pages staging hostnames over HTTPS.');
  }
  return url;
}

// Cloudflare Access service-token headers for ORIGEN staging audits.
// Only use with explicitly approved *.pages.dev hostnames.
// Never print, persist, or redirect with these values.
export function accessHeaders(env = process.env) {
  const id = String(env.ORIGEN_CF_ACCESS_CLIENT_ID || '').trim();
  const secret = String(env.ORIGEN_CF_ACCESS_CLIENT_SECRET || '').trim();
  if (Boolean(id) !== Boolean(secret)) {
    throw new Error('Both ORIGEN_CF_ACCESS_CLIENT_ID and ORIGEN_CF_ACCESS_CLIENT_SECRET must be set together.');
  }
  if (!id) return {};
  return {
    'CF-Access-Client-Id': id,
    'CF-Access-Client-Secret': secret
  };
}
