import Link from "next/link";
import ProductCard from "./ProductCard";
import { Product } from "@/lib/types";

interface ProductGridProps {
  products: Product[];
  resetHref?: string;
  variant?: "default" | "storefrontHighlights" | "storefrontCatalog";
}

const storefrontGridClassName =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

function getStorefrontHighlightItemClassName(index: number) {
  if (index < 6) {
    return "";
  }

  if (index < 8) {
    return "hidden lg:block";
  }

  if (index < 10) {
    return "hidden xl:block";
  }

  if (index < 12) {
    return "hidden 2xl:block";
  }

  return "hidden";
}

export default function ProductGrid({
  products,
  resetHref = "/products",
  variant = "default",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-gray-300/80 bg-white/70 px-5 py-12 text-center dark:border-dark-200 dark:bg-dark-100/70">
        <div className="mb-3 text-5xl">🔍</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
          No products found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try adjusting your filters or search terms.
        </p>
        <Link
          href={resetHref}
          className="mt-6 inline-flex rounded-full border border-primary-500/20 bg-primary-500/10 px-5 py-2.5 font-medium text-primary-600 transition-colors hover:bg-primary-500/15 dark:text-primary-300"
        >
          Reset filters
        </Link>
      </div>
    );
  }

  const gridClassName =
    variant === "storefrontHighlights" || variant === "storefrontCatalog"
      ? storefrontGridClassName
      : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className={gridClassName}>
      {products.map((product, index) => (
        <div
          key={product.id}
          className={
            variant === "storefrontHighlights"
              ? getStorefrontHighlightItemClassName(index)
              : undefined
          }
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
