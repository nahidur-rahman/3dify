"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import { getCategoryPath, type Category } from "@/lib/categories";
import { PRODUCT_CATALOG_PAGE_SIZE } from "@/lib/productCatalogConfig";
import type { ProductCardProduct, ProductsResponse } from "@/lib/types";

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
  const [automaticLoadingAvailable, setAutomaticLoadingAvailable] =
    useState(true);
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

  const loadMore = useCallback(
    async () => {
      if (loadingRef.current || loadedThroughPage >= knownTotalPages) return;

      loadingRef.current = true;
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
    if (!target || !hasMore || loading || error) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      setAutomaticLoadingAvailable(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [error, hasMore, loadMore, loading]);

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
        <div
          ref={loadMoreRef}
          className="mt-4 flex min-h-12 flex-col items-center justify-center gap-2"
          aria-live="polite"
        >
          {loading ? (
            <div
              className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400"
              role="status"
            >
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              Loading more products…
            </div>
          ) : error ? (
            <>
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
              <button
                type="button"
                onClick={() => void loadMore()}
                className="rounded-full bg-primary-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
              >
                Try again
              </button>
            </>
          ) : !automaticLoadingAvailable ? (
            <button
              type="button"
              onClick={() => void loadMore()}
              className="rounded-full bg-primary-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
            >
              Load more products
            </button>
          ) : (
            <span className="sr-only">More products load as you scroll.</span>
          )}
        </div>
      ) : products.length > 0 ? (
        <p className="mt-4 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
          You’ve reached the end
        </p>
      ) : null}
    </>
  );
}
