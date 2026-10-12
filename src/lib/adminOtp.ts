import "server-only";
import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { JWT_SECRET } from "@/lib/authConfig";
import { sendAdminOtpEmail } from "@/lib/adminOtpEmail";
import { ADMIN_OTP_LENGTH, ADMIN_OTP_MAX_ATTEMPTS, ADMIN_OTP_RESEND_SECONDS, ADMIN_OTP_TTL_SECONDS } from "@/lib/adminOtpConfig";

type LoginAdmin = { id: string; email: string; password: string; username: string; name: string };
type ChallengeSnapshot = LoginAdmin & {
  challengeId: string; tokenHash: string; otpHash: string; credentialDigest: string;
  attempts: number; delivered: boolean; createdAt: Date; expiresAt: Date; now: Date;
};
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

/** Both password budgets and the account lookup share one database round trip. */
export async function readAdminPasswordAttempt(email: string, source: string): Promise<Failure | { ok: true; admin: LoginAdmin | null }> {
  const sourceKey = digest("admin-auth-rate/password-source", source);
  const accountKey = digest("admin-auth-rate/password-account", email.toLowerCase());
  const [row] = await prisma.$queryRaw<(Partial<LoginAdmin> & { allowed: boolean; retryAfter: number })[]>`
    WITH limits AS (
      INSERT INTO "admin_auth_rate_limits" ("key", "count", "windowEndsAt")
      SELECT "key", 1, timezone('UTC', clock_timestamp()) + interval '15 minutes'
      FROM (VALUES (${sourceKey}), (${accountKey})) AS inputs("key") ORDER BY "key"
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "admin_auth_rate_limits"."windowEndsAt" <= timezone('UTC', clock_timestamp()) THEN 1
          ELSE LEAST("admin_auth_rate_limits"."count" + 1, CASE WHEN EXCLUDED."key" = ${sourceKey} THEN 101 ELSE 11 END) END,
        "windowEndsAt" = CASE WHEN "admin_auth_rate_limits"."windowEndsAt" <= timezone('UTC', clock_timestamp())
          THEN timezone('UTC', clock_timestamp()) + interval '15 minutes' ELSE "admin_auth_rate_limits"."windowEndsAt" END
      RETURNING "key", "count", "windowEndsAt"
    ), budget AS MATERIALIZED (
      SELECT bool_and("count" <= CASE WHEN "key" = ${sourceKey} THEN 100 ELSE 10 END) AS allowed,
        COALESCE(MAX(CASE WHEN "count" > CASE WHEN "key" = ${sourceKey} THEN 100 ELSE 10 END
          THEN GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("windowEndsAt" - timezone('UTC', clock_timestamp()))))) END), 0)::int AS "retryAfter"
      FROM limits
    ), expired_challenges AS (
      -- Cleanup waits for the sorted budget locks and skips contended rows.
      -- Current budget keys are excluded below so no row is both deleted and upserted.
      DELETE FROM "admin_login_challenges" WHERE "id" IN (
        SELECT c."id" FROM "admin_login_challenges" c CROSS JOIN budget b
        WHERE b.allowed IS NOT NULL AND c."expiresAt" <= timezone('UTC', clock_timestamp())
        ORDER BY c."expiresAt" LIMIT 100 FOR UPDATE OF c SKIP LOCKED
      )
    ), expired_limits AS (
      DELETE FROM "admin_auth_rate_limits" WHERE "key" IN (
        SELECT r."key" FROM "admin_auth_rate_limits" r CROSS JOIN budget b
        WHERE b.allowed IS NOT NULL AND r."windowEndsAt" <= timezone('UTC', clock_timestamp()) AND r."key" NOT IN (${sourceKey}, ${accountKey})
        ORDER BY r."windowEndsAt" LIMIT 100 FOR UPDATE OF r SKIP LOCKED
      )
    )
    SELECT budget.*, a."id", a."email", a."password", a."username", a."name"
    FROM budget LEFT JOIN "admins" a ON budget.allowed AND a."email" = ${email}
  `;
  if (!row) throw new Error("Missing authentication budget result");
  if (!row.allowed) return { ok: false, status: 429, error: "Too many attempts. Please wait before trying again.", retryAfter: row.retryAfter };
  return {
    ok: true,
    admin: row.id ? { id: row.id, email: row.email!, password: row.password!, username: row.username!, name: row.name! } : null,
  };
}

