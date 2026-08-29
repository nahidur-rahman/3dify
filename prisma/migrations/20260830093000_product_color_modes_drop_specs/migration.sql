CREATE TYPE "ColorMode" AS ENUM ('FIXED', 'OPTIONS');

ALTER TABLE "products"
ADD COLUMN "colorMode" "ColorMode" NOT NULL DEFAULT 'FIXED',
ADD COLUMN "colorOptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "products"
DROP COLUMN "weight",
DROP COLUMN "infillPercentage";