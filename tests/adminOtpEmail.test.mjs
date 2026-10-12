import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { loadTypeScript } from "./helpers/loadTypeScript.mjs";

const config = loadTypeScript("src/lib/adminOtpConfig.ts");
const require = createRequire(import.meta.url);
function service(fetch, apiKey = "test-api-key", from = "3DifyBD OTP <otp@mail.3difybd.com>") {
  return loadTypeScript("src/lib/adminOtpEmail.ts", { "server-only": {}, zod: require("zod"), "@/lib/adminOtpConfig": config }, {
    process: { env: { RESEND_API_KEY: apiKey, ADMIN_OTP_FROM: from ?? undefined } }, fetch, setTimeout: (resolve) => { resolve(); },
  }).sendAdminOtpEmail;
}

test("the Resend message uses the exact OTP sender, private key, recipient and idempotency key", async () => {
  const calls = [];
  const send = service(async (...args) => { calls.push(args); return new Response(JSON.stringify({ id: "resend-email-1" }), { status: 200 }); });
  assert.equal(await send("admin@example.com", "01234567", "challenge-1"), true);
  const [url, options] = calls[0];
  assert.equal(url, "https://api.resend.com/emails");
  const body = JSON.parse(options.body);
  assert.equal(body.from, "3DifyBD OTP <otp@mail.3difybd.com>");
  assert.deepEqual(body.to, ["admin@example.com"]);
  assert.match(body.text, /01234567/);
  assert.match(body.text, /5 minutes/);
  assert.equal(body.subject.includes("01234567"), false);
  assert.equal(options.headers.Authorization, "Bearer test-api-key");
  assert.equal(options.headers["Idempotency-Key"], "admin-login-otp/challenge-1");
  assert.equal(options.cache, "no-store");
  assert.ok(options.signal);
});

test("the sender comes from ADMIN_OTP_FROM and supports a display name or bare address", async () => {
  for (const from of ["  Admin Security <security@example.com>  ", "security@example.com"]) {
    let sentFrom;
    const send = service(async (_url, options) => {
      sentFrom = JSON.parse(options.body).from;
      return new Response(JSON.stringify({ id: "email-id" }), { status: 200 });
    }, "test-api-key", from);
    assert.equal(await send("admin@example.com", "01234567", "challenge-1"), true);
    assert.equal(sentFrom, from.trim());
  }
});

test("missing or invalid sender configuration never calls Resend", async () => {
  const fetch = async () => { assert.fail("Must not call Resend"); };
  for (const from of [null, "", "   ", "not-an-email", "Admin <invalid>", "Admin <security@example.com>;", "a@example.com,b@example.com", "Admin\r\nBcc: victim@example.com <security@example.com>"]) {
    assert.equal(await service(fetch, "test-api-key", from)("admin@example.com", "01234567", "challenge-1"), false);
  }
});

test("provider errors, malformed success, and timeouts all fail closed", async () => {
  for (const fetch of [
    async () => new Response(JSON.stringify({ message: "provider error" }), { status: 429 }),
    async () => new Response(JSON.stringify({ error: "rejected" }), { status: 403 }),
    async () => new Response(JSON.stringify({}), { status: 200 }),
    async () => new Response("not-json", { status: 200 }),
    async () => { throw new Error("Network error or timeout"); },
  ]) assert.equal(await service(fetch)("admin@example.com", "01234567", "challenge-1"), false);
});

test("missing keys and nonnumeric OTPs never call Resend", async () => {
  const fetch = async () => { assert.fail("Must not call Resend"); };
  assert.equal(await service(fetch, "")("admin@example.com", "01234567", "challenge-1"), false);
  assert.equal(await service(fetch)("admin@example.com", "<script>", "challenge-1"), false);
});

test("temporary delivery failures retry the identical code with the same idempotency key", async () => {
  const calls = [];
  const send = service(async (...args) => {
    calls.push(args);
    return calls.length === 1
      ? new Response(JSON.stringify({ name: "rate_limit_exceeded" }), { status: 429, headers: { "Retry-After": "1" } })
      : new Response(JSON.stringify({ id: "email-id" }), { status: 200 });
  });
  assert.equal(await send("admin@example.com", "01234567", "challenge-1"), true);
  assert.equal(calls.length, 2);
  assert.equal(calls[0][1].body, calls[1][1].body);
  assert.equal(calls[0][1].headers["Idempotency-Key"], calls[1][1].headers["Idempotency-Key"]);
});

test("quota errors and long Retry-After delays stop immediately", async () => {
  for (const response of [
    () => new Response(JSON.stringify({ name: "daily_quota_exceeded" }), { status: 429 }),
    () => new Response(JSON.stringify({ name: "monthly_quota_exceeded" }), { status: 429 }),
    () => new Response(JSON.stringify({ name: "rate_limit_exceeded" }), { status: 429, headers: { "Retry-After": "60" } }),
  ]) {
    let calls = 0;
    assert.equal(await service(async () => { calls++; return response(); })("admin@example.com", "01234567", "challenge-1"), false);
    assert.equal(calls, 1);
  }
});
