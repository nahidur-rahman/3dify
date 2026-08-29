"use client";

import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { HiMinus, HiPlus, HiOutlineTrash, HiOutlineShoppingCart, HiArrowLeft } from "react-icons/hi";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-100">
            <HiOutlineShoppingCart className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Your cart is empty
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Looks like you haven&apos;t added any products to your cart yet. Browse our collection to find something you like!
          </p>
          <Link
            href="/products"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-8 py-3.5 font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5"
          >
            <HiArrowLeft className="h-5 w-5" />
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Shopping Cart
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {cartCount} {cartCount === 1 ? "item" : "items"} in your cart
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm font-medium text-red-500 transition-colors hover:text-red-600"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const itemKey = `${item.productId}__${item.selectedSize || "default"}__${item.color || "default"}`;
            return (
              <div
                key={itemKey}
                className="flex gap-4 sm:gap-6 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm dark:border-dark-200 dark:bg-dark-100"
              >
                {/* Image */}
                <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-dark-200">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <HiOutlineShoppingCart className="h-8 w-8" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <Link
                      href={`/products/${item.productId}`}
                      className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate block"
                    >
                      {item.name}
                    </Link>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.selectedSize && (
                        <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-dark-200 dark:text-gray-400">
                          Size: {item.selectedSize}
                        </span>
                      )}
                      {item.color && (
                        <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-dark-200 dark:text-gray-400">
                          {item.color}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {formatPrice(item.price)} each
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity controls */}
                    <div className="flex items-center rounded-lg border border-gray-200 dark:border-dark-200">
                      <button
                        onClick={() =>
                          item.quantity <= 1
                            ? removeFromCart(item.productId, item.selectedSize, item.color)
                            : updateQuantity(item.productId, item.quantity - 1, item.selectedSize, item.color)
                        }
                        className="flex h-9 w-9 items-center justify-center text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                      >
                        <HiMinus className="h-4 w-4" />
                      </button>
                      <span className="flex h-9 w-12 items-center justify-center border-x border-gray-200 text-sm font-bold text-gray-900 dark:border-dark-200 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.selectedSize, item.color)}
                        className="flex h-9 w-9 items-center justify-center text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                      >
                        <HiPlus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price + remove */}
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.productId, item.selectedSize, item.color)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        aria-label={`Remove ${item.name}`}
                      >
                        <HiOutlineTrash className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-200 dark:bg-dark-100">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Subtotal ({cartCount} {cartCount === 1 ? "item" : "items"})
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatPrice(cartTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                <span className="font-medium text-gray-500 dark:text-gray-400">
                  Calculated at checkout
                </span>
              </div>
            </div>

            <hr className="my-4 border-gray-200 dark:border-dark-200" />

            <div className="flex justify-between mb-6">
              <span className="text-base font-bold text-gray-900 dark:text-white">
                Total
              </span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {formatPrice(cartTotal)}
              </span>
            </div>

            <Link
              href="/checkout"
              className="flex w-full items-center justify-center rounded-xl bg-primary-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25"
            >
              Proceed to Checkout
            </Link>

            <Link
              href="/products"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-dark-200 dark:text-gray-300 dark:hover:bg-dark-200"
            >
              <HiArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
