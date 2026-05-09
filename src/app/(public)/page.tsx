import HeroSection from "@/components/HeroSection";
import CategoryShowcase from "@/components/CategoryShowcase";
import HowItWorks from "@/components/HowItWorks";
import ProductGrid from "@/components/ProductGrid";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Product } from "@/lib/types";
import { hydrateProductImages } from "@/lib/productImages";

export default async function HomePage() {
  const whatsappReady = Boolean((process.env.NEXT_PUBLIC_WHATSAPP || "").trim());

  // Fetch featured products
  let featuredProducts: Product[] = [];
  try {
    featuredProducts = await prisma.product
      .findMany({
      where: { featured: true, inStock: true },
      take: 4,
      orderBy: { createdAt: "desc" },
      })
      .then((products) => products.map((product) => hydrateProductImages(product)));
  } catch {
    // DB might not be connected yet - show empty state
  }

  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Featured Products */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-2 inline-flex rounded-full border border-primary-500/15 bg-primary-500/5 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-500 dark:text-primary-300">
                Best Sellers
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Featured{" "}
                <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
                  Products
                </span>
              </h2>
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                Our most requested prints, selected for finish quality, practicality, and gift appeal.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200/70 bg-white/80 px-4 py-3 text-sm text-gray-600 shadow-sm dark:border-dark-200 dark:bg-dark-100/80 dark:text-gray-300">
              Need help choosing? Open any product and message us for size, color, and price guidance.
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1 self-start text-primary-500 hover:text-primary-400 font-medium transition-colors lg:self-auto"
            >
              View All →
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-primary-500 hover:text-primary-400 font-medium"
            >
              View All Products →
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <CategoryShowcase />

      {/* How It Works */}
      <HowItWorks />

      {/* CTA */}
      <section className="py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary-600 to-primary-800 px-5 py-6 text-center shadow-2xl shadow-primary-900/20 sm:px-8">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Have a Custom Design in Mind?
            </h2>
            <p className="mt-2 text-sm text-primary-100 sm:text-base">
              We can 3D print almost anything! Send us your idea and we&apos;ll make
              it happen.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {whatsappReady ? (
                <a
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-full bg-white px-6 py-2.5 font-semibold text-primary-600 transition-all hover:bg-gray-50 hover:shadow-xl sm:w-auto"
                >
                  Contact Us on WhatsApp
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full cursor-not-allowed rounded-full bg-gray-200 px-6 py-2.5 font-semibold text-gray-500 sm:w-auto"
                >
                  WhatsApp Unavailable
                </button>
              )}
              <Link
                href="/products"
                className="w-full rounded-full border border-white/30 px-6 py-2.5 font-semibold text-white transition-all hover:bg-white/10 sm:w-auto"
              >
                Browse Products
              </Link>
            </div>
            {!whatsappReady && (
              <p className="mt-3 text-xs text-primary-100/90">
                WhatsApp contact is not configured yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}