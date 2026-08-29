"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  HiSearch,
  HiOutlinePhone,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineXCircle,
  HiArrowLeft,
} from "react-icons/hi";

interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  selectedSize: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface TrackedOrder {
  id: string;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  customerName: string;
  address: string;
  shippingMethod: string;
  shippingCost: number;
  subtotal: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

const TRACKING_STEPS = [
  { key: "PENDING", label: "Order Received", desc: "We received your order", icon: HiOutlineClock },
  { key: "CONFIRMED", label: "Order Confirmed", desc: "Order verified & accepted", icon: HiOutlineCheckCircle },
  { key: "PROCESSING", label: "3D Printing & Prep", desc: "Items being 3D printed", icon: HiOutlineDocumentText },
  { key: "SHIPPED", label: "Out for Delivery", desc: "Dispatched to courier", icon: HiOutlineTruck },
  { key: "DELIVERED", label: "Delivered", desc: "Package delivered to you", icon: HiOutlineCheckCircle },
];

function getStepIndex(status: TrackedOrder["status"]): number {
  switch (status) {
    case "PENDING":
      return 0;
    case "CONFIRMED":
      return 1;
    case "PROCESSING":
      return 2;
    case "SHIPPED":
      return 3;
    case "DELIVERED":
      return 4;
    case "CANCELLED":
      return -1;
  }
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") || "");
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleTrack = useCallback(
    async (ordNo = orderNumber, phNo = phone) => {
      if (!ordNo.trim() || !phNo.trim()) {
        setError("Please enter both Order Number and Phone Number.");
        return;
      }

      setLoading(true);
      setError("");
      setOrder(null);

      try {
        const res = await fetch(
          `/api/orders/track?order=${encodeURIComponent(ordNo.trim())}&phone=${encodeURIComponent(
            phNo.trim()
          )}`
        );
        const data = await res.json();

        if (res.ok && data.success) {
          setOrder(data.order);
        } else {
          setError(data.error || "Order not found. Please verify your details.");
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [orderNumber, phone]
  );

  useEffect(() => {
    const initialOrder = searchParams.get("order");
    const initialPhone = searchParams.get("phone");

    if (initialOrder && initialPhone) {
      void handleTrack(initialOrder, initialPhone);
    }
  }, [handleTrack, searchParams]);

  const currentStepIndex = order ? getStepIndex(order.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Track Your Order
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter your Order Number (e.g. 3D-XXXXX) and the Phone Number used during checkout to view real-time status.
        </p>
      </div>

      {/* Search Card */}
      <div className="bg-white dark:bg-dark-100 rounded-3xl border border-gray-200 dark:border-dark-200 p-6 sm:p-8 shadow-sm mb-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          className="grid grid-cols-1 sm:grid-cols-5 gap-4"
        >
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Order Number
            </label>
            <div className="relative">
              <HiOutlineDocumentText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="3D-XXXXX"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-200 rounded-xl text-sm font-semibold uppercase text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:normal-case placeholder:font-normal"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="relative">
              <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-200 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
              />
            </div>
          </div>

          <div className="sm:col-span-1 flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <HiSearch className="w-5 h-5" />
                  Track
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-xs font-semibold text-red-600 dark:text-red-400 text-center">
            {error}
          </div>
        )}
      </div>

      {/* Order Result View */}
      {order && (
        <div className="space-y-8 animate-fade-in">
          {/* Order Header Summary */}
          <div className="bg-white dark:bg-dark-100 rounded-3xl border border-gray-200 dark:border-dark-200 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Order {order.orderNumber}
                </h2>
                {order.status === "CANCELLED" && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                    CANCELLED
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  dateStyle: "full",
                })}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-gray-500 dark:text-gray-400">Total Amount</span>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {formatPrice(order.total)}
              </p>
            </div>
          </div>

          {/* Timeline Status */}
          {order.status === "CANCELLED" ? (
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-3xl p-8 text-center space-y-3">
              <HiOutlineXCircle className="w-16 h-16 text-red-500 mx-auto" />
              <h3 className="text-xl font-bold text-red-900 dark:text-red-300">
                This order has been cancelled
              </h3>
              <p className="text-xs text-red-700 dark:text-red-400 max-w-md mx-auto">
                If you have questions regarding this order, please reach out to us directly via WhatsApp or Messenger.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-100 rounded-3xl border border-gray-200 dark:border-dark-200 p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-6">
                Order Status Timeline
              </h3>

              {/* Progress Bar */}
              <div className="relative flex flex-col md:flex-row justify-between gap-8 md:gap-4">
                {TRACKING_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={step.key} className="flex md:flex-col items-center gap-4 md:text-center flex-1 relative">
                      {/* Connecting Line (desktop) */}
                      {idx < TRACKING_STEPS.length - 1 && (
                        <div
                          className={`hidden md:block absolute top-5 left-1/2 w-full h-1 z-0 transition-colors ${
                            idx < currentStepIndex
                              ? "bg-emerald-500"
                              : "bg-gray-200 dark:bg-dark-200"
                          }`}
                        />
                      )}

                      {/* Icon Step Circle */}
                      <div
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCurrent
                            ? "bg-primary-500 text-white ring-4 ring-primary-500/20 scale-110 shadow-lg"
                            : isCompleted
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 dark:bg-dark-200 text-gray-400"
                        }`}
                      >
                        <step.icon className="w-5 h-5" />
                      </div>

                      {/* Text */}
                      <div className="md:mt-2">
                        <p
                          className={`text-sm font-bold ${
                            isCurrent
                              ? "text-primary-600 dark:text-primary-400"
                              : isCompleted
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Itemized Order Details */}
          <div className="bg-white dark:bg-dark-100 rounded-3xl border border-gray-200 dark:border-dark-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Order Items
            </h3>

            <div className="divide-y divide-gray-200 dark:divide-dark-200">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-200 flex-shrink-0">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                          3D
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.productName}
                      </h4>
                      <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                        {item.color && <span>• Color: {item.color}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatPrice(item.unitPrice)} × {item.quantity}
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                      {formatPrice(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery & Totals Breakdown */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Delivery & Payment
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">Customer:</span> {order.customerName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  <span className="font-semibold text-gray-900 dark:text-white">Address:</span> {order.address}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  <span className="font-semibold text-gray-900 dark:text-white">Shipping Method:</span> {order.shippingMethod.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  <span className="font-semibold text-gray-900 dark:text-white">Payment Method:</span> {order.paymentMethod} (Pay upon delivery)
                </p>
              </div>

              <div className="space-y-2 text-sm bg-gray-50 dark:bg-dark-200 p-4 rounded-2xl">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping Cost</span>
                  <span>{formatPrice(order.shippingCost)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-dark-300 flex justify-between font-bold text-gray-900 dark:text-white">
                  <span>Grand Total</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back to Products CTA */}
      <div className="mt-10 text-center">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
        >
          <HiArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-24">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
