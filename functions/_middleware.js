const AUTH_USER = "origen-review";
const AUTH_REALM = "ORIGEN staging preview";

function response(status, body, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...headers,
    },
  });
}

async function sameSecret(candidate, expected) {
  const encoder = new TextEncoder();
  const [candidateHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(candidate)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const left = new Uint8Array(candidateHash);
  const right = new Uint8Array(expectedHash);
  let difference = 0;
  for (let i = 0; i < left.length; i += 1) difference |= left[i] ^ right[i];
  return difference === 0;
}

async function hasValidCredentials(request, expectedPassword) {
  const authorization = request.headers.get("Authorization") || "";
  const match = /^Basic\s+([A-Za-z0-9+/]+=*)$/i.exec(authorization.trim());
  if (!match) return false;

  try {
    const binary = atob(match[1]);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const credentials = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const separator = credentials.indexOf(":");
    if (separator < 0 || credentials.slice(0, separator) !== AUTH_USER) return false;
    return await sameSecret(credentials.slice(separator + 1), expectedPassword);
  } catch {
    return false;
  }
}

export async function onRequest(context) {
  const expectedPassword = context.env.ORIGEN_STAGING_PASSWORD;
  if (typeof expectedPassword !== "string" || expectedPassword.length < 20) {
    return response(503, "ORIGEN preview is unavailable until its access secret is configured.");
  }

  if (!(await hasValidCredentials(context.request, expectedPassword))) {
    return response(401, "This ORIGEN preview requires authorization.", {
      "WWW-Authenticate": 'Basic realm="ORIGEN staging preview", charset="UTF-8"',
    });
  }

  try {
    const upstream = await context.next();
    const headers = new Headers(upstream.headers);
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch {
    return response(503, "ORIGEN preview is temporarily unavailable.");
  }
}
