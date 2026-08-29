"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineSearch,
  HiOutlineShoppingCart,
  HiX,
} from "react-icons/hi";
import {
  LOCAL_ORDERS_UPDATED_EVENT,
  loadStoredOrders,
  type LocalOrder,
} from "@/lib/localOrderHistory";
import { formatPrice } from "@/lib/utils";

interface OrdersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatOrderDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrdersDrawer({ isOpen, onClose }: OrdersDrawerProps) {
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  useEffect(() => {
    function refreshOrders() {
      setOrders(loadStoredOrders());
    }

    refreshOrders();
    window.addEventListener("storage", refreshOrders);
    window.addEventListener(LOCAL_ORDERS_UPDATED_EVENT, refreshOrders);

    return () => {
      window.removeEventListener("storage", refreshOrders);
      window.removeEventListener(LOCAL_ORDERS_UPDATED_EVENT, refreshOrders);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setOrders(loadStoredOrders());
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-dark ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-dark-200">
          <div className="flex items-center gap-2">
            <HiOutlineDocumentText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Orders
            </h2>
            {orders.length > 0 && (
              <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                {orders.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close orders"
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-dark-100 dark:hover:text-white"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-100">
                <HiOutlineDocumentText className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                No recent orders yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Orders you place from this device will appear here.
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="mt-2 rounded-xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.orderNumber}
                  className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-dark-200 dark:bg-dark-100/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                        {order.orderNumber}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <HiOutlineClock className="h-3.5 w-3.5" />
                        {formatOrderDate(order.createdAt)}
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {order.customerName}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <HiOutlinePhone className="h-3.5 w-3.5 text-primary-500" />
                      <span>{order.customerPhone}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <HiOutlineLocationMarker className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary-500" />
                      <span>
                        {order.district}
                        {order.postalCode ? ` - ${order.postalCode}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {order.items.slice(0, 2).map((item, index) => (
                      <div key={`${order.orderNumber}-${item.productId}-${index}`} className="flex items-center gap-3">
                        <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-200">
                          {item.productImage ? (
                            <Image
                              src={item.productImage}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="44px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                              <HiOutlineShoppingCart className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Qty {item.quantity}
                            {item.selectedSize ? ` • ${item.selectedSize}` : ""}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {formatPrice(item.totalPrice)}
                        </span>
                      </div>
                    ))}

                    {order.items.length > 2 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{order.items.length - 2} more item{order.items.length - 2 === 1 ? "" : "s"}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-dark-200">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        {formatPrice(order.total)}
                      </p>
                    </div>
                    <Link
                      href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25"
                    >
                      <HiOutlineSearch className="h-4 w-4" />
                      Track
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}