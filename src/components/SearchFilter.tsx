"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { HiSearch } from "react-icons/hi";
import { categoryLabels } from "@/lib/utils";

export default function SearchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "newest";

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page"); // Reset page on filter change
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams("search", search);
  };

  return (
    <div className="mb-8 rounded-[1.75rem] border border-gray-200/70 bg-white/85 p-4 shadow-sm dark:border-dark-200 dark:bg-dark-100/85 sm:p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Find the right print</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Search by name, narrow by category, or sort by price.</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <form onSubmit={handleSearch} className="relative flex-1">
          <HiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-200 dark:bg-dark dark:text-white"
          />
        </form>

        <select
          value={currentCategory}
          onChange={(e) => updateParams("category", e.target.value)}
          aria-label="Filter by category"
          className="cursor-pointer rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-200 dark:bg-dark dark:text-white"
        >
          <option value="">All Categories</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={currentSort}
          onChange={(e) => updateParams("sort", e.target.value)}
          aria-label="Sort products"
          className="cursor-pointer rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-dark-200 dark:bg-dark dark:text-white"
        >
          <option value="newest">Newest First</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
}
