import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/adminSession";
import { resolveProductColorConfig } from "@/lib/productColors";
import { PRODUCT_SEARCH_CACHE_TAG } from "@/lib/productSearch";
import {
  isCategoryValue,
  isValidSubcategoryForCategory,
} from "@/lib/categories";
import { productSchema } from "@/lib/validation";
import {
  deleteProductImages,
  getProductImageLimit,
  hydrateProductImages,
  moveDraftImagesToProductFolder,
  normalizeProductImages,
} from "@/lib/productImages";

// GET /api/products — list all products with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryParam = searchParams.get("category")?.trim();
    const category = categoryParam && isCategoryValue(categoryParam) ? categoryParam : null;
    const subcategory = searchParams.get("subcategory")?.trim();
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");
    const featured = searchParams.get("featured");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    if (categoryParam && !category) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    if (
      category &&
      subcategory &&
      !isValidSubcategoryForCategory(category, subcategory)
    ) {
      return NextResponse.json(
        { error: "Invalid subcategory for the selected category" },
        { status: 400 }
      );
    }

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (subcategory) {
      where.subcategory = subcategory;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (featured === "true") {
      where.featured = true;
    }

    // Build orderBy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { createdAt: "desc" };
    if (sort === "price-asc") orderBy = { price: "asc" };
    if (sort === "price-desc") orderBy = { price: "desc" };
    if (sort === "newest") orderBy = { createdAt: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map((product) => hydrateProductImages(product)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/products — create a new product (admin only)
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = productSchema.safeParse({
      ...body,
      ...resolveProductColorConfig(body),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const normalizedImages = normalizeProductImages(parsed.data.images);
    const imageLimit = getProductImageLimit();

    if (imageLimit !== null && normalizedImages.length > imageLimit) {
      await deleteProductImages(normalizedImages);
      return NextResponse.json(
        {
          error: `Image limit reached. Maximum ${imageLimit} images per product.`,
        },
        { status: 400 }
      );
    }

    const created = await prisma.product.create({
      data: {
        ...parsed.data,
        images: [],
        createdBy: admin.username,
        updatedBy: admin.username,
      },
    });

    try {
      const finalizedImages = await moveDraftImagesToProductFolder(
        normalizedImages,
        created.id
      );

      const product = await prisma.product.update({
        where: { id: created.id },
        data: {
          ...parsed.data,
          images: finalizedImages,
          updatedBy: admin.username,
        },
      });

      revalidatePath("/");
      revalidatePath("/products");
      revalidateTag(PRODUCT_SEARCH_CACHE_TAG);

      return NextResponse.json(hydrateProductImages(product), { status: 201 });
    } catch (error) {
      await prisma.product.delete({ where: { id: created.id } });
      throw error;
    }
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
