import Link from "next/link";
import Image from "next/image";
import {
  calculateDiscountedPrice,
  formatPrice,
  categoryLabels,
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

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="bg-white dark:bg-dark-100 rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-200 hover:border-primary-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-dark-200">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-dark-300">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <span className="bg-primary-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
              {categoryLabels[product.category] || product.category}
            </span>
            {product.customizable && (
              <span className="bg-purple-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                Customizable
              </span>
            )}
            {discountPercent > 0 && (
              <span className="bg-rose-500/90 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                {discountPercent}% Off
              </span>
            )}
          </div>

          {/* Stock status */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-end justify-between mt-3 gap-3">
            <div>
              {discountPercent > 0 && (
                <div className="text-xs text-gray-400 dark:text-gray-500 line-through">
                  {formatPrice(startingPrice)}
                </div>
              )}
              <div className="text-lg font-bold text-primary-500">
                {sizeOptionPrices.length > 0 ? "From " : ""}
                {formatPrice(displayPrice)}
              </div>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 text-right">
              {product.color}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
