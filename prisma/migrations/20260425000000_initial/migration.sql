-- CreateEnum
CREATE TYPE "Category" AS ENUM ('FIGURINE', 'PHONE_CASE', 'HOME_DECOR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SizeMode" AS ENUM ('FIXED', 'OPTIONS');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "images" TEXT[],
    "category" "Category" NOT NULL,
    "color" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "sizeMode" "SizeMode" NOT NULL DEFAULT 'FIXED',
    "sizeOptions" JSONB,
    "weight" DOUBLE PRECISION NOT NULL,
    "infillPercentage" INTEGER NOT NULL DEFAULT 20,
    "discountPercent" INTEGER NOT NULL DEFAULT 0,
    "customizable" BOOLEAN NOT NULL DEFAULT false,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");