export async function limitAdminPasswordAttempts(email: string, source: string): Promise<Failure | null> {
  const result = await readAdminPasswordAttempt(email, source);
  return result.ok ? null : result;
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

async function readChallenge(hash: string): Promise<ChallengeSnapshot | undefined> {
  const [row] = await prisma.$queryRaw<ChallengeSnapshot[]>`
    SELECT a."id", a."email", a."password", a."username", a."name", c."id" AS "challengeId",
      c."tokenHash", c."otpHash", c."credentialDigest", c."attempts", c."delivered", c."createdAt", c."expiresAt",
      timezone('UTC', clock_timestamp()) AS "now"
    FROM "admin_login_challenges" c JOIN "admins" a ON a."id" = c."adminId" WHERE c."tokenHash" = ${hash}
  `;
  return row;
}

export async function issueAdminOtp(input: { admin: LoginAdmin } | { token: string }) {
  const previousHash = "token" in input ? tokenHash(input.token) : null;
  if ("token" in input && !previousHash) return INVALID_CHALLENGE;
  const snapshot = previousHash ? await readChallenge(previousHash) : undefined;
  if (previousHash && (!snapshot || !equalDigest(snapshot.credentialDigest, credentialDigest(snapshot)))) return INVALID_CHALLENGE;
  const admin = "admin" in input ? input.admin : snapshot!;
  const expectedCredentials = credentialDigest(admin);
  const token = randomBytes(32).toString("hex");
  const id = randomUUID();
  const otp = randomInt(0, 10 ** ADMIN_OTP_LENGTH).toString().padStart(ADMIN_OTP_LENGTH, "0");
  const cooldownKey = digest("admin-auth-rate/otp-cooldown", admin.id);
  const sendKey = digest("admin-auth-rate/otp-send", admin.id);
  // Each CTE consumes its predecessor's output. One implicit transaction replaces
  // the previous BEGIN / sequential application queries / COMMIT network trips.
  const [pending] = await prisma.$queryRaw<{ created: boolean; retryAfter: number; expiresAt: Date | null; createdAt: Date | null }[]>`
    WITH locked_admin AS MATERIALIZED (
      SELECT "id" FROM "admins" WHERE "id" = ${admin.id} AND "password" = ${admin.password} AND "email" = ${admin.email} FOR UPDATE
    ), previous AS MATERIALIZED (
      SELECT c.* FROM "admin_login_challenges" c JOIN locked_admin a ON a."id" = c."adminId"
      WHERE c."tokenHash" = ${previousHash} AND c."id" = ${snapshot?.challengeId ?? null}
        AND c."credentialDigest" = ${expectedCredentials} FOR UPDATE OF c
    ), eligible AS MATERIALIZED (
      SELECT a."id" FROM locked_admin a WHERE ${previousHash === null}::boolean OR EXISTS (
        SELECT 1 FROM previous WHERE "delivered" AND "expiresAt" > timezone('UTC', clock_timestamp())
          AND "attempts" < ${ADMIN_OTP_MAX_ATTEMPTS}::int
      )
    ), cooldown AS (
      INSERT INTO "admin_auth_rate_limits" ("key", "count", "windowEndsAt")
      SELECT ${cooldownKey}, 1, timezone('UTC', clock_timestamp()) + make_interval(secs => ${ADMIN_OTP_RESEND_SECONDS}::int) FROM eligible
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "admin_auth_rate_limits"."windowEndsAt" <= timezone('UTC', clock_timestamp()) THEN 1
          ELSE LEAST("admin_auth_rate_limits"."count" + 1, 2) END,
        "windowEndsAt" = CASE WHEN "admin_auth_rate_limits"."windowEndsAt" <= timezone('UTC', clock_timestamp())
          THEN timezone('UTC', clock_timestamp()) + make_interval(secs => ${ADMIN_OTP_RESEND_SECONDS}::int)
          ELSE "admin_auth_rate_limits"."windowEndsAt" END
      RETURNING "count", "windowEndsAt"
    ), send_budget AS (
      INSERT INTO "admin_auth_rate_limits" ("key", "count", "windowEndsAt")
      SELECT ${sendKey}, 1, timezone('UTC', clock_timestamp()) + interval '15 minutes' FROM cooldown WHERE "count" = 1
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "admin_auth_rate_limits"."windowEndsAt" <= timezone('UTC', clock_timestamp()) THEN 1
          ELSE LEAST("admin_auth_rate_limits"."count" + 1, 6) END,
        "windowEndsAt" = CASE WHEN "admin_auth_rate_limits"."windowEndsAt" <= timezone('UTC', clock_timestamp())
          THEN timezone('UTC', clock_timestamp()) + interval '15 minutes' ELSE "admin_auth_rate_limits"."windowEndsAt" END
      RETURNING "count", "windowEndsAt"
    ), issued_at AS MATERIALIZED (
      SELECT timezone('UTC', clock_timestamp()) AS "now" FROM send_budget WHERE "count" <= 5
    ), challenge AS (
      INSERT INTO "admin_login_challenges" ("id", "adminId", "tokenHash", "otpHash", "credentialDigest", "attempts", "delivered", "createdAt", "expiresAt")
      SELECT ${id}, ${admin.id}, ${tokenHash(token)}, ${digest("admin-login-otp", `${id}:${otp}`)}, ${expectedCredentials}, 0, false,
        "now", "now" + make_interval(secs => ${ADMIN_OTP_TTL_SECONDS}::int)
      FROM issued_at
      ON CONFLICT ("adminId") DO UPDATE SET "id" = EXCLUDED."id", "tokenHash" = EXCLUDED."tokenHash", "otpHash" = EXCLUDED."otpHash",
        "credentialDigest" = EXCLUDED."credentialDigest", "attempts" = 0, "delivered" = false,
        "createdAt" = EXCLUDED."createdAt", "expiresAt" = EXCLUDED."expiresAt"
      RETURNING "createdAt", "expiresAt"
    )
    SELECT EXISTS(SELECT 1 FROM challenge) AS "created", challenge."createdAt", challenge."expiresAt",
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (
        CASE WHEN cooldown."count" > 1 THEN cooldown."windowEndsAt" ELSE send_budget."windowEndsAt" END
        - timezone('UTC', clock_timestamp())
      ))))::int AS "retryAfter"
    FROM cooldown LEFT JOIN send_budget ON true LEFT JOIN challenge ON true
  `;
  if (!pending) return INVALID_CHALLENGE;
  if (!pending.created) return { ok: false as const, status: 429, error: "Too many attempts. Please wait before trying again.", retryAfter: pending.retryAfter };

  // Never hold a database transaction open while talking to the email provider.
  if (!(await sendAdminOtpEmail(admin.email, otp, id))) {
    await prisma.$executeRaw`DELETE FROM "admin_login_challenges" WHERE "id" = ${id}`;
    return { ok: false as const, status: 503, error: "Unable to send your verification email. Please sign in again shortly.", restart: true };
  }
  // A delayed/failed send cannot activate a newer replacement challenge.
  const [activated] = await prisma.$queryRaw<{ now: Date }[]>`
    UPDATE "admin_login_challenges" SET "delivered" = true WHERE "id" = ${id} AND "expiresAt" > timezone('UTC', clock_timestamp())
    RETURNING timezone('UTC', clock_timestamp()) AS "now"
  `;
  if (!activated) {
    await prisma.$executeRaw`DELETE FROM "admin_login_challenges" WHERE "id" = ${id}`;
    return INVALID_CHALLENGE;
  }
  return {
    ok: true as const, token, email: admin.email,
    expiresAt: pending.expiresAt!.toISOString(),
    resendAvailableAt: new Date(pending.createdAt!.getTime() + ADMIN_OTP_RESEND_SECONDS * 1_000).toISOString(),
    serverTime: activated.now.toISOString(),
  };
}

export async function verifyAdminOtp(token: string, otp: string) {
  const hash = tokenHash(token);
  if (!hash) return INVALID_CHALLENGE;
  const snapshot = await readChallenge(hash);
  if (!snapshot) return INVALID_CHALLENGE;
  const credentialsMatch = equalDigest(snapshot.credentialDigest, credentialDigest(snapshot));
  const otpMatches = equalDigest(snapshot.otpHash, digest("admin-login-otp", `${snapshot.challengeId}:${otp}`));
  // The preload is only a source for keyed comparisons. All mutable security state
  // is checked again after row locks, including attempts and database-clock expiry.
  const [result] = await prisma.$queryRaw<(Pick<LoginAdmin, "id" | "email" | "username" | "name"> & { outcome: string })[]>`
    WITH locked_admin AS MATERIALIZED (
      SELECT "id", "email", "username", "name" FROM "admins"
      WHERE "id" = ${snapshot.id} AND "password" = ${snapshot.password} AND "email" = ${snapshot.email} FOR UPDATE
    ), locked_challenge AS MATERIALIZED (
      SELECT c.* FROM "admin_login_challenges" c JOIN locked_admin a ON a."id" = c."adminId"
      WHERE c."id" = ${snapshot.challengeId} AND c."tokenHash" = ${hash}
        AND c."otpHash" = ${snapshot.otpHash} AND c."credentialDigest" = ${snapshot.credentialDigest} FOR UPDATE OF c
    ), checked AS MATERIALIZED (
      SELECT c.*, (${credentialsMatch}::boolean AND "delivered" AND "attempts" < ${ADMIN_OTP_MAX_ATTEMPTS}::int
        AND "expiresAt" > timezone('UTC', clock_timestamp())) AS active FROM locked_challenge c
    ), removed AS (
      DELETE FROM "admin_login_challenges" c USING checked s WHERE c."id" = s."id"
        AND (NOT s.active OR ${otpMatches}::boolean OR s."attempts" + 1 >= ${ADMIN_OTP_MAX_ATTEMPTS}::int)
      RETURNING CASE WHEN NOT s.active THEN 'invalid' WHEN ${otpMatches}::boolean THEN 'verified' ELSE 'locked_out' END AS outcome
    ), attempted AS (
      UPDATE "admin_login_challenges" c SET "attempts" = s."attempts" + 1 FROM checked s WHERE c."id" = s."id"
        AND s.active AND NOT ${otpMatches}::boolean AND s."attempts" + 1 < ${ADMIN_OTP_MAX_ATTEMPTS}::int
      RETURNING 'incorrect'::text AS outcome
    )
    SELECT result.outcome, a.* FROM (SELECT outcome FROM removed UNION ALL SELECT outcome FROM attempted) result
    CROSS JOIN locked_admin a
  `;
  // Success comes only from DELETE RETURNING; two requests cannot consume one code.
  if (!result || result.outcome === "invalid") return INVALID_CHALLENGE;
  if (result.outcome === "locked_out") return { ok: false as const, status: 401, error: "Too many incorrect codes. Sign in again.", restart: true };
  if (result.outcome === "incorrect") return { ok: false as const, status: 401, error: "Incorrect verification code. Please try again." };
  if (result.outcome !== "verified") return INVALID_CHALLENGE;
  return { ok: true as const, admin: { id: result.id, email: result.email, username: result.username, name: result.name } };
}

export async function getAdminOtpStatus(token: string) {
  const hash = tokenHash(token);
  if (!hash) return null;
  const challenge = await readChallenge(hash);
  if (!challenge) return null;
  if (!challenge.delivered || challenge.expiresAt <= challenge.now || challenge.attempts >= ADMIN_OTP_MAX_ATTEMPTS
    || !equalDigest(challenge.credentialDigest, credentialDigest(challenge))) {
    await prisma.$executeRaw`DELETE FROM "admin_login_challenges" WHERE "id" = ${challenge.challengeId}`;
    return null;
  }
  return {
    email: challenge.email, expiresAt: challenge.expiresAt.toISOString(),
    resendAvailableAt: new Date(challenge.createdAt.getTime() + ADMIN_OTP_RESEND_SECONDS * 1_000).toISOString(),
    serverTime: challenge.now.toISOString(),
  };
}

export async function cancelAdminOtp(token: string): Promise<void> {
  const hash = tokenHash(token);
  if (hash) await prisma.$executeRaw`DELETE FROM "admin_login_challenges" WHERE "tokenHash" = ${hash}`;
}
