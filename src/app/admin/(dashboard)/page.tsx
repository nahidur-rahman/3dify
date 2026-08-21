import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  HiOutlineCube,
  HiOutlineStar,
  HiOutlineTag,
  HiOutlinePlusCircle,
  HiOutlineUserAdd,
  HiOutlineShoppingBag,
  HiOutlineClock,
  HiOutlineTruck,
} from "react-icons/hi";

async function getStats() {
  try {
    const [totalProducts, featuredProducts, outOfStock, totalOrders, pendingOrders] =
      await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { featured: true } }),
        prisma.product.count({ where: { inStock: false } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
      ]);
    return { totalProducts, featuredProducts, outOfStock, totalOrders, pendingOrders };
  } catch {
    return {
      totalProducts: 0,
      featuredProducts: 0,
      outOfStock: 0,
      totalOrders: 0,
      pendingOrders: 0,
    };
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const statCards = [
    {
      label: "Total Orders",
      value: stats.totalOrders,
      icon: HiOutlineShoppingBag,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Pending Orders",
      value: stats.pendingOrders,
      icon: HiOutlineClock,
      color: "from-amber-500 to-amber-600",
    },
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: HiOutlineCube,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Featured",
      value: stats.featuredProducts,
      icon: HiOutlineStar,
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Overview of your 3Dify BD store
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/orders"
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-all text-sm"
          >
            <HiOutlineShoppingBag className="w-5 h-5" />
            View Orders
          </Link>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2.5 rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all text-sm"
          >
            <HiOutlinePlusCircle className="w-5 h-5" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-300 transition-colors"
          >
            <HiOutlineShoppingBag className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Manage Orders
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                View orders & update statuses
              </p>
            </div>
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-300 transition-colors"
          >
            <HiOutlineCube className="w-8 h-8 text-primary-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Manage Products
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                View, edit, or delete products
              </p>
            </div>
          </Link>

          <Link
            href="/admin/shipping"
            className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-300 transition-colors"
          >
            <HiOutlineTruck className="w-8 h-8 text-cyan-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Shipping Rates
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Set delivery rates
              </p>
            </div>
          </Link>

          <Link
            href="/admin/products/new"
            className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-dark-200 hover:bg-gray-100 dark:hover:bg-dark-300 transition-colors"
          >
            <HiOutlinePlusCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Add New Product
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Create a new 3D printed listing
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

