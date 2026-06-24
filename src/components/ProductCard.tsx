import Link from "next/link";
import Image from "next/image";
import {
  calculateDiscountedPrice,
  formatPrice,
} from "@/lib/utils";
import { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const sizeOptionPrices = product.sizeOptions?.map((option) => option.price) ?? [];
  const startingPrice =
    sizeOptionPrices.length > 0 ? Math.min(...sizeOptionPrices) : product.price;
  const discountPercent = product.discountPercent ?? 0;
  const displayPrice = calculateDiscountedPrice(startingPrice, discountPercent);
  const imageSrc = product.images[0];

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-dark-200 dark:bg-dark-100">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-dark/60">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-dark-300">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Discount badge */}
          {discountPercent > 0 && (
            <span className="absolute top-2 left-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              -{discountPercent}%
            </span>
          )}

          {/* Out of stock overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-sm font-bold text-white">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="line-clamp-1 text-sm font-medium text-gray-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 transition-colors">
            {product.name}
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {sizeOptionPrices.length > 0 ? "From " : ""}
              {formatPrice(displayPrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-xs text-gray-400 line-through dark:text-gray-500">
                {formatPrice(startingPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
