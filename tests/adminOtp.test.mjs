import assert from "node:assert/strict";
import * as crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { loadTypeScript } from "./helpers/loadTypeScript.mjs";

const config = loadTypeScript("src/lib/adminOtpConfig.ts");
const admin = { id: "admin-1", email: "admin@example.com", password: "$2b$12$existing-password-hash", username: "owner", name: "Owner" };
let pg;
let sent;
let deliver;
let otp;
let prisma;

// Run the application's actual parameterized SQL and migration in an isolated PostgreSQL engine.
// This small adapter maps only Prisma's model operations; no authentication logic is reimplemented.
function adapter(db) {
  const tagged = (strings) => strings.reduce((text, part, i) => text + (i ? `$${i}` : "") + part, "");
  return {
    $queryRaw: async (strings, ...values) => (await db.query(tagged(strings), values)).rows,
    $executeRaw: async (strings, ...values) => (await db.query(tagged(strings), values)).affectedRows,
    $transaction: (fn) => pg.transaction((tx) => fn(adapter(tx))),
    adminLoginChallenge: {
      findUnique: async ({ where, include }) => {
        const key = Object.keys(where)[0];
        assert.ok(["id", "adminId", "tokenHash"].includes(key));
        const [row] = (await db.query(`SELECT * FROM admin_login_challenges WHERE "${key}" = $1`, [where[key]])).rows;
        if (row && include?.admin) row.admin = (await db.query('SELECT * FROM admins WHERE id = $1', [row.adminId])).rows[0];
        return row || null;
      },
      upsert: async ({ create }) => {
        const keys = Object.keys(create);
        const result = await db.query(`INSERT INTO admin_login_challenges (${keys.map((key) => `"${key}"`).join(",")})
          VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")}) ON CONFLICT ("adminId") DO UPDATE SET
          ${keys.filter((key) => !["adminId", "attempts", "delivered"].includes(key)).map((key) => `"${key}" = EXCLUDED."${key}"`).join(",")}, attempts = 0, delivered = false RETURNING *`,
        keys.map((key) => create[key]?.toISOString ? create[key].toISOString() : create[key]));
        return result.rows[0];
      },
      delete: async ({ where }) => {
        const result = await db.query('DELETE FROM admin_login_challenges WHERE id = $1 RETURNING *', [where.id]);
        assert.equal(result.affectedRows, 1);
        return result.rows[0];
      },
      deleteMany: async ({ where }) => {
        const key = Object.keys(where)[0];
        assert.ok(["id", "tokenHash"].includes(key));
        return { count: (await db.query(`DELETE FROM admin_login_challenges WHERE "${key}" = $1`, [where[key]])).affectedRows };
      },
      update: async ({ where, data }) => (await db.query('UPDATE admin_login_challenges SET attempts = $1 WHERE id = $2 RETURNING *', [data.attempts, where.id])).rows[0],
    },
  };
}

before(async () => {
  // Prisma interprets PostgreSQL TIMESTAMP columns as UTC. Match that behavior explicitly,
  // since PGlite otherwise parses them in the developer machine's local timezone.
  pg = await PGlite.create({ parsers: { 1114: (value) => new Date(value.replace(" ", "T") + "Z") } });
  for (const migration of ["20260425000000_initial", "20260507000000_add_admin_role", "20260510000000_admin_username_and_name", "20261011000000_admin_login_otp"]) {
    await pg.exec(readFileSync(new URL(`../prisma/migrations/${migration}/migration.sql`, import.meta.url), "utf8"));
  }
  prisma = adapter(pg);
  otp = loadTypeScript("src/lib/adminOtp.ts", {
    "server-only": {}, "node:crypto": crypto, "@/lib/db": { prisma },
    "@/lib/authConfig": { JWT_SECRET: new TextEncoder().encode("test-secret-at-least-32-bytes-long") },
    "@/lib/adminOtpConfig": config,
    "@/lib/adminOtpEmail": { sendAdminOtpEmail: async (...args) => { sent.push(args); return deliver(...args); } },
  });
});
after(async () => { await pg?.close(); });
beforeEach(async () => {
  sent = [];
  deliver = async () => true;
  await pg.exec('TRUNCATE admin_login_challenges, admin_auth_rate_limits, admins CASCADE');
  await pg.query('INSERT INTO admins (id,email,password,username,name) VALUES ($1,$2,$3,$4,$5)', Object.values(admin));
});

async function issue() {
  const result = await otp.issueAdminOtp({ admin });
  assert.equal(result.ok, true, JSON.stringify({ result, rows: await challengeRows() }));
  return result;
}
async function challengeRows() { return (await pg.query("SELECT * FROM admin_login_challenges")).rows; }
async function clearCooldown() {
  await pg.exec("DELETE FROM admin_auth_rate_limits WHERE \"windowEndsAt\" < timezone('UTC', clock_timestamp()) + interval '2 minutes'");
}
function wrongCode(code) { return code === "00000000" ? "11111111" : "00000000"; }

