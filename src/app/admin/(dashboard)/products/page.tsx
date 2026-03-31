import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice, categoryLabels } from "@/lib/utils";
import DeleteProductButton from "./DeleteProductButton";
import { HiOutlinePlusCircle, HiOutlinePencil } from "react-icons/hi";

async function getProducts() {
  try {
    return await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  } catch {
    return [];
  }
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your product listings ({products.length} total)
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all"
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No products yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Start by adding your first 3D printed product.
          </p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-600"
          >
            <HiOutlinePlusCircle className="w-5 h-5" />
            Add Product
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-200">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Product
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Category
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Price
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-100 dark:border-dark-200 last:border-0 hover:bg-gray-50 dark:hover:bg-dark-200 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-200 flex items-center justify-center text-gray-400 overflow-hidden">
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg">📦</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {product.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {categoryLabels[product.category] || product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatPrice(product.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.inStock
                              ? "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                              : "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                        {product.featured && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="p-2 rounded-lg text-gray-500 hover:text-primary-500 hover:bg-primary-500/10 transition-colors"
                          title="Edit"
                        >
                          <HiOutlinePencil className="w-4 h-4" />
                        </Link>
                        <DeleteProductButton productId={product.id} productName={product.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
