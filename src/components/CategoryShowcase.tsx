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
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {categoryConfig.map((category) => {
            const Icon = categoryIcons[category.value];

            return (
              <Link
                key={category.value}
                href={getCategoryPath(category)}
                className="group inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-500/40 hover:text-primary-600 hover:shadow-md dark:border-dark-200 dark:bg-dark-100 dark:text-gray-300 dark:hover:border-primary-500/40 dark:hover:text-primary-300"
              >
                <Icon className="h-4 w-4 text-gray-400 transition-colors group-hover:text-primary-500 dark:text-gray-500 dark:group-hover:text-primary-400" />
                {category.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
