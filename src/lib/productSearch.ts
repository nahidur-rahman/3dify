import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { hydrateProductImages } from "@/lib/productImages";
import { calculateDiscountedPrice } from "@/lib/utils";

export const MIN_PRODUCT_SEARCH_QUERY_LENGTH = 2;
export const PRODUCT_SEARCH_SUGGESTION_LIMIT = 5;
export const PRODUCT_SEARCH_CACHE_TAG = "product-search-suggestions";

export interface ProductSearchSuggestion {
  id: string;
  name: string;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  hasPriceRange: boolean;
}

function normalizeSearchQuery(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function extractSearchTokens(value: string) {
  return value.match(/[\p{L}\p{N}]+/gu) ?? [];
}

function parseSizeOptionPrices(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as number[];
  }

  return value
    .map((option) => {
      if (!option || typeof option !== "object") {
        return null;
      }

      const price = (option as { price?: unknown }).price;
      return typeof price === "number" ? price : null;
    })
    .filter((price): price is number => typeof price === "number");
}

interface ProductSearchCandidate {
  id: string;
  name: string;
  price: number;
  images: string[];
  sizeOptions: unknown;
  discountPercent: number | null;
  featured: boolean;
  updatedAt: Date;
}

function buildSuggestion(product: ProductSearchCandidate): ProductSearchSuggestion {
  const hydrated = hydrateProductImages({
    images: product.images,
    sizeOptions: product.sizeOptions,
  });
  const sizeOptionPrices = parseSizeOptionPrices(hydrated.sizeOptions);
  const startingPrice =
    sizeOptionPrices.length > 0 ? Math.min(...sizeOptionPrices) : product.price;
  const discountPercent = product.discountPercent ?? 0;

  return {
    id: product.id,
    name: product.name,
    image: hydrated.images[0] ?? null,
    price: calculateDiscountedPrice(startingPrice, discountPercent),
    compareAtPrice: discountPercent > 0 ? startingPrice : null,
    hasPriceRange: sizeOptionPrices.length > 0,
  };
}

/**
 * Simple substring-based search for suggestions.
 * All tokens from the query must appear somewhere in the product name (case-insensitive).
 * This ensures "me" matches "Helmet", "Name", "Geometric" etc.
 * Results are ranked: exact name match > name starts with query > word starts with query > contains.
 */
async function findSuggestionCandidates(normalizedQuery: string) {
  const tokens = extractSearchTokens(normalizedQuery);

  if (tokens.length === 0) {
    return [] as ProductSearchCandidate[];
  }

  // Every token must be contained in the product name (substring match)
  const candidates = await prisma.product.findMany({
    where: {
      inStock: true,
      AND: tokens.map((token) => ({
        name: { contains: token, mode: "insensitive" as const },
      })),
    },
    select: {
      id: true,
      name: true,
      price: true,
      images: true,
      sizeOptions: true,
      discountPercent: true,
      featured: true,
      updatedAt: true,
    },
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    // Fetch more than needed so we can re-rank in memory
    take: PRODUCT_SEARCH_SUGGESTION_LIMIT * 3,
  });

  // Rank results by relevance
  const scored = candidates.map((product) => {
    const lower = product.name.toLowerCase();
    let score: number;

    if (lower === normalizedQuery) {
      score = 0; // Exact match
    } else if (lower.startsWith(normalizedQuery)) {
      score = 1; // Name starts with query
    } else if (
      lower.startsWith(normalizedQuery + " ") ||
      lower.includes(" " + normalizedQuery)
    ) {
      score = 2; // Word boundary match
    } else {
      score = 3; // Substring match
    }

    return { product, score };
  });

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    // Within same relevance tier, prefer featured then newer
    if (a.product.featured !== b.product.featured) {
      return a.product.featured ? -1 : 1;
    }
    return b.product.updatedAt.getTime() - a.product.updatedAt.getTime();
  });

  return scored
    .slice(0, PRODUCT_SEARCH_SUGGESTION_LIMIT)
    .map((entry) => entry.product);
}

const getCachedProductSearchSuggestions = unstable_cache(
  async (normalizedQuery: string) => {
    const candidates = await findSuggestionCandidates(normalizedQuery);
    return candidates.map(buildSuggestion);
  },
  ["product-search-suggestions"],
  {
    revalidate: 300,
    tags: [PRODUCT_SEARCH_CACHE_TAG],
  }
);

export async function getProductSearchSuggestions(query: string) {
  const normalizedQuery = normalizeSearchQuery(query);

  if (normalizedQuery.length < MIN_PRODUCT_SEARCH_QUERY_LENGTH) {
    return [] as ProductSearchSuggestion[];
  }

  return getCachedProductSearchSuggestions(normalizedQuery);
}