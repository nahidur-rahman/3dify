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
    <div className="mx-auto max-w-2xl px-3 py-8 text-center sm:px-6 sm:py-16 lg:px-8">
      {/* Success icon */}
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 sm:mb-6 sm:h-20 sm:w-20">
        <HiCheckCircle className="h-9 w-9 text-emerald-500 sm:h-12 sm:w-12" />
      </div>

      <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:mb-3 sm:text-3xl">
        Order Done!
      </h1>

      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
        Thank you for your order. We&apos;ll get it ready for you.
      </p>

      {/* Order number card */}
      <div className="mb-5 mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-dark-200 dark:bg-dark-100 sm:mb-8 sm:mt-6 sm:inline-block sm:w-auto sm:rounded-2xl sm:px-8 sm:py-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Order Number
        </p>
        <p className="break-all text-xl font-bold tracking-wider text-primary-600 dark:text-primary-400 sm:text-2xl">
          {orderNumber}
        </p>
      </div>

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 text-left dark:border-dark-200 dark:bg-dark-100 sm:mb-8 sm:rounded-2xl sm:p-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-3">
          What happens next?
        </h2>
        <ol className="space-y-2.5 text-[13px] text-gray-600 dark:text-gray-400 sm:space-y-3 sm:text-sm">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              1
            </span>
            We&apos;ll review and confirm your order.
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              2
            </span>
            Your items will be ready and prepared for delivery.
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
      <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-row sm:justify-center sm:gap-3">
        {orderNumber !== "N/A" && (
          <Link
            href={`/track-order?order=${orderNumber}`}
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/25 sm:col-auto sm:px-6 sm:py-3.5 sm:text-base"
          >
            <HiOutlineSearch className="h-5 w-5" />
            Track Order
          </Link>
        )}
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25 sm:px-6 sm:py-3.5 sm:text-base"
        >
          <HiOutlineHome className="h-5 w-5" />
          Home
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-dark-200 dark:text-gray-300 dark:hover:bg-dark-100 sm:px-6 sm:py-3.5 sm:text-base"
        >
          <HiOutlineShoppingCart className="h-5 w-5" />
          Products
        </Link>
      </div>
    </div>
  );
}
