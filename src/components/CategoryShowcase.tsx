import Link from "next/link";
import { categoryLabels, categoryDescriptions } from "@/lib/utils";
import { HiOutlineCube, HiOutlineDeviceMobile, HiOutlineHome, HiOutlineSparkles } from "react-icons/hi";

const categoryIcons: Record<string, React.ReactNode> = {
  FIGURINE: <HiOutlineCube className="w-6 h-6" />,
  PHONE_CASE: <HiOutlineDeviceMobile className="w-6 h-6" />,
  HOME_DECOR: <HiOutlineHome className="w-6 h-6" />,
  CUSTOM: <HiOutlineSparkles className="w-6 h-6" />,
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
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex rounded-full border border-primary-500/15 bg-primary-500/5 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-500 dark:text-primary-300">
              Curated Categories
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Shop by{" "}
              <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
                category
              </span>
            </h2>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400 sm:text-lg">
              Explore signature product groups designed for gifting, collecting, and everyday use.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200/70 bg-white/80 px-3 py-2.5 text-sm text-gray-600 shadow-sm dark:border-dark-200 dark:bg-dark-100/80 dark:text-gray-300">
            Need something unique? Start with <span className="font-semibold text-primary-500 dark:text-primary-300">Custom Models</span> and message us directly.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(([value, label]) => (
            <Link
              key={value}
              href={`/products?category=${value}`}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white/90 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-500/40 hover:shadow-xl hover:shadow-primary-500/10 dark:border-dark-200 dark:bg-dark-100/85"
            >
              <div className="absolute inset-x-4 top-0 h-12 rounded-b-[1.5rem] bg-gradient-to-b from-white/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-gradient-to-br ${categoryColors[value]} text-white shadow-lg shadow-black/10 transition-transform duration-200 group-hover:scale-105`}
              >
                {categoryIcons[value]}
              </div>
              <h3 className="text-base font-semibold text-gray-900 transition-colors group-hover:text-primary-500 dark:text-white">
                {label}
              </h3>
              <p className="mt-1.5 min-h-[2.5rem] text-sm leading-5 text-gray-500 dark:text-gray-400">
                {categoryDescriptions[value]}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-primary-500 transition-transform group-hover:translate-x-1">
                  Browse →
                </span>
                <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:border-dark-200">
                  Shop now
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
