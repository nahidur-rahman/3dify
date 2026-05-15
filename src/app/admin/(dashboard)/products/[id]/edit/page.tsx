import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductForm from "@/components/ProductForm";
import { Product } from "@/lib/types";
import {
  getImageSignatures,
  getProductImageLimit,
  hydrateProductImages,
} from "@/lib/productImages";

interface EditProductPageProps {
  params: { id: string };
}

async function getProduct(id: string): Promise<Product | null> {
  try {
    const product = await prisma.product.findUnique({ where: { id } });
    return product ? hydrateProductImages(product) : null;
  } catch {
    return null;
  }
}

export default async function AdminEditProductPage({
  params,
}: EditProductPageProps) {
  const product = await getProduct(params.id);
  if (!product) notFound();
  const existingImageSignatures = await getImageSignatures(product.images);
  const imageLimit = getProductImageLimit();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Edit Product
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Update &ldquo;{product.name}&rdquo;
        </p>
      </div>
      <ProductForm
        mode="edit"
        product={product}
        existingImageSignatures={existingImageSignatures}
        imageLimit={imageLimit}
      />
    </div>
  );
}
