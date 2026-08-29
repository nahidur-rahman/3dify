import type { ColorMode } from "@/lib/types";

export const PRODUCT_COLOR_OPTIONS = [
  "Black",
  "White",
  "Red",
  "Blue",
  "Cyan",
  "Yellow",
  "Green",
  "Brown",
  "Skin",
  "Silver",
  "Pink",
  "Golden",
  "Gray",
  "Orange",
  "Purple",
] as const;

function normalizeColorLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeProductColorOptions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueOptions = new Set<string>();

  for (const option of value) {
    if (typeof option !== "string") {
      continue;
    }

    const normalizedOption = normalizeColorLabel(option);
    if (normalizedOption) {
      uniqueOptions.add(normalizedOption);
    }
  }

  return [...uniqueOptions];
}

export function buildProductColorSummary(input: {
  colorMode: ColorMode;
  color?: string | null;
  colorOptions?: unknown;
}) {
  if (input.colorMode === "OPTIONS") {
    return normalizeProductColorOptions(input.colorOptions).join(", ");
  }

  return normalizeColorLabel(input.color || "");
}

export function resolveProductColorConfig(input: {
  colorMode?: unknown;
  color?: unknown;
  colorOptions?: unknown;
}) {
  const colorMode: ColorMode = input.colorMode === "OPTIONS" ? "OPTIONS" : "FIXED";
  const colorOptions =
    colorMode === "OPTIONS"
      ? normalizeProductColorOptions(input.colorOptions)
      : [];

  return {
    colorMode,
    colorOptions,
    color: buildProductColorSummary({
      colorMode,
      color: typeof input.color === "string" ? input.color : "",
      colorOptions,
    }),
  };
}