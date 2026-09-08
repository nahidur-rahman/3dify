import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { hydrateProductImages } from "@/lib/productImages";
import { Product } from "@/lib/types";
import {
  categoryByValue,
  type Category,
  type CategoryDetails,
  isValidSubcategoryForCategory,
} from "@/lib/categories";
import { prisma } from "@/lib/db";

export const PRODUCT_CATALOG_CACHE_TAG = "product-catalog";

const getProductById = unstable_cache(
  async (id: string): Promise<Product | null> => {
    const product = await prisma.product.findUnique({ where: { id } });
    return product ? hydrateProductImages(product) : null;
  },
  ["product-by-id"],
  { revalidate: 60, tags: [PRODUCT_CATALOG_CACHE_TAG] }
);

// React cache deduplicates metadata/page reads within a render; the Data Cache
// also reuses successful database reads across separate navigations.
export const getCachedProductById = cache(async (id: string): Promise<Product | null> => {
  try {
    return await getProductById(id);
  } catch {
    return null;
  }
});

export interface ProductCatalogSearchParams {
  category?: string;
  search?: string;
  sort?: string;
  subcategory?: string;
  page?: string;
}

export interface ProductCatalogData {
  products: Product[];
  totalPages: number;
  currentPage: number;
  search: string;
  sort: string;
  activeCategory: Category | null;
  activeSubcategory: string;
  selectedCategory: CategoryDetails | null;
}

function normalizeSearchParam(value?: string) {
  return value?.trim() || "";
}

// Catalog routes use searchParams and render dynamically. Route-level
// revalidate alone does not cache their direct Prisma queries.
const getCachedCatalogProducts = unstable_cache(
  async (
    category: Category | null,
    subcategory: string,
    search: string,
    sort: string,
    page: number
  ) => {
    const where: Prisma.ProductWhereInput = {};
    if (category) where.category = category;
    if (subcategory) where.subcategory = subcategory;

    const searchTokens = search.split(/\s+/).filter(Boolean);
    if (searchTokens.length > 0) {
      where.AND = searchTokens.map((token) => ({
        name: { contains: token, mode: "insensitive" },
      }));
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : { createdAt: "desc" };

    const limit = 12;
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map((product) => hydrateProductImages(product)),
      totalPages: Math.ceil(total / limit),
    };
  },
  ["product-catalog"],
  { revalidate: 60, tags: [PRODUCT_CATALOG_CACHE_TAG] }
);

export async function getProductCatalogData(
  searchParams: ProductCatalogSearchParams,
  activeCategory: Category | null = null
): Promise<ProductCatalogData> {
  const search = normalizeSearchParam(searchParams.search);
  const sortParam = normalizeSearchParam(searchParams.sort);
  const sort = sortParam === "price-asc" || sortParam === "price-desc" ? sortParam : "newest";
  const subcategoryParam = normalizeSearchParam(searchParams.subcategory);
  const parsedPage = Number.parseInt(searchParams.page || "1", 10);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const selectedCategory = activeCategory ? categoryByValue[activeCategory] : null;
  const activeSubcategory =
    activeCategory && subcategoryParam
      ? isValidSubcategoryForCategory(activeCategory, subcategoryParam)
        ? subcategoryParam
        : ""
      : "";

  try {
    const { products, totalPages } = await getCachedCatalogProducts(
      activeCategory,
      activeSubcategory,
      search.toLowerCase().replace(/\s+/g, " "),
      sort,
      currentPage
    );

    return {
      products,
      totalPages,
      currentPage,
      search,
      sort,
      activeCategory,
      activeSubcategory,
      selectedCategory,
    };
  } catch {
    // Keep failures outside the cached function so a temporary database outage
    // cannot populate the shared cache with an empty catalog.
    return {
      products: [],
      totalPages: 0,
      currentPage: 1,
      search,
      sort,
      activeCategory,
      activeSubcategory,
      selectedCategory,
    };
  }
}
