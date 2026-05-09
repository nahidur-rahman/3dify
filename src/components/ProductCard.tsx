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
      <div className="overflow-hidden rounded-[1.5rem] border border-gray-200/80 bg-white/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-500/40 hover:shadow-xl hover:shadow-primary-500/10 dark:border-dark-200 dark:bg-dark-100/90">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-dark-200">
          <div className="absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-black/20 to-transparent" />
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
              <svg className="h-14 w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className="rounded-full bg-primary-500/90 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
              {categoryLabels[product.category] || product.category}
            </span>
            {product.customizable && (
              <span className="rounded-full bg-purple-500/90 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                Customizable
              </span>
            )}
            {discountPercent > 0 && (
              <span className="rounded-full bg-rose-500/90 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                {discountPercent}% Off
              </span>
            )}
          </div>

          {/* Stock status */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-base font-bold text-white">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="mb-1.5 flex items-center justify-between gap-1 text-[9px] uppercase tracking-[0.16em] text-gray-400 dark:text-gray-500">
            <span>{product.inStock ? "Ready to order" : "Currently unavailable"}</span>
            <span>{product.color}</span>
          </div>
          <h3 className="line-clamp-1 text-[0.95rem] font-semibold text-gray-900 transition-colors group-hover:text-primary-500 dark:text-white">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-gray-500 dark:text-gray-400">
            {product.description}
          </p>
          <div className="mt-2.5 flex items-end justify-between gap-2">
            <div>
              {discountPercent > 0 && (
                <div className="text-[9px] text-gray-400 line-through dark:text-gray-500">
                  {formatPrice(startingPrice)}
                </div>
              )}
              <div className="text-sm font-bold text-primary-500">
                {sizeOptionPrices.length > 0 ? "From " : ""}
                {formatPrice(displayPrice)}
              </div>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500 dark:bg-dark dark:text-gray-400">
              Details
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
