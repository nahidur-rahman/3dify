"use client";

import Image from "next/image";
import { useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleImages = images.length > 1;
  const activeImage = images[activeIndex] ?? images[0];

  const goToPrevious = () => {
    if (!hasMultipleImages) return;

    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    if (!hasMultipleImages) return;

    setActiveIndex((current) => (current + 1) % images.length);
  };

  if (!activeImage) {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 dark:bg-dark-100">
          <div className="flex h-full items-center justify-center text-gray-400">
            <svg
              className="h-24 w-24"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 dark:bg-dark-100">
        <Image
          src={activeImage}
          alt={productName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />

        {hasMultipleImages && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />

            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/90 text-gray-900 shadow-lg shadow-black/10 backdrop-blur transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-dark-200 dark:bg-black/40 dark:text-white dark:hover:bg-black/60"
            >
              <HiChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={goToNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/90 text-gray-900 shadow-lg shadow-black/10 backdrop-blur transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-dark-200 dark:bg-black/40 dark:text-white dark:hover:bg-black/60"
            >
              <HiChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
              {activeIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className="flex w-full justify-center gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`View ${productName} image ${index + 1}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "relative h-16 w-16 flex-none overflow-hidden rounded-xl border bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-2 focus:ring-offset-white dark:border-dark-200 dark:bg-dark-200 dark:focus:ring-offset-dark",
                  isActive
                    ? "border-primary-500 ring-2 ring-primary-500/20"
                    : "border-gray-200 hover:border-primary-500/40"
                )}
              >
                <Image
                  src={image}
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}