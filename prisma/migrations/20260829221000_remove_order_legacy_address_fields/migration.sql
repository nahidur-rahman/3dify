UPDATE "orders"
SET "address" = concat_ws(
  ', ',
  nullif(
    btrim(
      regexp_replace(
        regexp_replace(
          regexp_replace(coalesce("address", ''), 'House/Road:\s*', '', 'g'),
          'Area/Village:\s*',
          '',
          'g'
        ),
        'Town/City/Thana:\s*',
        '',
        'g'
      )
    ),
    ''
  ),
  nullif(btrim("city"), ''),
  CASE
    WHEN "postalCode" IS NULL OR btrim("postalCode") = '' THEN NULL
    WHEN "city" IS NULL OR btrim("city") = '' THEN btrim("postalCode")
    WHEN lower(btrim("postalCode")) LIKE lower(btrim("city")) || '-%' THEN btrim("postalCode")
    WHEN btrim("postalCode") ~ '^[0-9]+$' THEN concat(btrim("city"), '-', btrim("postalCode"))
    ELSE btrim("postalCode")
  END
);

ALTER TABLE "orders"
DROP COLUMN "apartment",
DROP COLUMN "city",
DROP COLUMN "postalCode";