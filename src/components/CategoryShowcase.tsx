import Link from "next/link";
import { categoryLabels, categoryDescriptions } from "@/lib/utils";
import { HiOutlineCube, HiOutlineDeviceMobile, HiOutlineHome, HiOutlineSparkles } from "react-icons/hi";

const categoryIcons: Record<string, React.ReactNode> = {
  FIGURINE: <HiOutlineCube className="w-8 h-8" />,
  PHONE_CASE: <HiOutlineDeviceMobile className="w-8 h-8" />,
  HOME_DECOR: <HiOutlineHome className="w-8 h-8" />,
  CUSTOM: <HiOutlineSparkles className="w-8 h-8" />,
};

const categoryColors: Record<string, string> = {
  FIGURINE: "from-blue-500 to-blue-600",
  PHONE_CASE: "from-pink-500 to-pink-600",
  HOME_DECOR: "from-amber-500 to-amber-600",
  CUSTOM: "from-purple-500 to-purple-600",
};

export default function CategoryShowcase() {
  const categories = Object.entries(categoryLabels);

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Shop by{" "}
            <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
              Category
            </span>
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400 text-lg">
            Find exactly what you&apos;re looking for
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(([value, label]) => (
            <Link
              key={value}
              href={`/products?category=${value}`}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-dark-100 border border-gray-200 dark:border-dark-200 p-6 hover:border-primary-500/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div
                className={`w-16 h-16 rounded-xl bg-gradient-to-br ${categoryColors[value]} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                {categoryIcons[value]}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">
                {label}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {categoryDescriptions[value]}
              </p>
              <div className="mt-4 text-primary-500 text-sm font-medium group-hover:translate-x-1 transition-transform">
                Browse →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
