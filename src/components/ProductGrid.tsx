import Link from "next/link";
import ProductCard from "./ProductCard";
import { Product } from "@/lib/types";

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-gray-300/80 bg-white/70 px-6 py-16 text-center dark:border-dark-200 dark:bg-dark-100/70">
        <div className="mb-4 text-6xl">🔍</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
          No products found
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Try adjusting your filters or search terms.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-full border border-primary-500/20 bg-primary-500/10 px-5 py-2.5 font-medium text-primary-600 transition-colors hover:bg-primary-500/15 dark:text-primary-300"
        >
          Reset filters
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
