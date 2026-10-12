import "server-only";
import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import type { AdminLoginChallenge, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { JWT_SECRET } from "@/lib/authConfig";
import { sendAdminOtpEmail } from "@/lib/adminOtpEmail";
import { ADMIN_OTP_LENGTH, ADMIN_OTP_MAX_ATTEMPTS, ADMIN_OTP_RESEND_SECONDS, ADMIN_OTP_TTL_SECONDS } from "@/lib/adminOtpConfig";

type Database = Prisma.TransactionClient;
type LoginAdmin = { id: string; email: string; password: string; username: string; name: string };
type Failure = { ok: false; status: number; error: string; restart?: boolean; retryAfter?: number };
const INVALID_CHALLENGE: Failure = { ok: false, status: 401, error: "Your verification has expired or is no longer valid. Sign in again.", restart: true };

function digest(purpose: string, value: string): string {
  return createHmac("sha256", JWT_SECRET).update(`${purpose}\0${value}`).digest("hex");
}

function credentialDigest(admin: LoginAdmin): string {
  return digest("admin-login-credentials", JSON.stringify([admin.id, admin.email, admin.password]));
}

function tokenHash(token: string): string | null {
  return /^[a-f0-9]{64}$/.test(token) ? createHash("sha256").update(token).digest("hex") : null;
}

function equalDigest(left: string, right: string): boolean {
  return /^[a-f0-9]{64}$/.test(left) && /^[a-f0-9]{64}$/.test(right)
    && timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

async function databaseNow(db: Database): Promise<Date> {
  const [row] = await db.$queryRaw<{ now: Date }[]>`SELECT timezone('UTC', clock_timestamp()) AS "now"`;
  return row.now;
}

/** Atomic UPSERT prevents lost counters across concurrent workers. */
async function rateLimit(db: Database, purpose: string, value: string, limit: number, seconds: number) {
  const key = digest(`admin-auth-rate/${purpose}`, value);
  const [row] = await db.$queryRaw<{ count: number; retryAfter: number }[]>`
    INSERT INTO "admin_auth_rate_limits" ("key", "count", "windowEndsAt")
    VALUES (${key}, 1, timezone('UTC', clock_timestamp()) + make_interval(secs => ${seconds}::int))
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "admin_auth_rate_limits"."windowEndsAt" <= timezone('UTC', clock_timestamp())
        THEN 1 ELSE LEAST("admin_auth_rate_limits"."count" + 1, ${limit + 1}::int) END,
      "windowEndsAt" = CASE WHEN "admin_auth_rate_limits"."windowEndsAt" <= timezone('UTC', clock_timestamp())
        THEN timezone('UTC', clock_timestamp()) + make_interval(secs => ${seconds}::int)
        ELSE "admin_auth_rate_limits"."windowEndsAt" END
    RETURNING "count", GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("windowEndsAt" - timezone('UTC', clock_timestamp())))))::int AS "retryAfter"
  `;
  return row.count <= limit ? null : {
    ok: false as const, status: 429, error: "Too many attempts. Please wait before trying again.", retryAfter: row.retryAfter,
  };
}

export async function limitAdminPasswordAttempts(email: string, source: string): Promise<Failure | null> {
  await cleanupAdminAuth();
  // Always consume both counters, even when one is already exhausted.
  const sourceLimit = await rateLimit(prisma, "password-source", source, 100, 15 * 60);
  const accountLimit = await rateLimit(prisma, "password-account", email.toLowerCase(), 10, 15 * 60);
  return sourceLimit || accountLimit;
}

export async function cleanupAdminAuth(): Promise<void> {
  // Cleanup must not wait on records being modified by a login transaction.
  await prisma.$executeRaw`
    DELETE FROM "admin_login_challenges" WHERE "id" IN (
      SELECT "id" FROM "admin_login_challenges"
      WHERE "expiresAt" <= timezone('UTC', clock_timestamp()) FOR UPDATE SKIP LOCKED
    )
  `;
  await prisma.$executeRaw`
    DELETE FROM "admin_auth_rate_limits" WHERE "key" IN (
      SELECT "key" FROM "admin_auth_rate_limits"
      WHERE "windowEndsAt" <= timezone('UTC', clock_timestamp()) FOR UPDATE SKIP LOCKED
    )
  `;
}

async function lockAdmin(db: Database, id: string): Promise<LoginAdmin | undefined> {
  const [admin] = await db.$queryRaw<LoginAdmin[]>`
    SELECT "id", "email", "password", "username", "name" FROM "admins" WHERE "id" = ${id} FOR UPDATE
  `;
  return admin;
}

async function lockChallenge(db: Database, hash: string): Promise<AdminLoginChallenge | undefined> {
  const [challenge] = await db.$queryRaw<AdminLoginChallenge[]>`
    SELECT * FROM "admin_login_challenges" WHERE "tokenHash" = ${hash} FOR UPDATE
  `;
  return challenge;
}

function isActive(challenge: AdminLoginChallenge, admin: LoginAdmin, now: Date): boolean {
  return challenge.delivered && challenge.expiresAt > now && challenge.attempts < ADMIN_OTP_MAX_ATTEMPTS
    && equalDigest(challenge.credentialDigest, credentialDigest(admin));
}

export async function issueAdminOtp(input: { admin: LoginAdmin } | { token: string }) {
  await cleanupAdminAuth();
  let previousHash: string | null = null;
  let adminId: string;
  if ("admin" in input) {
    adminId = input.admin.id;
  } else {
    previousHash = tokenHash(input.token);
    if (!previousHash) return INVALID_CHALLENGE;
    const previous = await prisma.adminLoginChallenge.findUnique({ where: { tokenHash: previousHash }, select: { adminId: true } });
    if (!previous) return INVALID_CHALLENGE;
    adminId = previous.adminId;
  }

  const token = randomBytes(32).toString("hex");
  const id = randomUUID();
  const otp = randomInt(0, 10 ** ADMIN_OTP_LENGTH).toString().padStart(ADMIN_OTP_LENGTH, "0");
  const pending = await prisma.$transaction(async (db) => {
    // Lock order is always admin, then challenge, to avoid deadlocks with verification/resend.
    const admin = await lockAdmin(db, adminId);
    if (!admin) return INVALID_CHALLENGE;
    const now = await databaseNow(db);
    if ("admin" in input && !equalDigest(credentialDigest(input.admin), credentialDigest(admin))) return INVALID_CHALLENGE;
    if (previousHash) {
      const previous = await lockChallenge(db, previousHash);
      if (!previous || !isActive(previous, admin, now)) {
        if (previous) await db.adminLoginChallenge.delete({ where: { id: previous.id } });
        return INVALID_CHALLENGE;
      }
    } else {
      await db.$queryRaw`SELECT "id" FROM "admin_login_challenges" WHERE "adminId" = ${adminId} FOR UPDATE`;
    }
    const cooldown = await rateLimit(db, "otp-cooldown", adminId, 1, ADMIN_OTP_RESEND_SECONDS);
    if (cooldown) return cooldown;
    const sendLimit = await rateLimit(db, "otp-send", adminId, 5, 15 * 60);
    if (sendLimit) return sendLimit;
    const data = {
      id, tokenHash: tokenHash(token)!, otpHash: digest("admin-login-otp", `${id}:${otp}`),
      credentialDigest: credentialDigest(admin), attempts: 0, delivered: false,
      expiresAt: new Date(now.getTime() + ADMIN_OTP_TTL_SECONDS * 1_000), createdAt: now,
    };
    const challenge = await db.adminLoginChallenge.upsert({
      where: { adminId },
      create: { ...data, adminId },
      update: data,
    });
    return { ok: true as const, challenge, email: admin.email };
  });
  if (!pending.ok) return pending;

  // Never hold a database transaction open while talking to the email provider.
  if (!(await sendAdminOtpEmail(pending.email, otp, id))) {
    await prisma.adminLoginChallenge.deleteMany({ where: { id } });
    return { ok: false as const, status: 503, error: "Unable to send your verification email. Please sign in again shortly.", restart: true };
  }
  // A delayed/failed send cannot activate a newer replacement challenge.
  const activated = await prisma.$executeRaw`
    UPDATE "admin_login_challenges" SET "delivered" = true WHERE "id" = ${id} AND "expiresAt" > timezone('UTC', clock_timestamp())
  `;
  if (activated !== 1) {
    await prisma.adminLoginChallenge.deleteMany({ where: { id } });
    return INVALID_CHALLENGE;
  }
  return {
    ok: true as const, token, email: pending.email,
    expiresAt: pending.challenge.expiresAt.toISOString(),
    resendAvailableAt: new Date(pending.challenge.createdAt.getTime() + ADMIN_OTP_RESEND_SECONDS * 1_000).toISOString(),
    serverTime: (await databaseNow(prisma)).toISOString(),
  };
}

export async function verifyAdminOtp(token: string, otp: string) {
  const hash = tokenHash(token);
  if (!hash) return INVALID_CHALLENGE;
  const existing = await prisma.adminLoginChallenge.findUnique({ where: { tokenHash: hash }, select: { adminId: true } });
  if (!existing) return INVALID_CHALLENGE;

  return prisma.$transaction(async (db) => {
    const admin = await lockAdmin(db, existing.adminId);
    if (!admin) return INVALID_CHALLENGE;
    const challenge = await lockChallenge(db, hash);
    if (!challenge) return INVALID_CHALLENGE;
    const now = await databaseNow(db);
    if (!isActive(challenge, admin, now)) {
      await db.adminLoginChallenge.delete({ where: { id: challenge.id } });
      return INVALID_CHALLENGE;
    }
    if (!equalDigest(challenge.otpHash, digest("admin-login-otp", `${challenge.id}:${otp}`))) {
      const attempts = challenge.attempts + 1;
      if (attempts >= ADMIN_OTP_MAX_ATTEMPTS) {
        await db.adminLoginChallenge.delete({ where: { id: challenge.id } });
        return { ok: false as const, status: 401, error: "Too many incorrect codes. Sign in again.", restart: true };
      }
      await db.adminLoginChallenge.update({ where: { id: challenge.id }, data: { attempts } });
      return { ok: false as const, status: 401, error: "Incorrect verification code. Please try again." };
    }
    // Deletion commits before the caller can issue a session. Exactly one request wins.
    await db.adminLoginChallenge.delete({ where: { id: challenge.id } });
    return { ok: true as const, admin: { id: admin.id, email: admin.email, username: admin.username, name: admin.name } };
  });
}

export async function getAdminOtpStatus(token: string) {
  const hash = tokenHash(token);
  if (!hash) return null;
  await cleanupAdminAuth();
  const challenge = await prisma.adminLoginChallenge.findUnique({ where: { tokenHash: hash }, include: { admin: true } });
  if (!challenge) return null;
  const now = await databaseNow(prisma);
  if (!isActive(challenge, challenge.admin, now)) {
    await prisma.adminLoginChallenge.deleteMany({ where: { id: challenge.id } });
    return null;
  }
  return {
    email: challenge.admin.email, expiresAt: challenge.expiresAt.toISOString(),
    resendAvailableAt: new Date(challenge.createdAt.getTime() + ADMIN_OTP_RESEND_SECONDS * 1_000).toISOString(),
    serverTime: now.toISOString(),
  };
}

export async function cancelAdminOtp(token: string): Promise<void> {
  const hash = tokenHash(token);
  if (hash) await prisma.adminLoginChallenge.deleteMany({ where: { tokenHash: hash } });
}
