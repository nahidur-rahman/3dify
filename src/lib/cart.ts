import { getCustomization } from "@/lib/nameKeychain";
import type { NameKeychainCustomization } from "@/lib/types";

export interface CartIdentity {
  productId: string;
  selectedSize?: string;
  color?: string;
  customization?: NameKeychainCustomization;
}

export function getCartKey(item: CartIdentity): string {
  const customization = getCustomization(item.customization);
  return JSON.stringify([
    item.productId, item.selectedSize || "", item.color || "",
    ...(customization ? [customization.printedName, customization.baseColor,
      customization.textColor, customization.designId || "", customization.notes || ""] : []),
  ]);
}
