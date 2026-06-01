import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  categoryConfig,
  categoryLabels,
  categorySubcategories,
  isCategoryValue,
} from "@/lib/categories";
import { formatPrice } from "@/lib/utils";
import DeleteProductButton from "./DeleteProductButton";
import {
  HiOutlinePlusCircle,
  HiOutlinePencil,
  HiOutlineSearch,
} from "react-icons/hi";
import { hydrateProductImages } from "@/lib/productImages";

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "in-stock", label: "In stock" },
  { value: "out-of-stock", label: "Out of stock" },
];

interface ProductsPageSearchParams {
  name?: string;
  category?: string;
  subcategory?: string;
  status?: string;
  createdBy?: string;
}

function normalizeSearchParam(value?: string) {
  return value?.trim() || "";
}

async function getProducts(searchParams: ProductsPageSearchParams) {
  const name = normalizeSearchParam(searchParams.name);
  const categoryParam = normalizeSearchParam(searchParams.category);
  const category = isCategoryValue(categoryParam) ? categoryParam : "";
  const subcategoryParam = normalizeSearchParam(searchParams.subcategory);
  const status = normalizeSearchParam(searchParams.status);
  const createdBy = normalizeSearchParam(searchParams.createdBy);
  const availableSubcategories = category
    ? categorySubcategories[category]
    : categoryConfig.flatMap((categoryItem) => categoryItem.subcategories);
  const subcategory = availableSubcategories.includes(subcategoryParam)
    ? subcategoryParam
    : "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (name) {
    where.name = { contains: name, mode: "insensitive" };
  }

  if (category) {
    where.category = category;
  }

  if (subcategory) {
    where.subcategory = subcategory;
  }

  if (status === "in-stock") {
    where.inStock = true;
  }

  if (status === "out-of-stock") {
    where.inStock = false;
  }

  if (createdBy) {
    where.createdBy = { contains: createdBy, mode: "insensitive" };
  }

  try {
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return {
      products: products.map((product) => hydrateProductImages(product)),
      filters: { name, category, subcategory, status, createdBy },
      hasActiveFilters: Boolean(
        name || category || subcategory || status || createdBy
      ),
    };
  } catch {
    return {
      products: [],
      filters: {
        name: "",
        category: "",
        subcategory: "",
        status: "",
        createdBy: "",
      },
      hasActiveFilters: false,
    };
  }
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: ProductsPageSearchParams;
}) {
  const { products, filters, hasActiveFilters } = await getProducts(searchParams);
  const selectedCategory =
    filters.category && isCategoryValue(filters.category)
      ? filters.category
      : null;
  const subcategoryGroups = selectedCategory
    ? [
        {
          label: categoryLabels[selectedCategory],
          values: categorySubcategories[selectedCategory],
        },
      ]
    : categoryConfig.map((category) => ({
        label: category.label,
        values: [...category.subcategories],
      }));
  const filterSignature = [
    filters.name,
    filters.category,
    filters.subcategory,
    filters.status,
    filters.createdBy,
  ].join("|");
  const productSummary = hasActiveFilters
    ? `Showing ${products.length} matching product${products.length === 1 ? "" : "s"}`
    : `Manage your product listings (${products.length} total)`;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{productSummary}</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all"
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      <div className="mb-6 rounded-[1.5rem] border border-gray-200/80 bg-white/90 p-3.5 shadow-sm dark:border-dark-200 dark:bg-dark-100/90">
        <div className="mb-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Search and refine
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Search by product name, category, subcategory, stock status, or creator.
          </p>
        </div>

        <form
          key={filterSignature}
          method="get"
          className="flex flex-wrap items-end gap-2"
        >
          <label className="relative min-w-[220px] flex-[2_1_280px]">
            <span className="sr-only">Search by product name</span>
            <HiOutlineSearch className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="name"
              defaultValue={filters.name}
              placeholder="Search by product name"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-10 pr-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-200 dark:bg-dark-200 dark:text-white"
            />
          </label>

          <label className="min-w-[140px] flex-[1_1_160px]">
            <span className="sr-only">Filter by category</span>
            <select
              name="category"
              defaultValue={filters.category}
              className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-200 dark:bg-dark-200 dark:text-white"
            >
              <option value="">All categories</option>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-[160px] flex-[1_1_190px]">
            <span className="sr-only">Filter by subcategory</span>
            <select
              name="subcategory"
              defaultValue={filters.subcategory}
              className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-200 dark:bg-dark-200 dark:text-white"
            >
              <option value="">All subcategories</option>
              {subcategoryGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.values.map((subcategory: string) => (
                    <option key={`${group.label}-${subcategory}`} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <label className="min-w-[140px] flex-[1_1_160px]">
            <span className="sr-only">Filter by status</span>
            <select
              name="status"
              defaultValue={filters.status}
              className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-200 dark:bg-dark-200 dark:text-white"
            >
              {statusOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="min-w-[150px] flex-[1_1_180px]">
            <span className="sr-only">Filter by creator</span>
            <input
              type="text"
              name="createdBy"
              defaultValue={filters.createdBy}
              placeholder="Created by username"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-200 dark:bg-dark-200 dark:text-white"
            />
          </label>

          <div className="flex flex-none flex-wrap items-center gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
            >
              <HiOutlineSearch className="h-3.5 w-3.5" />
              Apply filters
            </button>
            {hasActiveFilters && (
              <Link
                href="/admin/products"
                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-primary-500 hover:text-primary-500 dark:border-dark-200 dark:bg-dark-100 dark:text-gray-300"
              >
                Clear filters
              </Link>
            )}
          </div>
        </form>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200">
          <div className="text-6xl mb-4">{hasActiveFilters ? "🔎" : "📦"}</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {hasActiveFilters ? "No products match these filters" : "No products yet"}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {hasActiveFilters
              ? "Try widening the filters or clearing the current search criteria."
              : "Start by adding your first 3D printed product."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {hasActiveFilters ? (
              <Link
                href="/admin/products"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-medium text-gray-600 hover:border-primary-500 hover:text-primary-500 dark:border-dark-200 dark:bg-dark-100 dark:text-gray-300"
              >
                Clear filters
              </Link>
            ) : null}
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-600"
            >
              <HiOutlinePlusCircle className="w-5 h-5" />
              Add Product
            </Link>
          </div>
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
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Created by
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Updated by
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
                        <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-400 dark:bg-dark-200">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-cover"
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
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {categoryLabels[product.category] || product.category}
                        </p>
                        {product.subcategory ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {product.subcategory}
                          </p>
                        ) : null}
                      </div>
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {product.createdBy ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {product.updatedBy ?? "—"}
                      </span>
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
