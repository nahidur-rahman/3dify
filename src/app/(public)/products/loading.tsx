import StorefrontProductGridSkeleton from "@/components/loading/StorefrontProductGridSkeleton";
import ProductCatalogFilterSkeleton from "@/components/loading/ProductCatalogFilterSkeleton";
import { PRODUCT_CATALOG_PAGE_SIZE } from "@/lib/productCatalogConfig";

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
      <ProductCatalogFilterSkeleton />
      <StorefrontProductGridSkeleton count={PRODUCT_CATALOG_PAGE_SIZE} />
    </div>
  );
}
