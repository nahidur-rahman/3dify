ALTER TABLE "products"
ADD COLUMN "subcategory" TEXT;

ALTER TYPE "Category" RENAME TO "Category_old";

CREATE TYPE "Category" AS ENUM (
    'HOME_DECOR',
    'DESK_ACCESSORIES',
    'LAMPS',
    'VASES_AND_PLANTERS',
    'TOYS_AND_FIDGETS',
    'COLLECTIBLES_AND_FIGURES',
    'GAMING_AND_POP_CULTURE',
    'COSPLAY_PROPS_AND_MODEL_KITS',
    'CUSTOM_AND_PERSONALIZED',
    'PET_ACCESSORIES'
);

ALTER TABLE "products"
ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;

UPDATE "products"
SET "category" = 'COLLECTIBLES_AND_FIGURES'
WHERE "category" = 'FIGURINE';

UPDATE "products"
SET "category" = 'HOME_DECOR'
WHERE "category" = 'HOME_DECOR';

UPDATE "products"
SET "category" = 'CUSTOM_AND_PERSONALIZED'
WHERE "category" = 'CUSTOM';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "products"
        WHERE "category" = 'PHONE_CASE'
    ) THEN
        RAISE EXCEPTION 'Manual category remap required: update all PHONE_CASE products before applying the new Category enum.';
    END IF;
END $$;

ALTER TABLE "products"
ALTER COLUMN "category" TYPE "Category" USING "category"::"Category";

DROP TYPE "Category_old";