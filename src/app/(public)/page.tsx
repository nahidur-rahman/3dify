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
    featuredProducts = (await prisma.product.findMany({
      where: { featured: true, inStock: true },
      take: 4,
      orderBy: { createdAt: "desc" },
    })).map((product) => hydrateProductImages(product)) as Product[];
  } catch {
    // DB might not be connected yet - show empty state
  }

  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Featured Products */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Featured{" "}
                <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
                  Products
                </span>
              </h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Our most popular 3D printed items
              </p>
            </div>
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1 text-primary-500 hover:text-primary-400 font-medium transition-colors"
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
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Have a Custom Design in Mind?
          </h2>
          <p className="mt-4 text-lg text-primary-100">
            We can 3D print almost anything! Send us your idea and we&apos;ll make
            it happen.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {whatsappReady ? (
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-white text-primary-600 px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all hover:shadow-xl"
              >
                Contact Us on WhatsApp
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full sm:w-auto bg-gray-200 text-gray-500 px-8 py-3.5 rounded-full font-semibold text-lg cursor-not-allowed"
              >
                WhatsApp Unavailable
              </button>
            )}
            <Link
              href="/products"
              className="w-full sm:w-auto border-2 border-white/30 text-white px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-white/10 transition-all"
            >
              Browse Products
            </Link>
          </div>
          {!whatsappReady && (
            <p className="mt-3 text-sm text-primary-100/90">
              WhatsApp contact is not configured yet.
            </p>
          )}
        </div>
      </section>
    </>
  );
}