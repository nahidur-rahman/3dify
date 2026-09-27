-- Rename the enum value in place so existing product rows are preserved.
ALTER TYPE "Category"
RENAME VALUE 'CUSTOM_AND_PERSONALIZED' TO 'KEYCHAINS';
