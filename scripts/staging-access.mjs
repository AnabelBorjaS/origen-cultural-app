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
