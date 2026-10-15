import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/adminSession";
import { resolveProductCustomizationConfig } from "@/lib/productColors";
import { PRODUCT_SEARCH_CACHE_TAG } from "@/lib/productSearch";
import { PRODUCT_CATALOG_CACHE_TAG } from "@/lib/productCatalog";
import { productSchema } from "@/lib/validation";
import {
  deleteProductImages,
  hydrateProductImages,
  getProductImageLimit,
  finalizeProductMedia,
  productMediaRefs,
  normalizeProductImages,
} from "@/lib/productImages";

// GET /api/products/[id] — get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(hydrateProductImages(product));
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] — update product (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let unsavedMedia: string[] = [];
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const parsed = productSchema.safeParse({ ...hydrateProductImages(existing), ...body });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }
    const updateData = { ...resolveProductCustomizationConfig(parsed.data), updatedBy: admin.username };
    {
      const normalizedImages = normalizeProductImages(updateData.images);
      const imageLimit = getProductImageLimit();

      if (imageLimit !== null && normalizedImages.length > imageLimit) {
        return NextResponse.json(
          {
            error: `Image limit reached. Maximum ${imageLimit} images per product.`,
          },
          { status: 400 }
        );
      }

      Object.assign(updateData, await finalizeProductMedia(normalizedImages, updateData.textDesigns, params.id, productMediaRefs(existing)));
      const existingMedia = new Set(productMediaRefs(existing));
      unsavedMedia = productMediaRefs(updateData).filter((ref) => !existingMedia.has(ref));
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
    });
    unsavedMedia = [];

    const retainedMedia = new Set(productMediaRefs(updateData));
    const removedMedia = productMediaRefs(existing).filter((ref) => !retainedMedia.has(ref));
    await deleteProductImages(removedMedia).catch((error) => console.error("Product media cleanup failed:", error));

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${params.id}`);
    revalidateTag(PRODUCT_SEARCH_CACHE_TAG);
    revalidateTag(PRODUCT_CATALOG_CACHE_TAG);

    return NextResponse.json(hydrateProductImages(product));
  } catch (error) {
    await deleteProductImages(unsavedMedia).catch((cleanupError) => console.error("Unsaved media cleanup failed:", cleanupError));
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] — delete product (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.product.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    
    try {
      await deleteProductImages(productMediaRefs(existing));
    } catch (cleanupError) {
      console.error(
        `Delete product image cleanup error for ${params.id}:`,
        cleanupError
      );
    }
    await prisma.product.delete({ where: { id: params.id } });

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath(`/products/${params.id}`);
    revalidateTag(PRODUCT_SEARCH_CACHE_TAG);
    revalidateTag(PRODUCT_CATALOG_CACHE_TAG);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
