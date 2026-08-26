"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  HiChevronLeft,
  HiChevronRight,
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const hasOverflow = scrollWidth > clientWidth + 4;
    setIsScrollable(hasOverflow);
    setShowLeftArrow(hasOverflow && scrollLeft > 4);
    setShowRightArrow(hasOverflow && scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    checkScroll();

    if (!scrollContainer) return;

    scrollContainer.addEventListener("scroll", checkScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(scrollContainer);

    window.addEventListener("resize", checkScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", checkScroll);
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="mt-6 sm:mt-8 mb-6 sm:mb-8 mx-4 sm:mx-0 pb-10 pt-2 bg-white dark:bg-dark rounded-3xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative transition-all pt-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Shop by Category
          </h2>
          <Link
            href="/products"
            className="text-sm font-bold text-gray-900 border-b border-gray-900 pb-0.5 hover:text-primary-800 transition-colors dark:text-gray-300 dark:border-gray-300 dark:hover:text-primary-400"
          >
            See All
          </Link>
        </div>

        {/* Categories Track Container with Arrows */}
        <div className="relative group">
          {/* Left Arrow Button */}
          {showLeftArrow && (
            <button
              onClick={() => handleScroll("left")}
              aria-label="Scroll categories left"
              className="hidden md:flex absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-dark-200/95 border border-gray-200 dark:border-white/10 shadow-lg text-gray-800 dark:text-gray-100 items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-300 hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <HiChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Gradient overlay left */}
          {showLeftArrow && (
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-dark-100 to-transparent z-10 pointer-events-none rounded-l-2xl" />
          )}

          {/* Scrollable / Flexible Row */}
          <div
            ref={scrollRef}
            className={`flex items-start overflow-x-auto hide-scrollbar py-2 px-1 gap-2 sm:gap-3 md:gap-4 snap-x transition-all ${
              isScrollable ? "justify-start" : "justify-between"
            }`}
          >
            {categoryConfig.map((category) => {
              const Icon = categoryIcons[category.value];

              return (
                <Link
                  key={category.value}
                  href={getCategoryPath(category)}
                  className="group/item flex flex-col items-center gap-2 snap-start outline-none flex-1 shrink-0"
                  style={{
                    minWidth: "64px",
                    maxWidth: "105px",
                  }}
                >
                  <div
                    className="rounded-full bg-gray-50 overflow-visible relative shadow-sm border border-black/5 flex items-center justify-center transition-all duration-300 group-hover/item:shadow-md group-hover/item:border-primary-500/30 group-hover/item:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-primary-500 group-focus-visible:ring-offset-4 ring-offset-white dark:bg-dark-200 dark:border-white/10 dark:ring-offset-dark"
                    style={{
                      width: "clamp(48px, 5.5vw, 76px)",
                      height: "clamp(48px, 5.5vw, 76px)",
                    }}
                  >
                    <Icon
                      className="text-gray-600 group-hover/item:text-primary-800 transition-colors dark:text-gray-300 dark:group-hover/item:text-primary-400 relative z-10"
                      style={{
                        width: "clamp(20px, 2.3vw, 32px)",
                        height: "clamp(20px, 2.3vw, 32px)",
                      }}
                    />
                  </div>
                  <span
                    className="font-bold text-gray-800 text-center dark:text-gray-200 transition-colors group-hover/item:text-primary-800 dark:group-hover/item:text-primary-400 line-clamp-2 px-0.5 w-full leading-tight"
                    style={{
                      fontSize: "clamp(0.625rem, 0.95vw, 0.8125rem)",
                    }}
                  >
                    {category.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Gradient overlay right */}
          {showRightArrow && (
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-dark-100 to-transparent z-10 pointer-events-none rounded-r-2xl" />
          )}

          {/* Right Arrow Button */}
          {showRightArrow && (
            <button
              onClick={() => handleScroll("right")}
              aria-label="Scroll categories right"
              className="hidden md:flex absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-dark-200/95 border border-gray-200 dark:border-white/10 shadow-lg text-gray-800 dark:text-gray-100 items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-300 hover:scale-110 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <HiChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
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

