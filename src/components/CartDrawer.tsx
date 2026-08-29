"use client";

import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { HiMinus, HiPlus, HiOutlineTrash, HiX, HiOutlineShoppingCart } from "react-icons/hi";

export default function CartDrawer() {
  const {
    items,
    removeFromCart,
    updateQuantity,
    cartCount,
    cartTotal,
    isDrawerOpen,
    closeDrawer,
  } = useCart();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isDrawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-dark ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-dark-200">
          <div className="flex items-center gap-2">
            <HiOutlineShoppingCart className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Your Cart
            </h2>
            {cartCount > 0 && (
              <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {cartCount}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            aria-label="Close cart"
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-dark-100 dark:hover:text-white"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-100">
                <HiOutlineShoppingCart className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Your cart is empty
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add some products to get started!
              </p>
              <Link
                href="/products"
                onClick={closeDrawer}
                className="mt-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const itemKey = `${item.productId}__${item.selectedSize || "default"}__${item.color || "default"}`;
                return (
                  <div
                    key={itemKey}
                    className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-dark-200 dark:bg-dark-100/50"
                  >
                    {/* Image */}
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-200">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <HiOutlineShoppingCart className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {item.name}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.selectedSize && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Size: {item.selectedSize}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              • {item.color}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity controls */}
                        <div className="flex items-center rounded-lg border border-gray-200 dark:border-dark-200">
                          <button
                            onClick={() =>
                              item.quantity <= 1
                                ? removeFromCart(item.productId, item.selectedSize, item.color)
                                : updateQuantity(item.productId, item.quantity - 1, item.selectedSize, item.color)
                            }
                            className="flex h-7 w-7 items-center justify-center text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                          >
                            <HiMinus className="h-3 w-3" />
                          </button>
                          <span className="flex h-7 w-8 items-center justify-center border-x border-gray-200 text-xs font-semibold text-gray-900 dark:border-dark-200 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1, item.selectedSize, item.color)
                            }
                            className="flex h-7 w-7 items-center justify-center text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                          >
                            <HiPlus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Price + remove */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.productId, item.selectedSize, item.color)}
                            className="text-gray-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
                            aria-label={`Remove ${item.name}`}
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-5 dark:border-dark-200">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Subtotal
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(cartTotal)}
              </span>
            </div>
            <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
              Shipping calculated at checkout.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="flex items-center justify-center rounded-xl bg-primary-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25"
              >
                Checkout — {formatPrice(cartTotal)}
              </Link>
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="flex items-center justify-center rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-dark-200 dark:text-gray-300 dark:hover:bg-dark-100"
              >
                View Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
