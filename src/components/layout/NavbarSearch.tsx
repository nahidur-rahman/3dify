"use client";

import Image from "next/image";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { HiOutlineSearch, HiSearch } from "react-icons/hi";
import { formatPrice } from "@/lib/utils";

interface ProductSearchSuggestion {
  id: string;
  name: string;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  hasPriceRange: boolean;
}

interface NavbarSearchProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

interface CachedSuggestionsEntry {
  suggestions: ProductSearchSuggestion[];
  expiresAt: number;
}

const MIN_QUERY_LENGTH = 2;
const REQUEST_DEBOUNCE_MS = 350;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 40;

function normalizeQuery(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildSearchHref(query: string) {
  const normalizedQuery = normalizeQuery(query);

  if (!normalizedQuery) {
    return "/products";
  }

  const params = new URLSearchParams({ search: normalizedQuery });
  return `/products?${params.toString()}`;
}

export default function NavbarSearch({
  mobile = false,
  onNavigate,
}: NavbarSearchProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLFormElement>(null);
  const cacheRef = useRef(new Map<string, CachedSuggestionsEntry>());
  const debounceRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductSearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [, startTransition] = useTransition();

  const normalizedQuery = normalizeQuery(query);
  const normalizedCacheKey = normalizedQuery.toLowerCase();
  const searchHref = buildSearchHref(normalizedQuery);

  useEffect(() => {
    if (!pathname.startsWith("/products")) {
      return;
    }

    const urlSearch = normalizeQuery(searchParams.get("search") || "");
    setQuery((currentQuery) =>
      currentQuery === urlSearch ? currentQuery : urlSearch
    );
  }, [pathname, searchParams]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (normalizedQuery.length < MIN_QUERY_LENGTH) {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setSuggestions([]);
      return;
    }

    const cachedEntry = cacheRef.current.get(normalizedCacheKey);
    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      setSuggestions(cachedEntry.suggestions);
      setIsLoading(false);
      return;
    }

    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsLoading(true);

    debounceRef.current = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/products/suggestions?q=${encodeURIComponent(normalizedQuery)}`,
          {
            signal: controller.signal,
            headers: { accept: "application/json" },
          }
        );

        if (!response.ok) {
          throw new Error(`Suggestion request failed: ${response.status}`);
        }

        const data = (await response.json()) as {
          suggestions?: ProductSearchSuggestion[];
        };
        const nextSuggestions = Array.isArray(data.suggestions)
          ? data.suggestions
          : [];

        if (controller.signal.aborted) {
          return;
        }

        cacheRef.current.set(normalizedCacheKey, {
          suggestions: nextSuggestions,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });

        if (cacheRef.current.size > MAX_CACHE_ENTRIES) {
          const oldestKey = cacheRef.current.keys().next().value;
          if (oldestKey) {
            cacheRef.current.delete(oldestKey);
          }
        }

        setSuggestions(nextSuggestions);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }

        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }

        debounceRef.current = null;
      }
    }, REQUEST_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      controller.abort();
    };
  }, [normalizedCacheKey, normalizedQuery]);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }

      abortControllerRef.current?.abort();
    };
  }, []);

  function handleNavigate() {
    setIsOpen(false);
    onNavigate?.();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleNavigate();

    startTransition(() => {
      router.push(searchHref);
    });
  }

  const wrapperClasses = mobile
    ? "flex w-full overflow-hidden rounded-xl border border-gray-300 bg-gray-50 transition-all focus-within:border-primary-800 focus-within:ring-2 focus-within:ring-primary-800/25 dark:border-gray-700 dark:bg-dark-100 dark:focus-within:ring-primary-700/25"
    : "flex w-full overflow-hidden rounded-full border border-gray-300 bg-gray-50 transition-all focus-within:border-primary-800 focus-within:ring-2 focus-within:ring-primary-800/25 dark:border-gray-700 dark:bg-dark-100 dark:focus-within:ring-primary-700/25";
  const inputClasses = mobile
    ? "w-full min-w-0 bg-transparent px-4 py-2.5 text-sm text-gray-900 outline-none placeholder-gray-500 dark:text-gray-100"
    : "w-full min-w-0 bg-transparent px-5 py-2.5 text-sm text-gray-900 outline-none placeholder-gray-500 dark:text-gray-100";
  const buttonClasses = mobile
    ? "flex flex-shrink-0 items-center justify-center bg-primary-800 px-4 text-white transition-colors disabled:opacity-70 dark:bg-primary-700"
    : "flex flex-shrink-0 items-center justify-center px-4 text-gray-500 transition-colors hover:text-primary-800 disabled:opacity-70 dark:hover:text-primary-400";
  const dropdownClasses = mobile
    ? "absolute inset-x-0 top-[calc(100%+0.5rem)] z-[80] overflow-hidden rounded-[1.5rem] border border-gray-200/80 bg-white/95 p-2 shadow-2xl backdrop-blur dark:border-dark-200 dark:bg-dark/95"
    : "absolute inset-x-0 top-[calc(100%+0.75rem)] z-[80] overflow-hidden rounded-[1.5rem] border border-gray-200/80 bg-white/95 p-2 shadow-2xl backdrop-blur dark:border-dark-200 dark:bg-dark/95";

  return (
    <form ref={rootRef} onSubmit={handleSubmit} className="relative w-full">
      <div className={wrapperClasses}>
        <input
          type="text"
          role="combobox"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (!isOpen) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (normalizedQuery.length >= MIN_QUERY_LENGTH) {
              setIsOpen(true);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
              event.currentTarget.blur();
            }
          }}
          placeholder={mobile ? "Search products..." : "Search..."}
          aria-label="Search products"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={isOpen && normalizedQuery.length >= MIN_QUERY_LENGTH}
          aria-controls={mobile ? "mobile-search-suggestions" : "desktop-search-suggestions"}
          className={inputClasses}
        />
        <button
          type="submit"
          aria-label="Search"
          disabled={isLoading && !normalizedQuery}
          className={buttonClasses}
        >
          {isLoading && normalizedQuery.length >= MIN_QUERY_LENGTH ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <HiSearch className="h-5 w-5" />
          )}
        </button>
      </div>

      {isOpen && normalizedQuery.length >= MIN_QUERY_LENGTH ? (
        <div
          id={mobile ? "mobile-search-suggestions" : "desktop-search-suggestions"}
          role="listbox"
          className={dropdownClasses}
        >
          <div className="max-h-[24rem] overflow-y-auto">
            {suggestions.map((suggestion) => (
              <Link
                key={suggestion.id}
                href={`/products/${suggestion.id}`}
                onClick={handleNavigate}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-dark-100"
              >
                <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-dark-200">
                  {suggestion.image ? (
                    <Image
                      src={suggestion.image}
                      alt={suggestion.name}
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500">
                      <HiOutlineSearch className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {suggestion.name}
                  </p>
                </div>

                <div className="flex flex-col items-end text-right">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {suggestion.hasPriceRange ? "From " : ""}
                    {formatPrice(suggestion.price)}
                  </span>
                  {suggestion.compareAtPrice ? (
                    <span className="text-xs text-gray-400 line-through dark:text-gray-500">
                      {formatPrice(suggestion.compareAtPrice)}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}

            {!isLoading && suggestions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                No matching products found.
              </div>
            ) : null}
          </div>

          <Link
            href={searchHref}
            onClick={handleNavigate}
            className="mt-2 flex items-center justify-center rounded-2xl bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:bg-dark dark:text-gray-200 dark:hover:bg-dark-200 dark:hover:text-white"
          >
            View all matching products
          </Link>
        </div>
      ) : null}
    </form>
  );
}