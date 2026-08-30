-- AlterTable
ALTER TABLE "products"
ADD COLUMN "topSelling" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sellCount" INTEGER NOT NULL DEFAULT 0;

-- Backfill existing sell counts from historical order items.
UPDATE "products"
SET "sellCount" = order_totals."quantity"
FROM (
  SELECT "productId", SUM("quantity")::INTEGER AS "quantity"
  FROM "order_items"
  GROUP BY "productId"
) AS order_totals
WHERE "products"."id" = order_totals."productId";

-- CreateIndex
CREATE INDEX "products_topSelling_sellCount_updatedAt_idx"
ON "products"("topSelling", "sellCount", "updatedAt");