import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, cache } from "react";
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
import ProductImageGallery from "../../../../components/ProductImageGallery";

interface ProductDetailPageProps {
  params: { id: string };
}

const getProduct = cache(async (id: string) => {
  try {
    const product = await prisma.product.findUnique({ where: { id } });
    return product ? hydrateProductImages(product) : null;
  } catch {
    return null;
  }
});

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
    return products.map((product) => hydrateProductImages(product));
  } catch {
    return [];
  }
}

async function RelatedProductsSection({
  relatedProductsPromise,
}: {
  relatedProductsPromise: Promise<Product[]>;
}) {
  const relatedProducts = await relatedProductsPromise;

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Related Products
      </h2>
      <ProductGrid products={relatedProducts} />
    </section>
  );
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

  const relatedProductsPromise = getRelatedProducts(product.id, product.category);
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
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductImageGallery
            key={product.id}
            images={product.images}
            productName={product.name}
          />
        </div>

        {/* Details */}
        <div className="flex flex-col">
          {/* Category & badges */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-500/10 px-3 py-0.5 text-xs font-medium text-primary-500">
              {categoryLabels[product.category] || product.category}
            </span>
            {product.customizable && (
              <span className="rounded-full bg-purple-500/10 px-3 py-0.5 text-xs font-medium text-purple-500">
                Customizable
              </span>
            )}
            {discountPercent > 0 && (
              <span className="rounded-full bg-rose-500/10 px-3 py-0.5 text-xs font-medium text-rose-500">
                {discountPercent}% Off
              </span>
            )}
            {!product.inStock && (
              <span className="rounded-full bg-red-500/10 px-3 py-0.5 text-xs font-medium text-red-500">
                Out of Stock
              </span>
            )}
          </div>

          {/* Name & Price */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {product.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-end gap-2.5">
            {discountPercent > 0 && (
              <span className="text-base text-gray-400 line-through dark:text-gray-500">
                {formatPrice(startingPrice)}
              </span>
            )}
            <div className="text-2xl font-bold text-primary-500 sm:text-3xl">
              {sizeOptionPrices.length > 0 ? "From " : ""}
              {formatPrice(discountedPrice)}
            </div>
          </div>

          {/* Description */}
          <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
            {product.description}
          </p>

          {/* Specs */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-center gap-2.5 rounded-xl bg-gray-50 p-3 dark:bg-dark-100"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/10 text-primary-500">
                  <spec.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-500">
                    {spec.label}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {spec.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {sizeOptionPrices.length > 0 && product.sizeOptions && (
            <div className="mt-6">
              <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
                Size Options
              </h3>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {product.sizeOptions.map((option) => {
                  const optionPrice = calculateDiscountedPrice(
                    option.price,
                    discountPercent
                  );

                  return (
                    <div
                      key={option.label}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-dark-200 dark:bg-dark-100"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      {discountPercent > 0 && (
                        <div className="mt-1 text-sm text-gray-500 line-through dark:text-gray-400">
                          {formatPrice(option.price)}
                        </div>
                      )}
                      <div className="text-base font-semibold text-primary-500">
                        {formatPrice(optionPrice)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact Buttons */}
          <div className="mt-6">
            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
              Interested? Contact us to place your order:
            </p>
            <ContactButtons productName={product.name} price={discountedPrice} />
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <RelatedProductsSection relatedProductsPromise={relatedProductsPromise} />
      </Suspense>
    </div>
  );
}