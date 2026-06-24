import HeroSection from "@/components/HeroSection";
import CategoryShowcase from "@/components/CategoryShowcase";
import ProductGrid from "@/components/ProductGrid";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Product } from "@/lib/types";
import { hydrateProductImages } from "@/lib/productImages";

export default async function HomePage() {
  // Fetch featured products
  let featuredProducts: Product[] = [];
  try {
    featuredProducts = await prisma.product
      .findMany({
      where: { featured: true, inStock: true },
      take: 8,
      orderBy: { createdAt: "desc" },
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
        <section className="pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                Featured Products
              </h2>
              <Link
                href="/products"
                className="text-sm font-medium text-primary-500 hover:text-primary-400 transition-colors"
              >
                View All →
              </Link>
            </div>
            <ProductGrid products={featuredProducts} />
          </div>
        </section>
      )}
    </>
  );
}