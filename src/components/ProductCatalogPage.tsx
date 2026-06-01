import { Suspense } from "react";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import SearchFilter from "@/components/SearchFilter";
import { buildCatalogUrl, getCategoryPath, type Category } from "@/lib/categories";
import type { ProductCatalogData } from "@/lib/productCatalog";

type ProductCatalogPageProps = ProductCatalogData;

export default function ProductCatalogPage({
  products,
  totalPages,
  currentPage,
  search,
  sort,
  activeCategory,
  activeSubcategory,
  selectedCategory,
}: ProductCatalogPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-5 rounded-2xl border border-gray-200/70 bg-white/85 p-4 shadow-sm dark:border-dark-200 dark:bg-dark-100/85 sm:p-5">
        <div className="mb-2 inline-flex rounded-full border border-primary-500/15 bg-primary-500/5 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-500 dark:text-primary-300">
          Storefront Catalog
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {selectedCategory ? (
            <>
              {selectedCategory.label}
              {activeSubcategory ? (
                <>
                  {" "}
                  <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
                    {activeSubcategory}
                  </span>
                </>
              ) : null}
            </>
          ) : (
            <>
              Our{" "}
              <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
                Products
              </span>
            </>
          )}
        </h1>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-2xl text-base text-gray-500 dark:text-gray-400">
            {selectedCategory
              ? selectedCategory.description
              : "Discover premium 3D printed items built for collectors, gift buyers, and custom requests."}
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
            {selectedCategory ? (
              <span className="rounded-full bg-primary-500/10 px-2.5 py-1 text-primary-500 dark:text-primary-300">
                {selectedCategory.label}
              </span>
            ) : null}
            {activeSubcategory ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 dark:bg-dark">
                {activeSubcategory}
              </span>
            ) : null}
            {selectedCategory ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 dark:bg-dark">
                {selectedCategory.slug}
              </span>
            ) : null}
            <span className="rounded-full bg-gray-100 px-2.5 py-1 dark:bg-dark">Made to order</span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 dark:bg-dark">Direct support</span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 dark:bg-dark">Clear pricing</span>
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="mb-6 h-12 rounded-xl bg-gray-100 dark:bg-dark-100 animate-pulse" />
        }
      >
        <SearchFilter currentCategory={activeCategory} />
      </Suspense>

      <ProductGrid
        products={products}
        resetHref={activeCategory ? getCategoryPath(activeCategory) : "/products"}
      />

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <Link
              key={pageNumber}
              href={buildCatalogUrl({
                category: activeCategory as Category | null,
                search,
                sort,
                subcategory: activeSubcategory || null,
                page: pageNumber.toString(),
              })}
              className={`flex h-9 w-9 items-center justify-center rounded-lg font-medium transition-colors ${
                pageNumber === currentPage
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 dark:bg-dark-100 text-gray-600 dark:text-gray-400 hover:bg-primary-500/10 hover:text-primary-500"
              }`}
            >
              {pageNumber}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}