test("issuance stores only digests, expires in five minutes, and never accepts a browser secret as a code", async () => {
  const result = await issue();
  const [row] = await challengeRows();
  const [, code, id] = sent[0];
  assert.match(code, /^\d{8}$/);
  assert.equal(sent[0][0], admin.email);
  assert.equal(id, row.id);
  assert.equal(row.expiresAt - row.createdAt, 300_000);
  assert.notEqual(row.tokenHash, result.token);
  assert.notEqual(row.otpHash, code);
  assert.match(row.otpHash, /^[a-f0-9]{64}$/);
  assert.equal(row.delivered, true);
  assert.equal(JSON.stringify(row).includes(admin.password), false);
  assert.equal((await otp.verifyAdminOtp(result.token, result.token)).ok, false);
});

test("the correct code consumes the challenge; replay and an unrelated browser are denied", async () => {
  const { token } = await issue();
  const code = sent[0][1];
  assert.equal((await otp.verifyAdminOtp(crypto.randomBytes(32).toString("hex"), code)).ok, false);
  assert.equal((await otp.verifyAdminOtp("not-a-browser-secret", code)).ok, false);
  assert.equal((await otp.verifyAdminOtp(token, code)).admin.id, admin.id);
  assert.equal((await challengeRows()).length, 0);
  assert.equal((await otp.verifyAdminOtp(token, code)).ok, false);
});

test("concurrent verification requests issue exactly one successful result", async () => {
  const { token } = await issue();
  const results = await Promise.all(Array.from({ length: 12 }, () => otp.verifyAdminOtp(token, sent[0][1])));
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal((await challengeRows()).length, 0);
});

test("the fifth incorrect guess destroys the code, even when guesses are concurrent", async () => {
  const { token } = await issue();
  const results = await Promise.all(Array.from({ length: 8 }, () => otp.verifyAdminOtp(token, wrongCode(sent[0][1]))));
  assert.equal(results.some((result) => result.ok), false);
  assert.equal((await challengeRows()).length, 0);
  assert.equal((await otp.verifyAdminOtp(token, sent[0][1])).ok, false);
});

test("expired codes are rejected and deleted using the database clock", async () => {
  const { token } = await issue();
  await pg.exec("UPDATE admin_login_challenges SET \"expiresAt\" = timezone('UTC', clock_timestamp()) - interval '1 millisecond'");
  assert.equal((await otp.verifyAdminOtp(token, sent[0][1])).restart, true);
  assert.equal((await challengeRows()).length, 0);
});

test("database timezone changes do not alter the five-minute UTC deadline", async () => {
  await pg.exec("SET TIME ZONE 'Asia/Dhaka'");
  try {
    const result = await issue();
    const left = Date.parse(result.expiresAt) - Date.now();
    assert.ok(left > 290_000 && left <= 300_000);
    assert.equal((await otp.verifyAdminOtp(result.token, sent[0][1])).ok, true);
  } finally { await pg.exec("SET TIME ZONE 'UTC'"); }
});

test("resend enforces cooldown and rotates the code and browser secret", async () => {
  const first = await issue();
  const firstCode = sent[0][1];
  const limited = await otp.issueAdminOtp({ token: first.token });
  assert.equal(limited.status, 429);
  assert.ok(limited.retryAfter > 0);
  assert.equal(sent.length, 1);
  await clearCooldown();
  const second = await otp.issueAdminOtp({ token: first.token });
  assert.equal(second.ok, true);
  assert.notEqual(first.token, second.token);
  assert.equal((await otp.verifyAdminOtp(first.token, firstCode)).ok, false);
  if (firstCode !== sent[1][1]) assert.equal((await otp.verifyAdminOtp(second.token, firstCode)).ok, false);
  assert.equal((await otp.verifyAdminOtp(second.token, sent[1][1])).ok, true);
});

test("simultaneous resend requests cannot send two new codes", async () => {
  const first = await issue();
  await clearCooldown();
  const results = await Promise.all([otp.issueAdminOtp({ token: first.token }), otp.issueAdminOtp({ token: first.token })]);
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(sent.length, 2);
});

test("five sends exhaust the account budget even across fresh password challenges", async () => {
  for (let i = 0; i < 5; i++) { await issue(); await clearCooldown(); }
  const result = await otp.issueAdminOtp({ admin });
  assert.equal(result.status, 429);
  assert.equal(sent.length, 5);
});

