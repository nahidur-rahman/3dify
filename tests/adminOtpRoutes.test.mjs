import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { SignJWT, jwtVerify } from "jose";
import { webcrypto } from "node:crypto";
import { loadTypeScript } from "./helpers/loadTypeScript.mjs";

const require = createRequire(import.meta.url);
const nextServer = require("next/server");
const config = loadTypeScript("src/lib/adminOtpConfig.ts");
const env = { JWT_SECRET: "security-regression-test-secret-32-bytes", NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "https://example.com" };
const authConfig = loadTypeScript("src/lib/authConfig.ts", {}, { process: { env } });
const requestHelpers = loadTypeScript("src/lib/adminAuthRequest.ts", { "server-only": {}, "next/server": nextServer }, { process: { env } });
const validation = loadTypeScript("src/lib/validation.ts", {
  zod: require("zod"),
  "@/lib/categories": loadTypeScript("src/lib/categories.ts"),
  "@/lib/productColors": loadTypeScript("src/lib/productColors.ts"),
});

function request(path, body, { token, method = "POST", headers = {} } = {}) {
  return new nextServer.NextRequest(`https://example.com/api/auth/${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { cookie: `${config.ADMIN_OTP_COOKIE}=${token}` } : {}), ...headers },
    ...(method === "GET" ? {} : { body: typeof body === "string" ? body : JSON.stringify(body ?? {}) }),
  });
}

function harness({ passwordMatches = true, missingAdmin = false, verifyResult, issueResult, failDatabase = false } = {}) {
  const calls = [];
  const result = issueResult || { ok: true, token: "a".repeat(64), email: "admin@example.com", expiresAt: new Date(Date.now() + 300_000).toISOString(), resendAvailableAt: new Date(Date.now() + 60_000).toISOString(), serverTime: new Date().toISOString() };
  const dependencies = {
    "next/server": nextServer, zod: require("zod"), "@/lib/adminOtpConfig": config,
    "@/lib/adminAuthRequest": requestHelpers, "@/lib/validation": validation,
    "@/lib/auth": {
      signToken: async (admin) => { calls.push(["signToken", admin]); return "verified-session"; },
      setSessionCookie: (token) => calls.push(["sessionCookie", token]),
      setAdminOtpCookie: (token) => calls.push(["challengeCookie", token]),
      clearAdminOtpCookie: () => calls.push(["clearChallenge"]),
    },
    bcryptjs: { compare: async (password, hash) => { calls.push(["compare", password, hash]); return passwordMatches; } },
    "@/lib/db": { prisma: { admin: { findUnique: async () => {
      calls.push(["lookup"]);
      if (failDatabase) throw new Error("Database offline");
      return missingAdmin ? null : { id: "admin-1", email: "admin@example.com", password: "hash", username: "owner", name: "Owner" };
    } } } },
    "@/lib/adminOtp": {
      readAdminPasswordAttempt: async (...args) => {
        calls.push(["limit", ...args]);
        const admin = await dependencies["@/lib/db"].prisma.admin.findUnique();
        return { ok: true, admin };
      },
      issueAdminOtp: async (...args) => { calls.push(["issue", ...args]); return result; },
      verifyAdminOtp: async (...args) => { calls.push(["verify", ...args]); return verifyResult || { ok: true, admin: { id: "admin-1", email: "admin@example.com", username: "owner" } }; },
      getAdminOtpStatus: async () => ({ email: result.email, expiresAt: result.expiresAt, resendAvailableAt: result.resendAvailableAt, serverTime: result.serverTime }),
      cancelAdminOtp: async (...args) => { calls.push(["cancel", ...args]); },
    },
  };
  return {
    calls,
    login: loadTypeScript("src/app/api/auth/login/route.ts", dependencies).POST,
    otp: loadTypeScript("src/app/api/auth/otp/route.ts", dependencies),
    resend: loadTypeScript("src/app/api/auth/otp/resend/route.ts", dependencies).POST,
  };
}

test("correct credentials create only a pending OTP cookie and never an admin session", async () => {
  const h = harness();
  const response = await h.login(request("login", { email: "admin@example.com", password: "password123" }));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.requiresOtp, true);
  for (const field of ["expiresAt", "resendAvailableAt", "serverTime"]) assert.ok(Number.isFinite(Date.parse(data[field])));
  assert.equal(data.token, undefined);
  assert.equal(data.admin, undefined);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(h.calls.some(([name]) => name === "signToken" || name === "sessionCookie"), false);
  assert.equal(h.calls.filter(([name]) => name === "challengeCookie").length, 1);
});

test("invalid credentials and missing accounts have identical errors and both perform bcrypt", async () => {
  const responses = [];
  for (const options of [{ passwordMatches: false }, { missingAdmin: true }]) {
    const h = harness(options);
    const response = await h.login(request("login", { email: "admin@example.com", password: "password123" }));
    responses.push(await response.json());
    assert.equal(response.status, 401);
    assert.equal(h.calls.filter(([name]) => name === "compare").length, 1);
    assert.equal(h.calls.some(([name]) => name === "issue" || name.endsWith("Cookie")), false);
  }
  assert.deepEqual(responses[0], responses[1]);
});

test("database or delivery failures never issue a session or challenge cookie", async () => {
  for (const options of [{ failDatabase: true }, { issueResult: { ok: false, status: 503, error: "Delivery failed" } }]) {
    const h = harness(options);
    assert.equal((await h.login(request("login", { email: "admin@example.com", password: "password123" }))).status, 503);
    assert.equal(h.calls.some(([name]) => name.endsWith("Cookie") || name === "signToken"), false);
  }
});

test("OTP endpoints cannot authenticate or resend without a pending browser cookie", async () => {
  const h = harness();
  assert.equal((await h.otp.POST(request("otp", { otp: "12345678" }))).status, 401);
  assert.equal((await h.resend(request("otp/resend", {}))).status, 401);
  assert.equal(h.calls.length, 0);
});

test("verification accepts only eight digits and never trusts client account identity", async () => {
  const h = harness();
  for (const body of [{ otp: 12345678 }, { otp: "12345" }, { otp: "123456789" }, { otp: "abcdefgh" }, { otp: "12345678", email: "victim@example.com" }, "{", { otp: "12345678", extra: "x".repeat(20_000) }]) {
    assert.equal((await h.otp.POST(request("otp", body, { token: "a".repeat(64) }))).status, 400);
  }
  assert.equal(h.calls.length, 0);
});

test("session signing occurs only after OTP consumption succeeds", async () => {
  const h = harness();
  assert.equal((await h.otp.POST(request("otp", { otp: "01234567" }, { token: "a".repeat(64) }))).status, 200);
  assert.deepEqual(h.calls.map(([name]) => name), ["verify", "signToken", "sessionCookie", "clearChallenge"]);
  assert.equal(h.calls[0][2], "01234567");
});

test("wrong and expired OTPs cannot sign tokens; terminal failures clear the pending cookie", async () => {
  for (const restart of [false, true]) {
    const h = harness({ verifyResult: { ok: false, status: 401, error: "Invalid code", restart } });
    const response = await h.otp.POST(request("otp", { otp: "12345678" }, { token: "a".repeat(64) }));
    assert.equal(response.status, 401);
    assert.equal(h.calls.some(([name]) => name === "signToken" || name === "sessionCookie"), false);
    assert.equal(h.calls.some(([name]) => name === "clearChallenge"), restart);
  }
});

test("all authentication mutations reject cross-site origins and HTML form content types", async () => {
  for (const headers of [{ Origin: "https://evil.example.com" }, { "Sec-Fetch-Site": "cross-site" }, { "Content-Type": "text/plain" }, { "Content-Type": "application/x-www-form-urlencoded" }]) {
    const h = harness();
    for (const [path, method, handler] of [["login", "POST", h.login], ["otp", "POST", h.otp.POST], ["otp", "DELETE", h.otp.DELETE], ["otp/resend", "POST", h.resend]]) {
      const response = await handler(request(path, { email: "admin@example.com", password: "password123", otp: "12345678" }, { token: "a".repeat(64), method, headers }));
      assert.ok([403, 415].includes(response.status));
    }
    assert.equal(h.calls.length, 0);
  }
});

test("malformed and oversized credential bodies fail validation before bcrypt or database calls", async () => {
  const h = harness();
  for (const body of ["{", { email: "wrong", password: "abc" }, { email: "admin@example.com", password: "x".repeat(20_000) }]) {
    assert.equal((await h.login(request("login", body))).status, 400);
  }
  assert.equal(h.calls.length, 0);
});

test("resend rate limits return Retry-After without changing any cookies", async () => {
  const h = harness({ issueResult: { ok: false, status: 429, error: "Wait", retryAfter: 60 } });
  const response = await h.resend(request("otp/resend", {}, { token: "a".repeat(64) }));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
  assert.deepEqual(h.calls.map(([name]) => name), ["issue"]);
});

test("GET status is uncached; cross-site GETs cannot clear pending cookies", async () => {
  const h = harness();
  const response = await h.otp.GET(request("otp", undefined, { method: "GET", token: "a".repeat(64) }));
  assert.equal((await response.json()).requiresOtp, true);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal((await h.otp.GET(request("otp", undefined, { method: "GET", headers: { "Sec-Fetch-Site": "cross-site" } }))).status, 403);
  assert.equal(h.calls.length, 0);
});

test("real session helpers reject password-only JWTs and create secure, scoped challenge cookies", async () => {
  globalThis.crypto ??= webcrypto;
  const writes = [];
  const auth = loadTypeScript("src/lib/auth.ts", {
    jose: { SignJWT, jwtVerify }, "@/lib/authConfig": authConfig, "@/lib/adminOtpConfig": config,
    "next/headers": { cookies: () => ({ set: (...args) => writes.push(args), get: () => undefined, delete: () => {} }) },
  }, { process: { env } });
  const payload = { id: "admin-1", email: "admin@example.com", username: "owner" };
  const legacy = await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setExpirationTime("5m").sign(authConfig.JWT_SECRET);
  assert.equal(await auth.verifyToken(legacy), null);
  assert.equal((await auth.verifyToken(await auth.signToken(payload))).id, payload.id);
  auth.setAdminOtpCookie("a".repeat(64));
  const [name, , options] = writes[0];
  assert.equal(name, config.ADMIN_OTP_COOKIE);
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "strict");
  assert.equal(options.path, "/api/auth");
  assert.equal(options.maxAge, 300);
  auth.clearAdminOtpCookie();
  assert.equal(writes[1][2].path, options.path);
  assert.equal(writes[1][2].maxAge, 0);
});

test("a missing or weak JWT secret fails closed", () => {
  for (const secret of [undefined, "short"]) {
    assert.throws(() => loadTypeScript("src/lib/authConfig.ts", {}, { process: { env: { JWT_SECRET: secret } } }), /JWT_SECRET/);
  }
});
