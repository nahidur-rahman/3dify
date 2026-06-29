"use client";

import Link from "next/link";
import { HiArrowRight } from "react-icons/hi";

const heroCategories = [
  { id: 1, title: "Home Decor", href: "/products?category=HOME_DECOR" },
  { id: 2, title: "Desk Accessories", href: "/products?category=DESK_ACCESSORIES" },
  { id: 3, title: "Cosplay & Props", href: "/products?category=COSPLAY_PROPS_AND_MODEL_KITS" },
  { id: 4, title: "Toys & Fidgets", href: "/products?category=TOYS_AND_FIDGETS" },
];

export default function HeroSection() {
  return (
    <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white dark:bg-dark">
      <div className="relative rounded-3xl overflow-hidden bg-gray-50 dark:bg-dark-100 flex flex-col lg:flex-row min-h-[500px] border border-gray-200 dark:border-white/10">
        
        {/* Left Content Area (Text & Button) */}
        <div className="lg:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative z-20">
          <span className="text-sm font-bold tracking-wider text-primary-600 dark:text-primary-400 uppercase mb-3 block">
            Premium 3D Printed
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
            Bring Your Imagination to Life
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 font-medium">
            Explore our collection of custom decor, intricate collectibles, and functional desk accessories.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-800 px-8 py-4 text-base font-bold text-white transition-all hover:bg-primary-900 hover:shadow-xl hover:-translate-y-1 w-max dark:bg-primary-600 dark:hover:bg-primary-500"
          >
            Shop Collection <HiArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Right Content Area (4 Category Slides/Figures) */}
        <div className="lg:w-1/2 bg-gray-100 dark:bg-dark-200 p-8 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-white/10">
          <div className="grid grid-cols-2 gap-4 w-full h-full max-h-[500px]">
             {heroCategories.map((cat) => (
                <Link key={cat.id} href={cat.href} className="group relative rounded-2xl overflow-hidden bg-gray-200 dark:bg-dark-300 flex items-end justify-center aspect-square md:aspect-auto hover:shadow-lg transition-all">
                   {/* Image Placeholder */}
                   <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 w-full h-full flex items-center justify-center border border-black/5">
                      <span className="text-gray-400 dark:text-gray-500 font-medium text-xs md:text-sm">Placeholder Image</span>
                   </div>
                   {/* Gradient overlay for text */}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                   
                   <div className="relative z-10 p-4 w-full text-center transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <h3 className="text-white font-bold text-sm md:text-base">{cat.title}</h3>
                   </div>
                </Link>
             ))}
          </div>
        </div>

      </div>
    </section>
  );
}
