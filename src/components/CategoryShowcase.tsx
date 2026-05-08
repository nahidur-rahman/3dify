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
        <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex rounded-full border border-primary-500/15 bg-primary-500/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary-500 dark:text-primary-300">
              Curated Categories
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Shop by{" "}
              <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
                category
              </span>
            </h2>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
              Explore signature product groups designed for gifting, collecting, and everyday use.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200/70 bg-white/80 px-5 py-4 text-sm text-gray-600 shadow-sm dark:border-dark-200 dark:bg-dark-100/80 dark:text-gray-300">
            Need something unique? Start with <span className="font-semibold text-primary-500 dark:text-primary-300">Custom Models</span> and message us directly.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(([value, label]) => (
            <Link
              key={value}
              href={`/products?category=${value}`}
              className="group relative overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white/90 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-500/40 hover:shadow-2xl hover:shadow-primary-500/10 dark:border-dark-200 dark:bg-dark-100/85"
            >
              <div className="absolute inset-x-6 top-0 h-20 rounded-b-[2rem] bg-gradient-to-b from-white/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div
                className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${categoryColors[value]} text-white shadow-lg shadow-black/10 transition-transform duration-300 group-hover:scale-110`}
              >
                {categoryIcons[value]}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-primary-500 dark:text-white">
                {label}
              </h3>
              <p className="mt-2 min-h-[3rem] text-sm leading-6 text-gray-500 dark:text-gray-400">
                {categoryDescriptions[value]}
              </p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-medium text-primary-500 transition-transform group-hover:translate-x-1">
                  Browse →
                </span>
                <span className="rounded-full border border-gray-200 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gray-400 dark:border-dark-200">
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
