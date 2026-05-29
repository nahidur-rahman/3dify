import {
  categoryConfig,
  categoryDescriptions,
  categoryLabels,
  categorySeoNames,
  categorySlugs,
  categorySubcategories,
  categoryValues,
  defaultCategory,
  isCategoryValue,
  isValidSubcategoryForCategory,
} from "@/lib/categories";

// Simple class name merger utility
type ClassValue = string | number | boolean | undefined | null | ClassValue[] | Record<string, boolean | undefined | null>;

function clsx(...args: ClassValue[]): string {
  const classes: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === "string") {
      classes.push(arg);
    } else if (typeof arg === "number") {
      classes.push(String(arg));
    } else if (Array.isArray(arg)) {
      classes.push(clsx(...arg));
    } else if (typeof arg === "object") {
      for (const [key, value] of Object.entries(arg)) {
        if (value) classes.push(key);
      }
    }
  }
  return classes.join(" ");
}

export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs);
}

// Format price in BDT
export function formatPrice(price: number): string {
  return `৳${price.toLocaleString("en-BD")}`;
}

export function calculateDiscountedPrice(
  price: number,
  discountPercent: number
): number {
  const clampedDiscount = Math.min(100, Math.max(0, discountPercent));
  const discountedPrice = price * (1 - clampedDiscount / 100);
  return Math.round(discountedPrice * 100) / 100;
}

export {
  categoryConfig,
  categoryDescriptions,
  categoryLabels,
  categorySeoNames,
  categorySlugs,
  categorySubcategories,
  categoryValues,
  defaultCategory,
  isCategoryValue,
  isValidSubcategoryForCategory,
};

export function hasWhatsAppConfigured(): boolean {
  return Boolean((process.env.NEXT_PUBLIC_WHATSAPP || "").trim());
}

export function hasMessengerConfigured(): boolean {
  return Boolean((process.env.NEXT_PUBLIC_MESSENGER || "").trim());
}

// Generate WhatsApp link with pre-filled message
export function getWhatsAppLink(productName?: string, price?: number): string {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP || "";
  const message = productName
    ? `Hi! I'm interested in "${productName}"${price ? ` (Price: ৳${price})` : ""}. Is it available?`
    : "Hi! I'm interested in your 3D printed products.";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// Generate Messenger link
export function getMessengerLink(): string {
  const pageId = process.env.NEXT_PUBLIC_MESSENGER || "";
  return `https://m.me/${pageId}`;
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}
