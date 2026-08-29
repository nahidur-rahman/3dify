CREATE INDEX IF NOT EXISTS "products_name_search_vector_idx"
ON "products"
USING GIN (to_tsvector('simple', coalesce(name, '')));