"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

const slides = [
  {
    gradient: "from-slate-900 via-cyan-950 to-slate-900",
    tagline: "Premium 3D Printed Products",
    cta: "Shop Now",
    href: "/products",
  },
  {
    gradient: "from-slate-900 via-indigo-950 to-slate-900",
    tagline: "Custom & Personalized Pieces",
    cta: "Explore",
    href: "/products/custom-personalized",
  },
  {
    gradient: "from-slate-900 via-emerald-950 to-slate-900",
    tagline: "Desk Accessories & Home Decor",
    cta: "Browse",
    href: "/products/desk-accessories",
  },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <div className="relative h-[280px] sm:h-[360px] lg:h-[440px]">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-in-out bg-gradient-to-r ${slide.gradient} ${
              index === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {/* Subtle texture overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.04),_transparent_70%)]" />

            <div className="relative z-10 text-center px-6">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                {slide.tagline}
              </h2>
              <Link
                href={slide.href}
                className="mt-5 inline-flex items-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-100 hover:shadow-lg hover:shadow-white/10 hover:-translate-y-0.5"
              >
                {slide.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white"
      >
        <HiChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white"
      >
        <HiChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === current
                ? "w-6 bg-white"
                : "w-2 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
