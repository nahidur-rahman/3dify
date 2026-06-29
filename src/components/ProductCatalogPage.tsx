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