import { hydrateProductImages } from "@/lib/productImages";
import { Product } from "@/lib/types";
import {
  categoryByValue,
  type Category,
  type CategoryDetails,
  isValidSubcategoryForCategory,
} from "@/lib/categories";
import { prisma } from "@/lib/db";

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

export async function getProductCatalogData(
  searchParams: ProductCatalogSearchParams,
  activeCategory: Category | null = null
): Promise<ProductCatalogData> {
  const search = normalizeSearchParam(searchParams.search);
  const sort = normalizeSearchParam(searchParams.sort) || "newest";
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
  const limit = 12;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (activeCategory) {
    where.category = activeCategory;
  }

  if (activeSubcategory) {
    where.subcategory = activeSubcategory;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let orderBy: any = { createdAt: "desc" };
  if (sort === "price-asc") orderBy = { price: "asc" };
  if (sort === "price-desc") orderBy = { price: "desc" };

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (currentPage - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map((product) => hydrateProductImages(product)),
      totalPages: Math.ceil(total / limit),
      currentPage,
      search,
      sort,
      activeCategory,
      activeSubcategory,
      selectedCategory,
    };
  } catch {
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