import ProductForm from "@/components/ProductForm";

export default function AdminNewProductPage() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add New Product
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Create a new 3D printed product listing
        </p>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