test("failed and pending deliveries cannot authenticate", async () => {
  deliver = async () => false;
  assert.equal((await otp.issueAdminOtp({ admin })).status, 503);
  assert.equal((await challengeRows()).length, 0);
  await clearCooldown();
  let finishDelivery;
  let deliveryStarted;
  const started = new Promise((resolve) => { deliveryStarted = resolve; });
  deliver = async () => { deliveryStarted(); return new Promise((resolve) => { finishDelivery = resolve; }); };
  const pending = otp.issueAdminOtp({ admin });
  await started;
  const [row] = await challengeRows();
  assert.equal(row.delivered, false);
  // Browser token is not exposed until delivery has succeeded.
  assert.equal(await otp.getAdminOtpStatus(crypto.randomBytes(32).toString("hex")), null);
  finishDelivery(true);
  assert.equal((await pending).ok, true);
});

test("password or email changes invalidate verification and resend", async () => {
  for (const column of ["password", "email"]) {
    if (column === "email") {
      await pg.query("UPDATE admins SET password = $1", [admin.password]);
      await clearCooldown();
    }
    const result = await issue();
    await pg.query(`UPDATE admins SET "${column}" = $1`, [`changed-${column}@example.com`]);
    assert.equal((await otp.verifyAdminOtp(result.token, sent.at(-1)[1])).restart, true);
    assert.equal((await otp.issueAdminOtp({ token: result.token })).ok, false);
    assert.equal((await challengeRows()).length, 0);
  }
});

test("a delivery that finishes after expiry cannot activate its code and removes the expired digest", async () => {
  deliver = async () => {
    await pg.exec("UPDATE admin_login_challenges SET \"expiresAt\" = timezone('UTC', clock_timestamp()) - interval '1 second'");
    return true;
  };
  const result = await otp.issueAdminOtp({ admin });
  assert.equal(result.restart, true);
  assert.equal((await challengeRows()).length, 0);
});

test("a password changed between bcrypt and issuance cannot create a usable code", async () => {
  await pg.query("UPDATE admins SET password = $1", ["new-password-hash"]);
  assert.equal((await otp.issueAdminOtp({ admin })).ok, false);
  assert.equal(sent.length, 0);
});

test("deleting an account cascades to its pending OTP", async () => {
  const result = await issue();
  await pg.exec("DELETE FROM admins");
  assert.equal((await challengeRows()).length, 0);
  assert.equal((await otp.verifyAdminOtp(result.token, sent[0][1])).ok, false);
});

test("cancellation and reload status remain bound to the browser secret", async () => {
  const result = await issue();
  assert.equal((await otp.getAdminOtpStatus(result.token)).email, admin.email);
  await otp.cancelAdminOtp("invalid-token");
  assert.equal((await challengeRows()).length, 1);
  await otp.cancelAdminOtp(result.token);
  assert.equal(await otp.getAdminOtpStatus(result.token), null);
});

test("password limits are atomic, case-independent, and survive parallel submissions", async () => {
  const results = await Promise.all(Array.from({ length: 15 }, (_, i) => otp.limitAdminPasswordAttempts(i % 2 ? admin.email.toUpperCase() : admin.email, `source-${i}`)));
  assert.equal(results.filter((result) => result === null).length, 10);
  assert.equal(results.filter((result) => result?.status === 429).length, 5);
  const rows = (await pg.query("SELECT * FROM admin_auth_rate_limits")).rows;
  assert.equal(JSON.stringify(rows).includes(admin.email), false);
  await pg.exec("UPDATE admin_auth_rate_limits SET \"windowEndsAt\" = timezone('UTC', clock_timestamp()) - interval '1 second'");
  assert.equal(await otp.limitAdminPasswordAttempts(admin.email, "source-new"), null);
});

test("source limits resist password spraying across many email addresses", async () => {
  for (let i = 0; i < 100; i++) assert.equal(await otp.limitAdminPasswordAttempts(`admin${i}@example.com`, "shared-source"), null);
  assert.equal((await otp.limitAdminPasswordAttempts("another@example.com", "shared-source")).status, 429);
});

test("cleanup removes expired challenges and rate limits without deleting live challenges", async () => {
  await issue();
  await pg.exec("UPDATE admin_auth_rate_limits SET \"windowEndsAt\" = timezone('UTC', clock_timestamp()) - interval '1 second'");
  await otp.cleanupAdminAuth();
  assert.equal((await challengeRows()).length, 1);
  assert.equal((await pg.query("SELECT * FROM admin_auth_rate_limits")).rows.length, 0);
  await pg.exec("UPDATE admin_login_challenges SET \"expiresAt\" = timezone('UTC', clock_timestamp()) - interval '1 second'");
  await otp.cleanupAdminAuth();
  assert.equal((await challengeRows()).length, 0);
});

test("migration enables RLS and applies guess bounds", async () => {
  const rows = (await pg.query("SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('admin_login_challenges','admin_auth_rate_limits')")).rows;
  assert.equal(rows.length, 2);
  assert.ok(rows.every((row) => row.relrowsecurity));
  await issue();
  await assert.rejects(pg.exec("UPDATE admin_login_challenges SET attempts = 6"));
});
