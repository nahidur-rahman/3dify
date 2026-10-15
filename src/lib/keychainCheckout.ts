import { z } from "zod";
import { CUSTOMIZATION_NOTES_MAX_LENGTH, isNameKeychain, parseTextDesigns, PRINTED_NAME_MAX_LENGTH } from "@/lib/nameKeychain";
import type { NameKeychainCustomization } from "@/lib/types";

export const checkoutCustomizationSchema = z.object({
  printedName: z.string().trim().min(1, "Enter the name to print").max(PRINTED_NAME_MAX_LENGTH),
  baseColor: z.string().trim().max(200),
  textColor: z.string().trim().max(200),
  designId: z.string().trim().min(1).max(100).optional(),
  notes: z.string().trim().max(CUSTOMIZATION_NOTES_MAX_LENGTH).optional(),
});

export class KeychainSelectionError extends Error {}

export function resolveCheckoutCustomization(product: {
  name: string; category?: string; subcategory?: string | null; colorMode: string;
  baseColor: string; textColor: string; baseColorOptions: string[]; textColorOptions: string[]; textDesigns: unknown;
}, input?: z.infer<typeof checkoutCustomizationSchema>): NameKeychainCustomization | undefined {
  if (!isNameKeychain(product)) return undefined;
  if (!input?.printedName.trim()) {
    throw new KeychainSelectionError(`Enter a name to print for "${product.name}". Please remove it from your cart and add it again with your customization.`);
  }
  const colors: { baseColor: string; textColor: string } = { baseColor: "", textColor: "" };
  for (const part of ["base", "text"] as const) {
    const field = `${part}Color` as const;
    const color = product.colorMode === "OPTIONS"
      ? product[`${part}ColorOptions`].find((option) => option.trim() === input[field])?.trim()
      : product[field].trim();
    if (!color) throw new KeychainSelectionError(`The selected ${part} color for "${product.name}" is no longer available. Please remove it from your cart and select it again.`);
    colors[field] = color;
  }
  const designs = parseTextDesigns(product.textDesigns);
  const design = designs.find((entry) => entry.id === input.designId);
  if ((designs.length && !design) || (input.designId && !design)) {
    throw new KeychainSelectionError(`The selected text design for "${product.name}" is no longer available. Please remove it from your cart and select it again.`);
  }
  return { printedName: input.printedName.trim(), ...colors,
    ...(design ? { designId: design.id, designLabel: design.label } : {}),
    ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
  };
}
