import { getCachedProductById } from "@/lib/productCatalog";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductImageGallery from "@/components/ProductImageGallery";
import AddToCartSection from "@/components/AddToCartSection";
import Link from "next/link";
import MetaViewContent from "@/components/MetaViewContent";
import type { Product } from "@/lib/types";
import { calculateDiscountedPrice, categoryLabels } from "@/lib/utils";

// Revalidate page content every 60 seconds (ISR / cached RSC responses)
export const revalidate = 60;

interface ProductPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getCachedProductById(params.id);
  if (!product) return { title: "Product Not Found" };

  const description = product.description.slice(0, 160);
  const image = product.images[0];

  // Open Graph tags drive the link preview in Messenger, WhatsApp, Facebook
  // and Instagram shares.
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      type: "website",
      siteName: "3Dify BD",
      title: product.name,
      description,
      url: `/products/${product.id}`,
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: product.name,
      description,
      ...(image ? { images: [image] } : {}),
    },
    other: {
      "product:price:amount": String(getProductDisplayPrice(product)),
      "product:price:currency": "BDT",
      "product:availability": product.inStock ? "in stock" : "out of stock",
    },
  };
}

// Price of the option selected by default on the page (first size, discounted)
function getProductDisplayPrice(product: Product) {
  const basePrice = product.sizeOptions?.[0]?.price ?? product.price;
  return calculateDiscountedPrice(basePrice, product.discountPercent ?? 0);
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getCachedProductById(params.id);

  if (!product) notFound();

  const categoryLabel = categoryLabels[product.category] ?? product.category;

  return (
    <>
      <MetaViewContent
        productId={product.id}
        name={product.name}
        category={categoryLabel}
        value={getProductDisplayPrice(product)}
      />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <nav className="flex items-center gap-1.5 overflow-hidden text-xs text-gray-500 dark:text-gray-400 sm:gap-2 sm:text-sm">
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
        <div className="grid grid-cols-1 gap-5 sm:gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: Image Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductImageGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col gap-5 sm:gap-6">
            {/* Category badge */}
            <div>
              <span className="inline-block rounded-full bg-primary-50 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3">
                {categoryLabel}
              </span>
              <h1 className="text-[1.4rem] font-bold leading-tight text-gray-900 dark:text-white sm:text-3xl">
                {product.name}
              </h1>
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

            {/* Divider */}
            <hr className="border-gray-200 dark:border-dark-200" />

            {/* Add to Cart Section (client component) */}
            <AddToCartSection product={product} />

            {/* Divider */}
            <hr className="border-gray-200 dark:border-dark-200" />

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

        <div className="mt-8 sm:mt-10">
          <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">
            Description
          </h2>
          <div className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {product.description}
          </div>
        </div>
      </section>
    </>
  );
}
