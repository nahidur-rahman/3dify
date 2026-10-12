import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { loadTypeScript } from "./helpers/loadTypeScript.mjs";

const require = createRequire(import.meta.url);
const nextServer = require("next/server");

function check({ siteUrl, mode = "production", url = "https://www.3difybd.com/api/auth/login", origin, headers = {} }) {
  const { checkAdminAuthRequest } = loadTypeScript("src/lib/adminAuthRequest.ts", {
    "server-only": {}, "next/server": nextServer,
  }, { process: { env: { NODE_ENV: mode, NEXT_PUBLIC_SITE_URL: siteUrl } } });
  return checkAdminAuthRequest(new nextServer.NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(origin ? { Origin: origin } : {}), ...headers },
    body: "{}",
  }));
}

test("the production www origin is allowed when its exact HTTPS site URL is configured", () => {
  assert.equal(check({ siteUrl: "https://www.3difybd.com", origin: "https://www.3difybd.com" }), null);
  assert.equal(check({ siteUrl: " https://www.3difybd.com/ ", origin: "https://www.3difybd.com" }), null);
});

test("production never silently trusts a localhost, missing, or invalid site URL", () => {
  for (const siteUrl of [undefined, "", "http://localhost:3000", "https://localhost", "https://localhost.", "https://app.localhost", "https://127.0.0.1", "https://127.1", "https://[::1]", "https://0.0.0.0", "http://www.3difybd.com", "javascript:alert(1)", "not-a-url", "https://user:password@www.3difybd.com"]) {
    assert.equal(check({ siteUrl, origin: "https://www.3difybd.com" }).status, 503, siteUrl);
  }
});

test("www, apex, scheme and port must match the configured origin exactly", () => {
  for (const origin of ["https://3difybd.com", "http://www.3difybd.com", "https://www.3difybd.com:444", "https://www.3difybd.com.evil.example", "https://evil.3difybd.com", "null"]) {
    assert.equal(check({ siteUrl: "https://www.3difybd.com", origin }).status, 403, origin);
  }
  assert.equal(check({ siteUrl: "https://3difybd.com", url: "https://3difybd.com/api/auth/login", origin: "https://3difybd.com" }), null);
});

test("proxy host headers cannot override the configured trusted production origin", () => {
  assert.equal(check({
    siteUrl: "https://www.3difybd.com", url: "http://internal-service:3000/api/auth/login", origin: "https://www.3difybd.com",
  }), null);
  assert.equal(check({
    siteUrl: "https://www.3difybd.com", origin: "https://evil.example",
    headers: { Host: "evil.example", "X-Forwarded-Host": "evil.example", "X-Forwarded-Proto": "https" },
  }).status, 403);
});

test("cross-site fetches and form content types remain blocked", () => {
  assert.equal(check({ siteUrl: "https://www.3difybd.com", origin: "https://www.3difybd.com", headers: { "Sec-Fetch-Site": "cross-site" } }).status, 403);
  assert.equal(check({ siteUrl: "https://www.3difybd.com", origin: "https://www.3difybd.com", headers: { "Content-Type": "text/plain" } }).status, 415);
});

test("development validates the actual localhost request origin independently of the production site URL", () => {
  assert.equal(check({ siteUrl: "https://www.3difybd.com", mode: "development", url: "http://localhost:3000/api/auth/login", origin: "http://localhost:3000" }), null);
  assert.equal(check({ siteUrl: "https://www.3difybd.com", mode: "development", url: "http://localhost:3000/api/auth/login", origin: "https://evil.example" }).status, 403);
});
