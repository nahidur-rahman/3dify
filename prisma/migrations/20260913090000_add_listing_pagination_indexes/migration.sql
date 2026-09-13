-- Keep storefront category pagination ordered without sorting the full result set.
CREATE INDEX "products_category_createdAt_id_idx"
ON "products"("category", "createdAt", "id");

CREATE INDEX "products_category_price_id_idx"
ON "products"("category", "price", "id");

-- Support the admin's newest-first order pages, both globally and by status.
CREATE INDEX "orders_status_createdAt_id_idx"
ON "orders"("status", "createdAt", "id");

CREATE INDEX "orders_createdAt_id_idx"
ON "orders"("createdAt", "id");

-- PostgreSQL does not automatically index relation foreign keys.
CREATE INDEX "order_items_orderId_idx"
ON "order_items"("orderId");
