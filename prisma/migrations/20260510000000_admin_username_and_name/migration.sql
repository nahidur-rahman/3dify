ALTER TABLE "admins" RENAME COLUMN "name" TO "username";

ALTER TABLE "admins" ADD COLUMN "name" TEXT;

UPDATE "admins"
SET "name" = "username"
WHERE "name" IS NULL;

ALTER TABLE "admins" ALTER COLUMN "name" SET NOT NULL;

CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");