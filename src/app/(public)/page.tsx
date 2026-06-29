import HeroSection from "@/components/HeroSection";
import CategoryShowcase from "@/components/CategoryShowcase";
import ProductGrid from "@/components/ProductGrid";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Product } from "@/lib/types";
import { hydrateProductImages } from "@/lib/productImages";

export default async function HomePage() {
  // Fetch featured products and top selling products
  let featuredProducts: Product[] = [];
  let topSellingProducts: Product[] = [];
  try {
    featuredProducts = await prisma.product
      .findMany({
      where: { featured: true, inStock: true },
      take: 8,
      orderBy: { createdAt: "desc" },
      })
      .then((products) => products.map((product) => hydrateProductImages(product)));
      
    // TODO: Implement actual top selling logic from DB later
    topSellingProducts = await prisma.product
      .findMany({
      where: { inStock: true },
      take: 4,
      orderBy: { updatedAt: "desc" },
      })
      .then((products) => products.map((product) => hydrateProductImages(product)));
  } catch {
    // DB might not be connected yet - show empty state
  }

  return (
    <>
      {/* Hero Banner */}
      <HeroSection />

      {/* Categories */}
      <CategoryShowcase />

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="pb-12 pt-8 mt-8 border-t border-gray-100 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                Featured Products
              </h2>
              <Link
                href="/products"
                className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-900 dark:border-white pb-0.5 hover:text-primary-800 transition-colors"
              >
                View All
              </Link>
            </div>
            <ProductGrid products={featuredProducts} />
          </div>
        </section>
      )}

      {/* Top Selling Products */}
      {topSellingProducts.length > 0 && (
        <section className="pb-12 pt-8 border-t border-gray-100 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                Top Selling Products
              </h2>
              <Link
                href="/products"
                className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-900 dark:border-white pb-0.5 hover:text-primary-800 transition-colors"
              >
                View All
              </Link>
            </div>
            <ProductGrid products={topSellingProducts} />
          </div>
        </section>
      )}
    </>
  );
}