import type { Metadata } from "next";
import Link from "next/link";
import { HiCheckCircle, HiOutlineHome, HiOutlineSearch, HiOutlineShoppingCart } from "react-icons/hi";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order has been placed successfully!",
};

interface ConfirmationPageProps {
  searchParams: { order?: string };
}

export default function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const orderNumber = searchParams.order || "N/A";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      {/* Success icon */}
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <HiCheckCircle className="h-12 w-12 text-emerald-500" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
        Order Confirmed!
      </h1>

      <p className="text-gray-500 dark:text-gray-400 mb-2">
        Thank you for your order. We&apos;ll get it ready for you.
      </p>

      {/* Order number card */}
      <div className="mt-6 mb-8 inline-block rounded-2xl border border-gray-200 bg-white px-8 py-6 shadow-sm dark:border-dark-200 dark:bg-dark-100">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Order Number
        </p>
        <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 tracking-wider">
          {orderNumber}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-8 text-left dark:border-dark-200 dark:bg-dark-100">
        <h2 className="font-bold text-gray-900 dark:text-white mb-3">
          What happens next?
        </h2>
        <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              1
            </span>
            We&apos;ll review and confirm your order via phone or WhatsApp.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              2
            </span>
            Your items will be 3D printed and prepared for delivery.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              3
            </span>
            Pay upon delivery (Cash on Delivery).
          </li>
        </ol>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {orderNumber !== "N/A" && (
          <Link
            href={`/track-order?order=${orderNumber}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/25 hover:-translate-y-0.5"
          >
            <HiOutlineSearch className="h-5 w-5" />
            Track Order
          </Link>
        )}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25 hover:-translate-y-0.5"
        >
          <HiOutlineHome className="h-5 w-5" />
          Home
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-3.5 font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-dark-200 dark:text-gray-300 dark:hover:bg-dark-100"
        >
          <HiOutlineShoppingCart className="h-5 w-5" />
          Products
        </Link>
      </div>
    </div>
  );
}
