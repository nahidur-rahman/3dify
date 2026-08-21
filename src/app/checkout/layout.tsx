import Link from "next/link";
import BrandLogo from "@/components/layout/BrandLogo";
import { HiArrowLeft } from "react-icons/hi";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50 dark:bg-dark">
      {/* Minimal header */}
      <header className="border-b border-gray-200 bg-white dark:border-dark-200 dark:bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <Link
            href="/cart"
            className="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            <HiArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
          <Link href="/" className="inline-flex">
            <BrandLogo className="scale-90" />
          </Link>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
