"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import {
  buildCatalogUrl,
  getCategoryPath,
  type Category,
} from "@/lib/categories";
import { PRODUCT_CATALOG_PAGE_SIZE } from "@/lib/productCatalogConfig";
import { getPaginationItems } from "@/lib/pagination";
import type { ProductCardProduct, ProductsResponse } from "@/lib/types";

const AUTOMATIC_LOAD_LIMIT = 2;

interface ProductCatalogResultsProps {
  initialProducts: ProductCardProduct[];
  total: number;
  totalPages: number;
  currentPage: number;
  search: string;
  sort: string;
  activeCategory: Category | null;
  activeSubcategory: string;
}

export default function ProductCatalogResults({
  initialProducts,
  total,
  totalPages,
  currentPage,
  search,
  sort,
  activeCategory,
  activeSubcategory,
}: ProductCatalogResultsProps) {
  const [products, setProducts] = useState(initialProducts);
  const [loadedThroughPage, setLoadedThroughPage] = useState(currentPage);
  const [knownTotal, setKnownTotal] = useState(total);
  const [knownTotalPages, setKnownTotalPages] = useState(totalPages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const automaticLoads = useRef(0);
  const loadingRef = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const hasMore = loadedThroughPage < knownTotalPages;
  const rangeStart = knownTotal > 0
    ? (currentPage - 1) * PRODUCT_CATALOG_PAGE_SIZE + 1
    : 0;
  const rangeEnd = knownTotal > 0
    ? Math.min(rangeStart + products.length - 1, knownTotal)
    : 0;
  const paginationItems = useMemo(
    () => getPaginationItems(currentPage, knownTotalPages),
    [currentPage, knownTotalPages]
  );

  const buildPageUrl = useCallback(
    (page: number) =>
      buildCatalogUrl({
        category: activeCategory,
        search,
        sort,
        subcategory: activeSubcategory || null,
        page,
      }),
    [activeCategory, activeSubcategory, search, sort]
  );

  const loadMore = useCallback(
    async (automatic = false) => {
      if (loadingRef.current || loadedThroughPage >= knownTotalPages) return;
      if (automatic && automaticLoads.current >= AUTOMATIC_LOAD_LIMIT) return;

      loadingRef.current = true;
      if (automatic) automaticLoads.current += 1;
      setLoading(true);
      setError("");

      const controller = new AbortController();
      requestController.current = controller;
      const nextPage = loadedThroughPage + 1;
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(PRODUCT_CATALOG_PAGE_SIZE),
        sort,
      });

      if (activeCategory) params.set("category", activeCategory);
      if (activeSubcategory) params.set("subcategory", activeSubcategory);
      if (search) params.set("search", search);
      const cursor = products[products.length - 1]?.id;
      if (cursor) params.set("cursor", cursor);

      try {
        const response = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load more products");
        }

        const data: ProductsResponse = await response.json();
        setProducts((currentProducts) => {
          const existingIds = new Set(
            currentProducts.map((product) => product.id)
          );
          const newProducts = data.products.filter(
            (product) => !existingIds.has(product.id)
          );

          return [...currentProducts, ...newProducts];
        });
        setLoadedThroughPage(nextPage);
        setKnownTotal(data.pagination.total);
        setKnownTotalPages(data.pagination.totalPages);
      } catch (loadError) {
        if ((loadError as Error).name !== "AbortError") {
          setError("More products could not be loaded. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    }, [
      activeCategory,
      activeSubcategory,
      knownTotalPages,
      loadedThroughPage,
      products,
      search,
      sort,
    ]
  );

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore || automaticLoads.current >= AUTOMATIC_LOAD_LIMIT) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore(true);
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(
    () => () => {
      requestController.current?.abort();
    },
    []
  );

  return (
    <>
      <ProductGrid
        products={products}
        resetHref={activeCategory ? getCategoryPath(activeCategory) : "/products"}
        variant="storefrontCatalog"
      />

      {knownTotal > 0 ? (
        <p
          className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400"
          aria-live="polite"
        >
          Showing {rangeStart}–{rangeEnd} of {knownTotal} products
        </p>
      ) : null}

      {hasMore ? (
        <div ref={loadMoreRef} className="mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => void loadMore(false)}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? "Loading more…" : "Load more products"}
          </button>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : products.length > 0 ? (
        <p className="mt-4 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
          You’ve reached the end
        </p>
      ) : null}

      {knownTotalPages > 1 ? (
        <nav
          className="mt-7 flex flex-wrap items-center justify-center gap-1.5"
          aria-label="Product catalog pages"
        >
          {currentPage > 1 ? (
            <Link
              href={buildPageUrl(currentPage - 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-primary-500 hover:text-primary-600 dark:border-dark-200 dark:text-gray-300"
            >
              Previous
            </Link>
          ) : null}

          {paginationItems.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="px-1.5 text-gray-400"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <Link
                key={item}
                href={buildPageUrl(item)}
                aria-current={item === currentPage ? "page" : undefined}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${
                  item === currentPage
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-primary-500/10 hover:text-primary-500 dark:bg-dark-100 dark:text-gray-400"
                }`}
              >
                {item}
              </Link>
            )
          )}

          {currentPage < knownTotalPages ? (
            <Link
              href={buildPageUrl(currentPage + 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-primary-500 hover:text-primary-600 dark:border-dark-200 dark:text-gray-300"
            >
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
