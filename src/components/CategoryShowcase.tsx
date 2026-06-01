import Link from "next/link";
import type { IconType } from "react-icons";
import {
  HiOutlineCollection,
  HiOutlineCube,
  HiOutlineDesktopComputer,
  HiOutlineFilm,
  HiOutlineGift,
  HiOutlineHeart,
  HiOutlineHome,
  HiOutlineLightBulb,
  HiOutlinePuzzle,
  HiOutlineSparkles,
} from "react-icons/hi";
import {
  categoryByValue,
  categoryConfig,
  getCategoryPath,
  type Category,
} from "@/lib/categories";

const categoryIcons: Record<Category, IconType> = {
  HOME_DECOR: HiOutlineHome,
  DESK_ACCESSORIES: HiOutlineDesktopComputer,
  LAMPS: HiOutlineLightBulb,
  VASES_AND_PLANTERS: HiOutlineCollection,
  TOYS_AND_FIDGETS: HiOutlinePuzzle,
  COLLECTIBLES_AND_FIGURES: HiOutlineCube,
  GAMING_AND_POP_CULTURE: HiOutlineFilm,
  COSPLAY_PROPS_AND_MODEL_KITS: HiOutlineSparkles,
  CUSTOM_AND_PERSONALIZED: HiOutlineGift,
  PET_ACCESSORIES: HiOutlineHeart,
};

const categoryThemes: Record<
  Category,
  { gradient: string; accent: string; ring: string }
> = {
  HOME_DECOR: {
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    accent: "text-amber-600 dark:text-amber-300",
    ring: "hover:shadow-amber-500/10",
  },
  DESK_ACCESSORIES: {
    gradient: "from-sky-500 via-cyan-500 to-blue-600",
    accent: "text-sky-600 dark:text-sky-300",
    ring: "hover:shadow-sky-500/10",
  },
  LAMPS: {
    gradient: "from-yellow-400 via-amber-500 to-orange-500",
    accent: "text-yellow-600 dark:text-yellow-300",
    ring: "hover:shadow-yellow-500/10",
  },
  VASES_AND_PLANTERS: {
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    accent: "text-emerald-600 dark:text-emerald-300",
    ring: "hover:shadow-emerald-500/10",
  },
  TOYS_AND_FIDGETS: {
    gradient: "from-fuchsia-500 via-pink-500 to-rose-500",
    accent: "text-fuchsia-600 dark:text-fuchsia-300",
    ring: "hover:shadow-fuchsia-500/10",
  },
  COLLECTIBLES_AND_FIGURES: {
    gradient: "from-indigo-500 via-violet-500 to-purple-600",
    accent: "text-indigo-600 dark:text-indigo-300",
    ring: "hover:shadow-indigo-500/10",
  },
  GAMING_AND_POP_CULTURE: {
    gradient: "from-slate-700 via-slate-800 to-black",
    accent: "text-slate-700 dark:text-slate-200",
    ring: "hover:shadow-slate-500/20",
  },
  COSPLAY_PROPS_AND_MODEL_KITS: {
    gradient: "from-red-500 via-orange-500 to-amber-500",
    accent: "text-red-600 dark:text-red-300",
    ring: "hover:shadow-red-500/10",
  },
  CUSTOM_AND_PERSONALIZED: {
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
    accent: "text-rose-600 dark:text-rose-300",
    ring: "hover:shadow-rose-500/10",
  },
  PET_ACCESSORIES: {
    gradient: "from-lime-500 via-green-500 to-emerald-600",
    accent: "text-lime-600 dark:text-lime-300",
    ring: "hover:shadow-lime-500/10",
  },
};

export default function CategoryShowcase() {
  const customCategory = categoryByValue.CUSTOM_AND_PERSONALIZED;

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
              Explore ten curated product lanes spanning decor, gifting, fandom, workspace tools, and custom commissions.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200/70 bg-white/80 px-3 py-2.5 text-sm text-gray-600 shadow-sm dark:border-dark-200 dark:bg-dark-100/80 dark:text-gray-300">
            Need something unique? Start with <span className="font-semibold text-primary-500 dark:text-primary-300">{customCategory.label}</span> and message us directly.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {categoryConfig.map((category) => {
            const Icon = categoryIcons[category.value];
            const theme = categoryThemes[category.value];

            return (
            <Link
              key={category.value}
              href={getCategoryPath(category)}
              className={`group relative overflow-hidden rounded-[1.75rem] border border-gray-200/80 bg-white/90 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-500/30 hover:shadow-xl ${theme.ring} dark:border-dark-200 dark:bg-dark-100/85`}
            >
              <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${theme.gradient} opacity-90`} />
              <div className="absolute inset-x-4 top-4 h-12 rounded-full bg-white/15 blur-2xl" />
              <div className="relative">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow-lg shadow-black/10 transition-transform duration-200 group-hover:scale-105`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full border border-gray-200/80 bg-white/85 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500 dark:border-dark-200 dark:bg-dark-100 dark:text-gray-400">
                    {category.slug}
                  </span>
                </div>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${theme.accent}`}>
                  {category.seoName}
                </p>
                <h3 className="mt-1 text-base font-semibold text-gray-900 transition-colors group-hover:text-primary-500 dark:text-white">
                  {category.label}
                </h3>
                <p className="mt-1.5 min-h-[3.75rem] text-sm leading-5 text-gray-500 dark:text-gray-400">
                  {category.description}
                </p>
                <p className="mt-3 text-xs leading-5 text-gray-400 dark:text-gray-500">
                  {category.subcategories.slice(0, 3).join(" · ")}
                </p>
              </div>
              <div className="relative mt-4 flex items-center justify-between">
                <span className="text-sm font-medium text-primary-500 transition-transform group-hover:translate-x-1">
                  Browse →
                </span>
                <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:border-dark-200">
                  {category.subcategories.length} picks
                </span>
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
