import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { hydrateProductImages } from "@/lib/productImages";
import { Product, ProductCardProduct } from "@/lib/types";
import {
  categoryByValue,
  type Category,
  type CategoryDetails,
  isValidSubcategoryForCategory,
} from "@/lib/categories";
import { prisma } from "@/lib/db";
import { PRODUCT_CATALOG_PAGE_SIZE } from "@/lib/productCatalogConfig";

export const PRODUCT_CATALOG_CACHE_TAG = "product-catalog";

export const productCardSelect = {
  id: true,
  name: true,
  price: true,
  images: true,
  sizeOptions: true,
  discountPercent: true,
  inStock: true,
} satisfies Prisma.ProductSelect;

type ProductCardRecord = Prisma.ProductGetPayload<{
  select: typeof productCardSelect;
}>;

export function serializeProductCard(
  product: ProductCardRecord
): ProductCardProduct {
  const hydrated = hydrateProductImages(product);

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    images: hydrated.images,
    sizeOptions: hydrated.sizeOptions,
    discountPercent: product.discountPercent,
    inStock: product.inStock,
  };
}

export function buildProductCatalogWhere({
  category,
  subcategory,
  search,
}: {
  category: Category | null;
  subcategory: string;
  search: string;
}): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (category) where.category = category;
  if (subcategory) where.subcategory = subcategory;

  const searchTokens = search.split(/\s+/).filter(Boolean);
  if (searchTokens.length > 0) {
    where.AND = searchTokens.map((token) => ({
      name: { contains: token, mode: "insensitive" },
    }));
  }

  return where;
}

export function getProductCatalogOrderBy(
  sort: string
): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "price-asc") {
    return [{ price: "asc" }, { id: "asc" }];
  }

  if (sort === "price-desc") {
    return [{ price: "desc" }, { id: "desc" }];
  }

  return [{ createdAt: "desc" }, { id: "desc" }];
}

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
  products: ProductCardProduct[];
  total: number;
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
    const where = buildProductCatalogWhere({ category, subcategory, search });
    const orderBy = getProductCatalogOrderBy(sort);
    const [initialProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: productCardSelect,
        orderBy,
        skip: (page - 1) * PRODUCT_CATALOG_PAGE_SIZE,
        take: PRODUCT_CATALOG_PAGE_SIZE,
      }),
      prisma.product.count({ where }),
    ]);
    const totalPages = Math.ceil(total / PRODUCT_CATALOG_PAGE_SIZE);
    const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
    const products =
      currentPage === page
        ? initialProducts
        : await prisma.product.findMany({
            where,
            select: productCardSelect,
            orderBy,
            skip: (currentPage - 1) * PRODUCT_CATALOG_PAGE_SIZE,
            take: PRODUCT_CATALOG_PAGE_SIZE,
          });

    return {
      products: products.map(serializeProductCard),
      total,
      totalPages,
      currentPage,
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
    const { products, total, totalPages, currentPage: resolvedPage } =
      await getCachedCatalogProducts(
      activeCategory,
      activeSubcategory,
      search.toLowerCase().replace(/\s+/g, " "),
      sort,
      currentPage
    );

    return {
      products,
      total,
      totalPages,
      currentPage: resolvedPage,
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
      total: 0,
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
