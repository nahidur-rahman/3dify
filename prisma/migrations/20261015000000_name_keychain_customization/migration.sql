ALTER TABLE "products"
  ADD COLUMN "baseColor" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "textColor" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "baseColorOptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "textColorOptions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "textDesigns" JSONB NOT NULL DEFAULT '[]';

-- Preserve existing color choices; the old catalog did not specify text color.
UPDATE "products"
SET "baseColor" = CASE WHEN "colorMode" = 'FIXED' THEN "color" ELSE '' END,
    "textColor" = 'As shown',
    "baseColorOptions" = CASE WHEN "colorMode" = 'OPTIONS' THEN "colorOptions" ELSE ARRAY[]::TEXT[] END,
    "textColorOptions" = CASE WHEN "colorMode" = 'OPTIONS' THEN ARRAY['As shown']::TEXT[] ELSE ARRAY[]::TEXT[] END
WHERE "category" = 'KEYCHAINS' AND "subcategory" = 'Name Keychains';

ALTER TABLE "order_items" ADD COLUMN "customization" JSONB;
