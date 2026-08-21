import { getCachedProductById } from "@/lib/productCatalog";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductImageGallery from "@/components/ProductImageGallery";
import AddToCartSection from "@/components/AddToCartSection";
import Link from "next/link";
import { formatPrice, calculateDiscountedPrice, categoryLabels } from "@/lib/utils";

// Revalidate page content every 60 seconds (ISR / cached RSC responses)
export const revalidate = 60;

interface ProductPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getCachedProductById(params.id);
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getCachedProductById(params.id);

  if (!product) notFound();

  const sizeOptionPrices = product.sizeOptions?.map((o) => o.price) ?? [];
  const basePrice =
    sizeOptionPrices.length > 0 ? Math.min(...sizeOptionPrices) : product.price;
  const discountPercent = product.discountPercent ?? 0;
  const displayPrice = calculateDiscountedPrice(basePrice, discountPercent);
  const categoryLabel = categoryLabels[product.category] ?? product.category;

  return (
    <>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary-600 transition-colors">
            Products
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>
      </div>

      {/* Product Detail */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Image Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductImageGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col gap-6">
            {/* Category badge */}
            <div>
              <span className="inline-block rounded-full bg-primary-50 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3">
                {categoryLabel}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {sizeOptionPrices.length > 0 ? "From " : ""}
                {formatPrice(displayPrice)}
              </span>
              {discountPercent > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through dark:text-gray-500">
                    {formatPrice(basePrice)}
                  </span>
                  <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-2">
              {product.inStock ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    In Stock
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Out of Stock
                  </span>
                </>
              )}
            </div>

            {/* Color */}
            {product.color && (
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Color:{" "}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {product.color}
                </span>
              </div>
            )}

            {/* Divider */}
            <hr className="border-gray-200 dark:border-dark-200" />

            {/* Add to Cart Section (client component) */}
            <AddToCartSection product={product} />

            {/* Divider */}
            <hr className="border-gray-200 dark:border-dark-200" />

            {/* Description */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                Description
              </h2>
              <div className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">
                {product.description}
              </div>
            </div>

            {/* Details */}
            <div className="rounded-xl border border-gray-200 dark:border-dark-200 overflow-hidden">
              <h3 className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-dark-100 border-b border-gray-200 dark:border-dark-200">
                Product Details
              </h3>
              <dl className="divide-y divide-gray-200 dark:divide-dark-200">
                {product.size && (
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <dt className="text-gray-500 dark:text-gray-400">Size</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">
                      {product.size}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between px-4 py-3 text-sm">
                  <dt className="text-gray-500 dark:text-gray-400">Weight</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {product.weight}g
                  </dd>
                </div>
                <div className="flex justify-between px-4 py-3 text-sm">
                  <dt className="text-gray-500 dark:text-gray-400">
                    Infill
                  </dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {product.infillPercentage}%
                  </dd>
                </div>
                {product.customizable && (
                  <div className="flex justify-between px-4 py-3 text-sm">
                    <dt className="text-gray-500 dark:text-gray-400">
                      Customizable
                    </dt>
                    <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                      Yes
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
