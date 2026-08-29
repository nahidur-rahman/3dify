import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { hydrateProductImages } from "@/lib/productImages";
import { calculateDiscountedPrice } from "@/lib/utils";

export const MIN_PRODUCT_SEARCH_QUERY_LENGTH = 2;
export const PRODUCT_SEARCH_SUGGESTION_LIMIT = 8;
export const PRODUCT_SEARCH_CACHE_TAG = "product-search-suggestions";

const PRODUCT_SEARCH_CANDIDATE_LIMIT = 24;

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

function buildPrefixTsQuery(value: string) {
  const tokens = extractSearchTokens(value);

  if (tokens.length === 0) {
    return "";
  }

  return tokens.map((token) => `${token}:*`).join(" & ");
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

function uniqueCandidates(candidates: ProductSearchCandidate[]) {
  const byId = new Map<string, ProductSearchCandidate>();

  for (const candidate of candidates) {
    if (!byId.has(candidate.id)) {
      byId.set(candidate.id, candidate);
    }
  }

  return [...byId.values()];
}

async function findPrimaryCandidates(normalizedQuery: string) {
  const tsQuery = buildPrefixTsQuery(normalizedQuery);

  if (!tsQuery) {
    return [] as ProductSearchCandidate[];
  }

  try {
    return await prisma.$queryRaw<ProductSearchCandidate[]>`
      SELECT
        id,
        name,
        price,
        images,
        "sizeOptions",
        "discountPercent",
        featured,
        "updatedAt"
      FROM "products"
      WHERE "inStock" = true
        AND to_tsvector('simple', coalesce(name, '')) @@ to_tsquery('simple', ${tsQuery})
      ORDER BY
        CASE
          WHEN lower(name) = ${normalizedQuery} THEN 0
          WHEN lower(name) LIKE ${`${normalizedQuery}%`} THEN 1
          WHEN lower(name) LIKE ${`% ${normalizedQuery}%`} THEN 2
          ELSE 3
        END,
        ts_rank_cd(
          to_tsvector('simple', coalesce(name, '')),
          to_tsquery('simple', ${tsQuery})
        ) DESC,
        featured DESC,
        "updatedAt" DESC
      LIMIT ${PRODUCT_SEARCH_CANDIDATE_LIMIT}
    `;
  } catch {
    return [];
  }
}

async function findFallbackCandidates(
  normalizedQuery: string,
  excludedIds: string[]
) {
  const tokens = extractSearchTokens(normalizedQuery);

  if (tokens.length === 0) {
    return [] as ProductSearchCandidate[];
  }

  return prisma.product.findMany({
    where: {
      inStock: true,
      ...(excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {}),
      AND: tokens.map((token) => ({
        name: { contains: token, mode: "insensitive" },
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
    take: PRODUCT_SEARCH_SUGGESTION_LIMIT,
  });
}

const getCachedProductSearchSuggestions = unstable_cache(
  async (normalizedQuery: string) => {
    const primaryCandidates = await findPrimaryCandidates(normalizedQuery);
    const fallbackCandidates =
      primaryCandidates.length >= PRODUCT_SEARCH_SUGGESTION_LIMIT
        ? []
        : await findFallbackCandidates(
            normalizedQuery,
            primaryCandidates.map((candidate) => candidate.id)
          );

    return uniqueCandidates([...primaryCandidates, ...fallbackCandidates])
      .slice(0, PRODUCT_SEARCH_SUGGESTION_LIMIT)
      .map(buildSuggestion);
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