import Image from "next/image";
import Link from "next/link";
import { HiArrowRight } from "react-icons/hi";
import { resolveStorageImageUrl } from "@/lib/productImages";

const heroCategories = [
  {
    id: 1,
    title: "Home Decor",
    href: "/products?category=HOME_DECOR",
    imagePath: "homepage/home_decor.png",
  },
  {
    id: 2,
    title: "Desk Accessories",
    href: "/products?category=DESK_ACCESSORIES",
    imagePath: "homepage/desk_accessories.jpg",
  },
  {
    id: 3,
    title: "Collectibles & Figures",
    href: "/products?category=COLLECTIBLES_AND_FIGURES",
    imagePath: "homepage/collectibles_and_figures.png",
  },
  {
    id: 4,
    title: "Toys & Fidgets",
    href: "/products?category=TOYS_AND_FIDGETS",
    imagePath: "homepage/toys_and_fidgets.png",
  },
];

export default function HeroSection() {
  return (
    <section className="max-w-7xl mx-auto rounded-b-3xl bg-white px-4 py-4 dark:bg-dark sm:px-6 sm:py-5 lg:px-8 lg:py-6">
      <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-dark-100 lg:min-h-[430px] lg:flex-row xl:min-h-[450px]">
        
        {/* Left Content Area (Text & Button) */}
        <div className="relative z-20 flex flex-col justify-center p-5 sm:p-7 md:p-9 lg:w-5/12 lg:px-10 lg:py-8 xl:px-12 xl:py-10">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-primary-600 dark:text-primary-400 sm:text-xs md:text-sm">
            Premium 3D Printed
          </span>
          <h1 className="mb-4 text-[2.15rem] font-extrabold leading-[1.02] tracking-tight text-gray-900 dark:text-white sm:text-4xl md:text-5xl lg:text-[3rem] xl:text-[3.35rem]">
            Bring Your Imagination to Life
          </h1>
          <p className="mb-6 max-w-md text-sm font-medium text-gray-600 dark:text-gray-300 sm:text-base md:text-lg lg:mb-7 lg:text-[1.1rem]">
            Discover custom decor, collectible pieces, and practical accessories made to order.
          </p>
          <Link
            href="/products"
            className="inline-flex w-max items-center gap-2 rounded-xl bg-primary-800 px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-900 hover:shadow-lg dark:bg-primary-600 dark:hover:bg-primary-500 sm:px-6 sm:py-3 sm:text-[0.95rem]"
          >
            Shop Collection <HiArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </div>

        {/* Right Content Area (4 Category Slides/Figures) */}
        <div className="flex items-center justify-center border-t border-gray-200 bg-gray-100 p-4 dark:border-white/10 dark:bg-dark-200 lg:w-7/12 lg:border-l lg:border-t-0 lg:p-5 xl:p-6">
          <div className="grid h-full max-h-[360px] w-full grid-cols-2 gap-3 sm:max-h-[400px] sm:gap-4 lg:max-h-[430px] xl:max-h-[450px]">
             {heroCategories.map((cat) => (
                <Link key={cat.id} href={cat.href} className="group relative flex aspect-square items-end justify-center overflow-hidden rounded-2xl bg-gray-200 transition-all hover:shadow-lg dark:bg-dark-300 md:aspect-auto">
                   {/* Category Image */}
                   <Image
                     src={resolveStorageImageUrl(cat.imagePath)}
                     alt={cat.title}
                     fill
                     className="object-cover"
                     sizes="(max-width: 640px) 44vw, (max-width: 1024px) 42vw, 24vw"
                   />
                   {/* Gradient overlay for text */}
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                   
                   <div className="relative z-10 w-full p-3 text-center transform translate-y-2 transition-transform group-hover:translate-y-0 sm:p-4">
                      <h3 className="text-xs font-bold text-white sm:text-sm md:text-base">{cat.title}</h3>
                   </div>
                </Link>
             ))}
          </div>
        </div>

      </div>
    </section>
  );
}
