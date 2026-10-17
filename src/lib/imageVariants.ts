// Bump the filename version whenever encoding settings change: cached URLs are immutable.
export const IMAGE_VARIANT_VERSION = "v1";
export const IMAGE_QUALITY = 80;
export const IMAGE_CACHE_SECONDS = 7_776_000; // 90 days
export const IMAGE_WIDTHS = { main: 750, card: 480, thumbnail: 128 } as const;
export type ImageVariant = keyof typeof IMAGE_WIDTHS;
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
// Leave room for multipart headers under Vercel's 4.5 MB request limit.
export const PRODUCT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

const variantPattern = /([a-f0-9]{64})\.v1-(main|card|thumbnail)\.webp(?=\?|$)/;

export function productImageVariant(src: string, variant: ImageVariant): string {
  // Legacy images and blob previews have no generated siblings; leave them alone.
  return src.replace(variantPattern, `$1.${IMAGE_VARIANT_VERSION}-${variant}.webp`);
}

export function productImageFiles(src: string): string[] {
  if (!variantPattern.test(src)) return [src];
  return (Object.keys(IMAGE_WIDTHS) as ImageVariant[]).map((variant) => productImageVariant(src, variant));
}

export function productImageSourceHash(src: string): string | undefined {
  return src.match(variantPattern)?.[1];
}
