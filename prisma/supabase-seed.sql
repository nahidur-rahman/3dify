-- 3Dify BD Supabase seed script
-- Run this in the Supabase SQL editor after the schema migration.
-- It is idempotent: it removes prior sample rows by name/category, then reinserts them.

-- Upsert admin (password is bcrypt-hashed for the current seed password)
INSERT INTO "admins" ("id", "email", "password", "name", "createdAt")
VALUES (
  'admin_3dify_bd',
  'admin@3difybd.com',
  '$2b$12$hQFu270I6fq5Di9hy4rUUuUV7aHqN2rr5mJoWc6mVWhpyCHrPHcwC',
  'Admin',
  NOW()
)
ON CONFLICT ("email") DO UPDATE
SET
  "password" = EXCLUDED."password",
  "name" = EXCLUDED."name";

-- Remove any previous sample rows so this script can be rerun safely.
DELETE FROM "products"
WHERE ("name" = 'Dragon Figurine' AND "category" = 'FIGURINE')
   OR ("name" = 'Geometric Phone Case' AND "category" = 'PHONE_CASE')
   OR ("name" = 'Modern Vase' AND "category" = 'HOME_DECOR')
   OR ("name" = 'Custom Name Plate' AND "category" = 'CUSTOM')
   OR ("name" = 'Iron Man Helmet' AND "category" = 'FIGURINE')
   OR ("name" = 'Hexagonal Wall Art Set' AND "category" = 'HOME_DECOR');

INSERT INTO "products" (
  "id",
  "name",
  "description",
  "price",
  "images",
  "category",
  "color",
  "size",
  "sizeMode",
  "sizeOptions",
  "weight",
  "infillPercentage",
  "discountPercent",
  "customizable",
  "inStock",
  "featured",
  "createdAt",
  "updatedAt"
)
VALUES
(
  'prod_dragon_figurine',
  'Dragon Figurine',
  'A beautifully detailed dragon figurine, perfect for collectors and fantasy enthusiasts. Each scale is meticulously crafted with high-resolution 3D printing technology.',
  1500,
  ARRAY['/placeholder/dragon.jpg']::text[],
  'FIGURINE',
  'Metallic Silver',
  '15x10x8 cm',
  'FIXED',
  '[]'::jsonb,
  120,
  30,
  0,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
),
(
  'prod_geometric_phone_case',
  'Geometric Phone Case',
  'Sleek geometric pattern phone case with shock-absorbing design. Available for most popular phone models. Lightweight yet durable TPU material.',
  800,
  ARRAY['/placeholder/phone-case.jpg']::text[],
  'PHONE_CASE',
  'Matte Black',
  '16x8x1.2 cm',
  'OPTIONS',
  '[{"label":"Standard","price":800},{"label":"Premium Grip","price":950}]'::jsonb,
  35,
  50,
  10,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
),
(
  'prod_modern_vase',
  'Modern Vase',
  'A stunning modern vase with a twisted spiral design. Perfect centerpiece for any room. Smooth finish with a premium feel.',
  1200,
  ARRAY['/placeholder/vase.jpg']::text[],
  'HOME_DECOR',
  'White',
  '20x10x10 cm',
  'FIXED',
  '[]'::jsonb,
  200,
  20,
  0,
  FALSE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
),
(
  'prod_custom_name_plate',
  'Custom Name Plate',
  'Personalized 3D printed name plate for your desk or door. Choose your font, color, and size. Makes a great gift!',
  600,
  ARRAY['/placeholder/nameplate.jpg']::text[],
  'CUSTOM',
  'Any Color',
  '20x5x2 cm',
  'OPTIONS',
  '[{"label":"Small","price":500},{"label":"Medium","price":600},{"label":"Large","price":750}]'::jsonb,
  80,
  40,
  5,
  TRUE,
  TRUE,
  TRUE,
  NOW(),
  NOW()
),
(
  'prod_iron_man_helmet',
  'Iron Man Helmet',
  'Wearable Iron Man Mark 85 helmet replica. Highly detailed with metallic finish. A must-have for Marvel fans and cosplayers.',
  3500,
  ARRAY['/placeholder/ironman.jpg']::text[],
  'FIGURINE',
  'Red & Gold',
  '30x25x25 cm',
  'FIXED',
  '[]'::jsonb,
  450,
  25,
  0,
  FALSE,
  TRUE,
  FALSE,
  NOW(),
  NOW()
),
(
  'prod_hexagonal_wall_art_set',
  'Hexagonal Wall Art Set',
  'Set of 6 hexagonal wall tiles with 3D geometric patterns. Easy to mount, creates a stunning accent wall.',
  2000,
  ARRAY['/placeholder/wall-art.jpg']::text[],
  'HOME_DECOR',
  'White & Gray',
  '12x12x2 cm each',
  'OPTIONS',
  '[{"label":"Set of 4","price":1600},{"label":"Set of 6","price":2000}]'::jsonb,
  300,
  15,
  12,
  TRUE,
  TRUE,
  FALSE,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "price" = EXCLUDED."price",
  "images" = EXCLUDED."images",
  "category" = EXCLUDED."category",
  "color" = EXCLUDED."color",
  "size" = EXCLUDED."size",
  "sizeMode" = EXCLUDED."sizeMode",
  "sizeOptions" = EXCLUDED."sizeOptions",
  "weight" = EXCLUDED."weight",
  "infillPercentage" = EXCLUDED."infillPercentage",
  "discountPercent" = EXCLUDED."discountPercent",
  "customizable" = EXCLUDED."customizable",
  "inStock" = EXCLUDED."inStock",
  "featured" = EXCLUDED."featured",
  "updatedAt" = NOW();
