import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import SearchFilter from "@/components/SearchFilter";
import { prisma } from "@/lib/db";
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
    <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-5 rounded-2xl border border-gray-200/70 bg-white/85 p-4 shadow-sm dark:border-dark-200 dark:bg-dark-100/85 sm:p-5">
        <div className="mb-2 inline-flex rounded-full border border-primary-500/15 bg-primary-500/5 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-500 dark:text-primary-300">
          Storefront Catalog
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Our{" "}
          <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
            Products
          </span>
        </h1>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-2xl text-base text-gray-500 dark:text-gray-400">
            Discover premium 3D printed items built for collectors, gift buyers, and custom requests.
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 dark:bg-dark">Made to order</span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 dark:bg-dark">Direct support</span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 dark:bg-dark">Clear pricing</span>
          </div>
        </div>
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
        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={`/products?${new URLSearchParams({
                ...searchParams,
                page: page.toString(),
              }).toString()}`}
              className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium transition-colors ${
                page === currentPage
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400 hover:bg-primary-500/10 hover:text-primary-500"
              }`}
            >
              {page}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}