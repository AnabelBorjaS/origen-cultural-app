import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";

const source = await readFile(new URL("../functions/_middleware.js", import.meta.url), "utf8");
const marker = "export async function onRequest(context)";
assert.ok(source.includes(marker), "Pages middleware entry point exists");
const loadable = source.replace(marker, "async function onRequest(context)") + "\nreturn onRequest;";
const onRequest = new Function(
  "crypto",
  "Response",
  "Headers",
  "TextEncoder",
  "TextDecoder",
  "atob",
  loadable,
)(webcrypto, Response, Headers, TextEncoder, TextDecoder, atob);

const password = "test-password-that-is-long-enough";
function makeRequest(authorization) {
  return new Request("https://preview.example.test/", {
    headers: authorization ? { Authorization: authorization } : {},
  });
}
function makeContext(request, secret = password) {
  let nextCalls = 0;
  return {
    request,
    env: secret === null ? {} : { ORIGEN_STAGING_PASSWORD: secret },
    async next() {
      nextCalls += 1;
      return new Response("preview content", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    },
    get nextCalls() {
      return nextCalls;
    },
  };
}
function basic(user, pass) {
  return `Basic ${Buffer.from(`${user}:${pass}`, "utf8").toString("base64")}`;
}

let context = makeContext(makeRequest(), null);
let result = await onRequest(context);
assert.equal(result.status, 503, "missing secret blocks the site");
assert.equal(context.nextCalls, 0, "missing secret never serves assets");

context = makeContext(makeRequest());
result = await onRequest(context);
assert.equal(result.status, 401, "anonymous visitor is challenged");
assert.match(result.headers.get("WWW-Authenticate"), /^Basic realm=/);
assert.equal(context.nextCalls, 0, "anonymous request never serves assets");

context = makeContext(makeRequest(basic("origen-review", "wrong-password")));
result = await onRequest(context);
assert.equal(result.status, 401, "wrong password is rejected");
assert.equal(context.nextCalls, 0);

context = makeContext(makeRequest(basic("origen-review", password)));
result = await onRequest(context);
assert.equal(result.status, 200, "valid credentials reach the static asset");
assert.equal(await result.text(), "preview content");
assert.equal(context.nextCalls, 1);
assert.equal(result.headers.get("Cache-Control"), "private, no-store");
assert.equal(result.headers.get("X-Robots-Tag"), "noindex, nofollow");

console.log("Pages staging password gate checks passed.");
