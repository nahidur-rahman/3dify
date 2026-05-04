import { Suspense } from "react";
import { Metadata } from "next";
import ProductGrid from "@/components/ProductGrid";
import SearchFilter from "@/components/SearchFilter";
import { prisma } from "@/lib/db";
import { Product } from "@/lib/types";
import { hydrateProductImages } from "@/lib/productImages";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our collection of premium 3D printed products.",
};

interface ProductsPageProps {
  searchParams: {
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
  };
}

async function getProducts(searchParams: ProductsPageProps["searchParams"]) {
  const { category, search, sort, page = "1" } = searchParams;
  const limit = 12;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (category) where.category = category;
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
        skip: (parseInt(page) - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map((product) => hydrateProductImages(product)),
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    };
  } catch {
    return { products: [], totalPages: 0, currentPage: 1 };
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { products, totalPages, currentPage } = await getProducts(searchParams);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Our{" "}
          <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
            Products
          </span>
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Discover our collection of premium 3D printed items
        </p>
      </div>

      {/* Filters */}
      <Suspense
        fallback={
          <div className="h-12 bg-gray-100 dark:bg-dark-100 rounded-xl animate-pulse" />
        }
      >
        <SearchFilter />
      </Suspense>

      {/* Product Grid */}
      <ProductGrid products={products} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <a
              key={page}
              href={`/products?${new URLSearchParams({
                ...searchParams,
                page: page.toString(),
              }).toString()}`}
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors ${
                page === currentPage
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400 hover:bg-primary-500/10 hover:text-primary-500"
              }`}
            >
              {page}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}