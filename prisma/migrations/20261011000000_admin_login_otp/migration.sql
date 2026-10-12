CREATE TABLE "admin_login_challenges" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "credentialDigest" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admin_login_challenges_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "admin_login_challenges_attempts_check" CHECK ("attempts" BETWEEN 0 AND 5),
    CONSTRAINT "admin_login_challenges_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "admin_login_challenges_adminId_key" ON "admin_login_challenges"("adminId");
CREATE UNIQUE INDEX "admin_login_challenges_tokenHash_key" ON "admin_login_challenges"("tokenHash");
CREATE INDEX "admin_login_challenges_expiresAt_idx" ON "admin_login_challenges"("expiresAt");

CREATE TABLE "admin_auth_rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowEndsAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admin_auth_rate_limits_pkey" PRIMARY KEY ("key"),
    CONSTRAINT "admin_auth_rate_limits_count_check" CHECK ("count" > 0)
);
CREATE INDEX "admin_auth_rate_limits_windowEndsAt_idx" ON "admin_auth_rate_limits"("windowEndsAt");

-- These tables hold authentication material and must never be exposed via PostgREST.
ALTER TABLE "admin_login_challenges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "admin_auth_rate_limits" ENABLE ROW LEVEL SECURITY;
