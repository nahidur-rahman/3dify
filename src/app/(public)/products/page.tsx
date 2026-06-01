import { Metadata } from "next";
import {
  buildCatalogUrl,
  isCategoryValue,
} from "@/lib/categories";
import ProductCatalogPage from "@/components/ProductCatalogPage";
import {
  getProductCatalogData,
  type ProductCatalogSearchParams,
} from "@/lib/productCatalog";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our collection of premium 3D printed products.",
  alternates: {
    canonical: "/products",
  },
};

interface ProductsPageProps {
  searchParams: ProductCatalogSearchParams;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const normalizedCategory = searchParams.category?.trim() || "";

  if (normalizedCategory && isCategoryValue(normalizedCategory)) {
    redirect(
      buildCatalogUrl({
        category: normalizedCategory,
        search: searchParams.search,
        sort: searchParams.sort,
        subcategory: searchParams.subcategory,
        page: searchParams.page,
      })
    );
  }

  const catalogData = await getProductCatalogData(searchParams, null);
  return <ProductCatalogPage {...catalogData} />;
}