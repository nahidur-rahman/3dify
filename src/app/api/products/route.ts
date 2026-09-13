import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/adminSession";
import { resolveProductColorConfig } from "@/lib/productColors";
import { PRODUCT_SEARCH_CACHE_TAG } from "@/lib/productSearch";
import {
  buildProductCatalogWhere,
  getProductCatalogOrderBy,
  productCardSelect,
  PRODUCT_CATALOG_CACHE_TAG,
  serializeProductCard,
} from "@/lib/productCatalog";
import { PRODUCT_CATALOG_PAGE_SIZE } from "@/lib/productCatalogConfig";
import { parsePage } from "@/lib/pagination";
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
    const search = searchParams.get("search")?.trim() || "";
    const sortParam = searchParams.get("sort")?.trim();
    const sort =
      sortParam === "price-asc" || sortParam === "price-desc"
        ? sortParam
        : "newest";
    const featured = searchParams.get("featured");
    const cursor = searchParams.get("cursor")?.trim() || "";
    const page = parsePage(searchParams.get("page"));
    const requestedLimit = Number.parseInt(
      searchParams.get("limit") || String(PRODUCT_CATALOG_PAGE_SIZE),
      10
    );
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 48)
        : PRODUCT_CATALOG_PAGE_SIZE;

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

    const where = buildProductCatalogWhere({
      category,
      subcategory: subcategory || "",
      search: search.toLowerCase().replace(/\s+/g, " "),
    });
    if (featured === "true") {
      where.featured = true;
    }

    const orderBy = getProductCatalogOrderBy(sort);

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: productCardSelect,
        orderBy,
        ...(cursor
          ? { cursor: { id: cursor }, skip: 1 }
          : { skip: (page - 1) * limit }),
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map(serializeProductCard),
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
      revalidateTag(PRODUCT_CATALOG_CACHE_TAG);

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
