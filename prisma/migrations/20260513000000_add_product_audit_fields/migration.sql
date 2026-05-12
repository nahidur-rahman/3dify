-- Add audit columns to products so admin usernames can be stored with each change.
ALTER TABLE "products"
ADD COLUMN "createdBy" TEXT,
ADD COLUMN "updatedBy" TEXT;