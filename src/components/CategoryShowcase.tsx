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

export default function CategoryShowcase() {
  return (
    <section className="py-12 bg-white dark:bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Shop by Category</h2>
            <Link href="/products" className="text-sm font-bold text-gray-900 border-b border-gray-900 pb-0.5 hover:text-primary-800 transition-colors dark:text-gray-300 dark:border-gray-300 dark:hover:text-primary-400">
                See All
            </Link>
        </div>
        <div className="flex overflow-x-auto pb-6 hide-scrollbar gap-6 snap-x px-2">
          {categoryConfig.map((category) => {
            const Icon = categoryIcons[category.value];

            return (
              <Link
                key={category.value}
                href={getCategoryPath(category)}
                className="group flex flex-col items-center gap-4 snap-start min-w-[100px] outline-none"
              >
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-50 overflow-hidden relative shadow-sm border border-black/5 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-primary-500 group-focus-visible:ring-offset-4 ring-offset-white dark:bg-dark-100 dark:border-white/10 dark:ring-offset-dark">
                    {/* Placeholder logic for category image */
                    /* Uncomment and use when you have images */
                    /* <Image src={category.imageUrl} alt={category.label} fill className="object-cover relative z-20" /> */}
                    
                    {/* Fallback Icon */}
                    <Icon className="h-10 w-10 text-gray-500 group-hover:text-primary-800 transition-colors dark:text-gray-400 dark:group-hover:text-primary-400 relative z-10" />
                </div>
                <span className="text-sm font-bold text-gray-800 text-center dark:text-gray-200 transition-colors group-hover:text-primary-800 dark:group-hover:text-primary-400">
                    {category.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </section>
  );
}
