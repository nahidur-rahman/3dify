import type { NameKeychainCustomization, TextDesign } from "@/lib/types";

export const TEXT_DESIGN_LIMIT = 10;
export const TEXT_DESIGN_MAX_BYTES = 1024 * 1024;
export const TEXT_DESIGN_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const PRINTED_NAME_MAX_LENGTH = 80;
export const CUSTOMIZATION_NOTES_MAX_LENGTH = 500;

export function isNameKeychain(product: { category?: string; subcategory?: string | null }) {
  return product.category === "KEYCHAINS" && product.subcategory === "Name Keychains";
}

export function parseTextDesigns(value: unknown): TextDesign[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const { id, label, image } = entry as Record<string, unknown>;
    return typeof id === "string" && typeof label === "string" && typeof image === "string"
      ? [{ id, label, image }] : [];
  });
}

export function getCustomization(value: unknown): NameKeychainCustomization | undefined {
  if (!value || typeof value !== "object") return undefined;
  const entry = value as Record<string, unknown>;
  if (typeof entry.printedName !== "string" || typeof entry.baseColor !== "string" || typeof entry.textColor !== "string") return undefined;
  return {
    printedName: entry.printedName.trim(),
    baseColor: entry.baseColor.trim(),
    textColor: entry.textColor.trim(),
    ...(typeof entry.designId === "string" ? { designId: entry.designId } : {}),
    ...(typeof entry.designLabel === "string" ? { designLabel: entry.designLabel } : {}),
    ...(typeof entry.notes === "string" && entry.notes.trim() ? { notes: entry.notes.trim() } : {}),
  };
}

export function customizationDetails(value: unknown): string[] {
  const customization = getCustomization(value);
  if (!customization) return [];
  return [
    `Name: ${customization.printedName}`,
    `Base: ${customization.baseColor} · Text: ${customization.textColor}`,
    ...(customization.designLabel ? [`Design: ${customization.designLabel}`] : []),
    ...(customization.notes ? [`Instructions: ${customization.notes}`] : []),
  ];
}
