import sharp from "sharp";
import { IMAGE_QUALITY, IMAGE_WIDTHS, type ImageVariant } from "@/lib/imageVariants";

export async function optimizeProductImage(input: Buffer) {
  const image = sharp(input, { limitInputPixels: 50_000_000, failOn: "warning" });
  let metadata: sharp.Metadata;
  try {
    metadata = await image.metadata();
  } catch {
    throw new Error("Invalid image: unable to decode this file. Use JPEG, PNG, WebP or AVIF.");
  }
  if (!metadata.format || !["jpeg", "png", "webp", "avif", "heif"].includes(metadata.format)
    || (metadata.pages ?? 1) > 1) {
    throw new Error("Invalid image: use a still JPEG, PNG, WebP or AVIF image.");
  }

  const variants = [];
  // Encode sequentially to bound memory/CPU during admin uploads.
  for (const variant of Object.keys(IMAGE_WIDTHS) as ImageVariant[]) {
    let data: Buffer;
    try {
      data = await image.clone().rotate().resize({
        width: IMAGE_WIDTHS[variant], height: IMAGE_WIDTHS[variant],
        fit: "inside", withoutEnlargement: true,
      }).webp({ quality: IMAGE_QUALITY, alphaQuality: 100, effort: 6, smartSubsample: true }).toBuffer();
    } catch {
      throw new Error("Invalid image: this file could not be resized. Try exporting it again.");
    }
    // Stay below the existing bucket's 2 MiB object limit without crushing image quality.
    if (data.length > 2 * 1024 * 1024) {
      throw new Error("Invalid image: optimized file is still too large. Try a smaller source image.");
    }
    variants.push({ variant, data });
  }
  return variants;
}
