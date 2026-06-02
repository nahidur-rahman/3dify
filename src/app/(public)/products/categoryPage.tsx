import { Metadata } from "next";
import ProductCatalogPage from "@/components/ProductCatalogPage";
import {
  getCategoryPath,
  type Category,
  categoryByValue,
} from "@/lib/categories";
import {
  getProductCatalogData,
  type ProductCatalogSearchParams,
} from "@/lib/productCatalog";

interface CategoryProductsPageProps {
  searchParams: ProductCatalogSearchParams;
}

export function createCategoryMetadata(category: Category) {
  return async function generateMetadata(): Promise<Metadata> {
    const selectedCategory = categoryByValue[category];
    const description = `Browse ${selectedCategory.seoName} from 3Dify BD. ${selectedCategory.description}`;

    return {
      title: selectedCategory.label,
      description,
      keywords: [
        selectedCategory.seoName,
        `${selectedCategory.label} Bangladesh`,
        `${selectedCategory.label} 3D printing`,
      ],
      alternates: {
        canonical: getCategoryPath(category),
      },
      openGraph: {
        title: `${selectedCategory.label} | 3Dify BD`,
        description,
        url: getCategoryPath(category),
        type: "website",
      },
    };
  };
}

export function createCategoryPage(category: Category) {
  return async function CategoryProductsPage({
    searchParams,
  }: CategoryProductsPageProps) {
    const catalogData = await getProductCatalogData(searchParams, category);
    return <ProductCatalogPage {...catalogData} />;
  };
}