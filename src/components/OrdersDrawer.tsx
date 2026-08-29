"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlinePhone,
  HiOutlineSearch,
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
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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
                  className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-dark-200 dark:bg-dark-100/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-bold text-primary-600 dark:text-primary-400">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatPrice(order.total)}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <HiOutlinePhone className="h-3 w-3 flex-shrink-0 text-primary-500" />
                        <span className="truncate">{order.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HiOutlineClock className="h-3 w-3 flex-shrink-0 text-primary-500" />
                        <span className="truncate">{formatOrderDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <Link
                      href={`/track-order?order=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(order.customerPhone)}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/20"
                    >
                      <HiOutlineSearch className="h-3 w-3" />
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