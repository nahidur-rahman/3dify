"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { Product } from "@/lib/types";
import { calculateDiscountedPrice, formatPrice } from "@/lib/utils";
import { HiMinus, HiPlus, HiShoppingCart } from "react-icons/hi";

interface AddToCartSectionProps {
  product: Product;
}

export default function AddToCartSection({ product }: AddToCartSectionProps) {
  const router = useRouter();
  const { addToCart, openDrawer } = useCart();

  const discountPercent = product.discountPercent ?? 0;
  const hasSizeOptions =
    product.sizeOptions && product.sizeOptions.length > 0;
  const hasColorOptions =
    product.colorMode === "OPTIONS" &&
    product.colorOptions &&
    product.colorOptions.length > 0;

  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    hasSizeOptions ? product.sizeOptions![0].label : undefined
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    hasColorOptions ? product.colorOptions![0] : product.color || undefined
  );
  const [quantity, setQuantity] = useState(1);

  // Get the price for the selected size option, or the base price
  function getUnitPrice(): number {
    if (hasSizeOptions && selectedSize) {
      const option = product.sizeOptions!.find(
        (o) => o.label === selectedSize
      );
      return calculateDiscountedPrice(
        option ? option.price : product.price,
        discountPercent
      );
    }
    return calculateDiscountedPrice(product.price, discountPercent);
  }

  function handleAddToCart() {
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images[0] || "",
      price: getUnitPrice(),
      quantity,
      selectedSize,
      color: selectedColor,
    });
    setQuantity(1);
    openDrawer();
  }

  function handleBuyNow() {
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images[0] || "",
      price: getUnitPrice(),
      quantity,
      selectedSize,
      color: selectedColor,
    });
    setQuantity(1);
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Size options */}
      {hasSizeOptions && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Size
          </h3>
          <div className="flex flex-wrap gap-2">
            {product.sizeOptions!.map((option) => {
              const optionPrice = calculateDiscountedPrice(
                option.price,
                discountPercent
              );
              const isSelected = selectedSize === option.label;

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setSelectedSize(option.label)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500 dark:bg-primary-900/20 dark:text-primary-300"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-dark-200 dark:bg-dark-100 dark:text-gray-300 dark:hover:border-dark-300"
                  }`}
                >
                  <span>{option.label}</span>
                  <span className="ml-1.5 text-xs opacity-70">
                    {formatPrice(optionPrice)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasColorOptions && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Color
          </h3>
          <div className="flex flex-wrap gap-2">
            {product.colorOptions!.map((colorOption) => {
              const isSelected = selectedColor === colorOption;

              return (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setSelectedColor(colorOption)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? "border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500 dark:bg-primary-900/20 dark:text-primary-300"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-dark-200 dark:bg-dark-100 dark:text-gray-300 dark:hover:border-dark-300"
                  }`}
                >
                  {colorOption}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity selector */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Quantity
        </h3>
        <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-dark-200">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-dark-100"
          >
            <HiMinus className="h-4 w-4" />
          </button>
          <span className="flex h-10 w-12 items-center justify-center border-x border-gray-200 text-sm font-semibold text-gray-900 dark:border-dark-200 dark:text-white">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-10 w-10 items-center justify-center text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-100"
          >
            <HiPlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          <HiShoppingCart className="h-5 w-5" />
          Add to Cart
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!product.inStock}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-primary-500 px-6 py-3.5 font-semibold text-primary-600 transition-all duration-200 hover:bg-primary-50 hover:shadow-lg hover:-translate-y-0.5 dark:text-primary-400 dark:hover:bg-primary-900/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          Buy it Now
        </button>
      </div>
    </div>
  );
}
