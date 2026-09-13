import { Suspense } from "react";
import ProductCatalogResults from "@/components/ProductCatalogResults";
import SearchFilter from "@/components/SearchFilter";
import type { ProductCatalogData } from "@/lib/productCatalog";
import ProductCatalogFilterSkeleton from "@/components/loading/ProductCatalogFilterSkeleton";

type ProductCatalogPageProps = ProductCatalogData;

export default function ProductCatalogPage({
  products,
  total,
  totalPages,
  currentPage,
  search,
  sort,
  activeCategory,
  activeSubcategory,
}: ProductCatalogPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-5 lg:px-8">


      <Suspense
        fallback={<ProductCatalogFilterSkeleton />}
      >
        <SearchFilter currentCategory={activeCategory} />
      </Suspense>

      <ProductCatalogResults
        key={`${activeCategory || "all"}|${activeSubcategory}|${search}|${sort}|${currentPage}`}
        initialProducts={products}
        total={total}
        totalPages={totalPages}
        currentPage={currentPage}
        search={search}
        sort={sort}
        activeCategory={activeCategory}
        activeSubcategory={activeSubcategory}
      />
    </div>
  );
}
