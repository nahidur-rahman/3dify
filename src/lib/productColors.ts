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

const PRODUCT_COLOR_SWATCHES: Array<{
  match: RegExp;
  background: string;
  borderColor?: string;
}> = [
  {
    match: /black|charcoal|graphite|onyx|ebony/i,
    background: "#111827",
  },
  {
    match: /white|ivory|cream/i,
    background: "#f8fafc",
    borderColor: "rgba(148, 163, 184, 0.8)",
  },
  {
    match: /red|crimson|maroon|scarlet/i,
    background: "#dc2626",
  },
  {
    match: /blue|navy|azure|royal/i,
    background: "#2563eb",
  },
  {
    match: /cyan|aqua|teal/i,
    background: "#06b6d4",
  },
  {
    match: /yellow|amber/i,
    background: "#eab308",
  },
  {
    match: /green|emerald|lime|olive/i,
    background: "#16a34a",
  },
  {
    match: /brown|chocolate|coffee|mocha/i,
    background: "#8b5e3c",
  },
  {
    match: /skin|beige|tan|nude/i,
    background: "#d6a77a",
  },
  {
    match: /silver/i,
    background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 48%, #94a3b8 100%)",
    borderColor: "rgba(148, 163, 184, 0.9)",
  },
  {
    match: /pink|rose/i,
    background: "#ec4899",
  },
  {
    match: /gold|golden/i,
    background: "linear-gradient(135deg, #fef08a 0%, #f59e0b 45%, #b45309 100%)",
    borderColor: "rgba(180, 83, 9, 0.7)",
  },
  {
    match: /gray|grey|slate/i,
    background: "#6b7280",
  },
  {
    match: /orange|coral|tangerine/i,
    background: "#f97316",
  },
  {
    match: /purple|violet|plum|lavender/i,
    background: "#7c3aed",
  },
];

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

  return Array.from(uniqueOptions);
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

export function getProductColorSwatch(colorName: string) {
  const normalizedColorName = normalizeColorLabel(colorName);
  const match = PRODUCT_COLOR_SWATCHES.find((option) =>
    option.match.test(normalizedColorName)
  );

  return {
    background: match?.background ?? "linear-gradient(135deg, #e5e7eb 0%, #cbd5e1 100%)",
    borderColor: match?.borderColor ?? "rgba(148, 163, 184, 0.35)",
  };
}