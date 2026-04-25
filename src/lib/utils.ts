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

// Category display names
export const categoryLabels: Record<string, string> = {
  FIGURINE: "Figurines",
  PHONE_CASE: "Phone Cases",
  HOME_DECOR: "Home Decor",
  CUSTOM: "Custom Models",
};

// Category descriptions for homepage
export const categoryDescriptions: Record<string, string> = {
  FIGURINE: "Detailed figurines and character models brought to life with 3D printing",
  PHONE_CASE: "Custom designed phone cases with unique patterns and perfect fit",
  HOME_DECOR: "Beautiful decorative pieces to enhance your living space",
  CUSTOM: "Got an idea? We can bring any custom design to reality",
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
