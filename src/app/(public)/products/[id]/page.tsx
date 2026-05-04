import { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  calculateDiscountedPrice,
  formatPrice,
  categoryLabels,
} from "@/lib/utils";
import ContactButtons from "@/components/ContactButtons";
import ProductGrid from "@/components/ProductGrid";
import { Product } from "@/lib/types";
import { hydrateProductImages } from "@/lib/productImages";
import { HiCube, HiColorSwatch, HiScale, HiTemplate } from "react-icons/hi";

interface ProductDetailPageProps {
  params: { id: string };
}

async function getProduct(id: string) {
  try {
    const product = await prisma.product.findUnique({ where: { id } });
    return product ? hydrateProductImages(product) : null;
  } catch {
    return null;
  }
}

async function getRelatedProducts(
  productId: string,
  category: Product["category"]
) {
  try {
    const products = await prisma.product.findMany({
      where: {
        category,
        id: { not: productId },
        inStock: true,
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    });
    return products.map((product) => hydrateProductImages(product)) as Product[];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const product = await getProduct(params.id);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  const relatedProducts = await getRelatedProducts(product.id, product.category);
  const sizeOptionPrices = product.sizeOptions?.map((option) => option.price) ?? [];
  const startingPrice =
    sizeOptionPrices.length > 0 ? Math.min(...sizeOptionPrices) : product.price;
  const discountPercent = product.discountPercent ?? 0;
  const discountedPrice = calculateDiscountedPrice(startingPrice, discountPercent);

  const specs = [
    { icon: HiColorSwatch, label: "Color", value: product.color },
    { icon: HiCube, label: "Size", value: product.size },
    { icon: HiScale, label: "Weight", value: `${product.weight}g` },
    {
      icon: HiTemplate,
      label: "Infill",
      value: `${product.infillPercentage}%`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-dark-100">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-24 h-24"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {/* Category & badges */}
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-primary-500/10 text-primary-500 text-sm font-medium px-3 py-1 rounded-full">
              {categoryLabels[product.category] || product.category}
            </span>
            {product.customizable && (
              <span className="bg-purple-500/10 text-purple-500 text-sm font-medium px-3 py-1 rounded-full">
                Customizable
              </span>
            )}
            {discountPercent > 0 && (
              <span className="bg-rose-500/10 text-rose-500 text-sm font-medium px-3 py-1 rounded-full">
                {discountPercent}% Off
              </span>
            )}
            {!product.inStock && (
              <span className="bg-red-500/10 text-red-500 text-sm font-medium px-3 py-1 rounded-full">
                Out of Stock
              </span>
            )}
          </div>

          {/* Name & Price */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {product.name}
          </h1>
          <div className="mt-3 flex items-end gap-3 flex-wrap">
            {discountPercent > 0 && (
              <span className="text-lg text-gray-400 dark:text-gray-500 line-through">
                {formatPrice(startingPrice)}
              </span>
            )}
            <div className="text-3xl font-bold text-primary-500">
              {sizeOptionPrices.length > 0 ? "From " : ""}
              {formatPrice(discountedPrice)}
            </div>
          </div>

          {/* Description */}
          <p className="mt-6 text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
            {product.description}
          </p>

          {/* Specs */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-center gap-3 bg-gray-50 dark:bg-dark-100 rounded-xl p-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500">
                  <spec.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {spec.label}
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {spec.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sizeOptionPrices.length > 0 && product.sizeOptions && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Size Options
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {product.sizeOptions.map((option) => {
                  const optionPrice = calculateDiscountedPrice(
                    option.price,
                    discountPercent
                  );

                  return (
                    <div
                      key={option.label}
                      className="rounded-xl border border-gray-200 dark:border-dark-200 bg-gray-50 dark:bg-dark-100 p-4"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      {discountPercent > 0 && (
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-through">
                          {formatPrice(option.price)}
                        </div>
                      )}
                      <div className="text-lg font-semibold text-primary-500">
                        {formatPrice(optionPrice)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact Buttons */}
          <div className="mt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Interested? Contact us to place your order:
            </p>
            <ContactButtons productName={product.name} price={discountedPrice} />
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Related Products
          </h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}