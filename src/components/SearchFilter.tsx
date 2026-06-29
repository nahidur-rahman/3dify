"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { HiSearch } from "react-icons/hi";
import {
  buildCatalogUrl,
  categoryByValue,
  categoryConfig,
  categorySubcategories,
  isValidSubcategoryForCategory,
  type Category,
} from "@/lib/categories";

interface SearchFilterProps {
  currentCategory?: Category | null;
}

type NavigationMode = "push" | "reload";

export default function SearchFilter({
  currentCategory = null,
}: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const currentSubcategoryParam = searchParams.get("subcategory") || "";
  const currentSubcategory =
    currentCategory &&
    isValidSubcategoryForCategory(currentCategory, currentSubcategoryParam)
      ? currentSubcategoryParam
      : "";
  const currentSort = searchParams.get("sort") || "newest";
  const selectedCategory = currentCategory
    ? categoryByValue[currentCategory]
    : null;
  const availableSubcategories = currentCategory
    ? categorySubcategories[currentCategory]
    : [];

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  const updateParams = useCallback(
    (
      updates: Record<string, string | null>,
      nextCategory = currentCategory,
      navigationMode: NavigationMode = "push"
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      params.delete("page"); // Reset page on filter change
      const nextUrl = buildCatalogUrl({
        category: nextCategory,
        search: params.get("search"),
        sort: params.get("sort"),
        subcategory: params.get("subcategory"),
      });

      if (navigationMode === "reload") {
        window.location.assign(nextUrl);
        return;
      }

      router.push(nextUrl);
    },
    [currentCategory, router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ search: search || null });
  };

  const handleCategoryChange = (value: string) => {
    if (!value) {
      updateParams({ subcategory: null }, null, "reload");
      return;
    }

    const nextCategory = value as Category;

    const nextSubcategory =
      currentSubcategory &&
      isValidSubcategoryForCategory(nextCategory, currentSubcategory)
        ? currentSubcategory
        : null;

    updateParams({ subcategory: nextSubcategory }, nextCategory, "reload");
  };

  return (
    <div className="mb-6 rounded-[1.5rem] border border-gray-200/70 bg-white/85 p-3 shadow-sm dark:border-dark-200 dark:bg-dark-100/85 sm:p-4">

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        <form onSubmit={handleSearch} className="relative">
          <HiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-200 dark:bg-dark dark:text-white"
          />
        </form>

        <select
          value={currentCategory || ""}
          onChange={(e) => handleCategoryChange(e.target.value)}
          aria-label="Filter by category"
          className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-200 dark:bg-dark dark:text-white"
        >
          <option value="">All Categories</option>
          {categoryConfig.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>

        <select
          value={currentSubcategory}
          onChange={(e) => updateParams({ subcategory: e.target.value || null })}
          aria-label="Filter by subcategory"
          disabled={!currentCategory}
          className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-200 dark:bg-dark dark:text-white"
        >
          <option value="">{currentCategory ? "All Subcategories" : "Select category first"}</option>
          {availableSubcategories.map((subcategory) => (
            <option key={subcategory} value={subcategory}>
              {subcategory}
            </option>
          ))}
        </select>

        <select
          value={currentSort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          aria-label="Sort products"
          className="cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-200 dark:bg-dark dark:text-white"
        >
          <option value="newest">Newest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {selectedCategory && (
        <div className="mt-3 rounded-2xl border border-primary-500/15 bg-primary-500/5 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-500 dark:bg-dark dark:text-primary-300">
              {selectedCategory.seoName}
            </span>
            {currentSubcategory ? (
              <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:border-dark-200 dark:text-gray-400">
                {currentSubcategory}
              </span>
            ) : null}
          </div>
          <p className="mt-2 leading-6">{selectedCategory.description}</p>
        </div>
      )}
    </div>
  );
}
