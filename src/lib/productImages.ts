import { createHash } from "crypto";
import { getSupabaseAdmin, productImageBucket } from "@/lib/supabaseAdmin";
import { normalizeProductColorOptions } from "@/lib/productColors";
import type { Product, ProductSizeOption, TextDesign } from "@/lib/types";
import { parseTextDesigns } from "@/lib/nameKeychain";
import { optimizeProductImage } from "@/lib/optimizeProductImage";
import { IMAGE_CACHE_SECONDS, IMAGE_VARIANT_VERSION, PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES, productImageFiles, productImageSourceHash } from "@/lib/imageVariants";

const PRODUCT_FOLDER_PREFIX = "products";
const DRAFT_FOLDER_PREFIX = "draft";

function ensureFolderKey(folderKey: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(folderKey)) {
    throw new Error("Invalid folder key");
  }
}

function buildPublicUrl(path: string) {
  const { data } = getSupabaseAdmin()
    .storage.from(productImageBucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

export function getProductImageLimit() {
  const rawLimit = process.env.PRODUCT_IMAGE_LIMIT?.trim();
  if (!rawLimit) return null;

  const parsedLimit = Number.parseInt(rawLimit, 10);
  return Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : null;
}

function hashBuffer(buffer: ArrayBuffer) {
  return createHash("sha256").update(new Uint8Array(buffer)).digest("hex");
}

async function getRemoteImageHash(imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }

  return hashBuffer(await response.arrayBuffer());
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value)))
  );
}

function normalizeStoragePath(imageRef: string) {
  const trimmed = imageRef.trim();
  if (!trimmed) return null;

  if (isUrlInBucket(trimmed)) {
    return extractStoragePathFromUrl(trimmed);
  }

  return trimmed.replace(/^\/+/, "") || null;
}

export function resolveStorageImageUrl(imageRef: string) {
  if (isUrlInBucket(imageRef)) {
    return imageRef;
  }

  const storagePath = normalizeStoragePath(imageRef);
  return storagePath ? buildPublicUrl(storagePath) : imageRef;
}

function normalizeSizeOptions(
  sizeOptions: unknown
): ProductSizeOption[] | undefined {
  if (!Array.isArray(sizeOptions)) return undefined;

  const normalized = sizeOptions
    .map((option) => {
      if (!option || typeof option !== "object") return null;

      const label = (option as { label?: unknown }).label;
      const price = (option as { price?: unknown }).price;

      if (typeof label !== "string" || typeof price !== "number") {
        return null;
      }

      return { label, price };
    })
    .filter((option): option is ProductSizeOption => Boolean(option));

  return normalized.length > 0 ? normalized : undefined;
}

export function hydrateProductImages(item: {
  images: string[];
  sizeOptions?: unknown;
  colorOptions?: unknown;
  textDesigns?: unknown;
}): Product {
  return {
    ...item,
    images: uniqueStrings(
      item.images.map((imageRef) => resolveStorageImageUrl(imageRef))
    ),
    sizeOptions: normalizeSizeOptions(item.sizeOptions),
    colorOptions: normalizeProductColorOptions(item.colorOptions),
    textDesigns: parseTextDesigns(item.textDesigns).map((design) => ({
      ...design, image: resolveStorageImageUrl(design.image),
    })),
  } as Product;
}

export async function getImageSignatures(imageUrls: string[]) {
  const signatures = await Promise.all(
    imageUrls.map(async (imageUrl) => {
      try {
        // Filenames retain the source hash, so client-side duplicate detection
        // still matches the original upload after the stored bytes are compressed.
        const sourceHash = productImageSourceHash(imageUrl);
        if (sourceHash) return sourceHash;
        return await getRemoteImageHash(imageUrl);
      } catch {
        return null;
      }
    })
  );

  return signatures.filter((signature): signature is string => Boolean(signature));
}

export function normalizeProductImages(imageRefs: string[]) {
  return uniqueStrings(imageRefs.map((imageRef) => normalizeStoragePath(imageRef)));
}

export function productMediaRefs(product: { images: string[]; textDesigns?: unknown }) {
  return normalizeProductImages([...product.images, ...parseTextDesigns(product.textDesigns).map((design) => design.image)]);
}

export async function finalizeProductMedia(
  images: string[],
  designs: TextDesign[],
  productId: string,
  existingRefs: string[] = []
) {
  const refs = productMediaRefs({ images, textDesigns: designs });
  const finalized = await moveDraftImagesToProductFolder(refs, productId, existingRefs);
  const mapping = new Map(refs.map((ref, index) => [ref, finalized[index]]));
  const resolve = (ref: string) => mapping.get(normalizeProductImages([ref])[0])!;
  return { images: images.map(resolve), textDesigns: designs.map((design) => ({ ...design, image: resolve(design.image) })) };
}

export function getProductFolderPath(folderKey: string) {
  ensureFolderKey(folderKey);
  return `${PRODUCT_FOLDER_PREFIX}/${folderKey}`;
}

export function createDraftFolderKey() {
  return `${DRAFT_FOLDER_PREFIX}-${crypto.randomUUID()}`;
}

function isDraftStoragePath(storagePath: string) {
  return storagePath.startsWith(
    `${PRODUCT_FOLDER_PREFIX}/${DRAFT_FOLDER_PREFIX}-`
  );
}

function isUrlInBucket(url: string) {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${productImageBucket}/`;
    return parsed.pathname.includes(marker);
  } catch {
    return false;
  }
}

function extractStoragePathFromUrl(url: string) {
  if (!isUrlInBucket(url)) return null;

  const parsed = new URL(url);
  const marker = `/storage/v1/object/public/${productImageBucket}/`;
  const index = parsed.pathname.indexOf(marker);
  if (index === -1) return null;

  const encodedPath = parsed.pathname.slice(index + marker.length);
  const path = decodeURIComponent(encodedPath);
  return path || null;
}

export async function uploadProductImage(file: File, folderKey: string) {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}`);
  }

  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new Error("File too large. Max size is 4MB.");
  }

  const folderPath = getProductFolderPath(folderKey);
  const input = await file.arrayBuffer();
  const fileHash = hashBuffer(input);
  const variants = await optimizeProductImage(Buffer.from(input));
  const uploaded: string[] = [];
  const storage = getSupabaseAdmin().storage.from(productImageBucket);
  try {
    for (const { variant, data } of variants) {
      const path = `${folderPath}/${fileHash}.${IMAGE_VARIANT_VERSION}-${variant}.webp`;
      const { error } = await storage.upload(path, data, {
        upsert: false, contentType: "image/webp", cacheControl: String(IMAGE_CACHE_SECONDS),
      });
      // An identical source has the same immutable variant URLs; reuse it.
      if (error && !("status" in error && error.status === 409)) {
        throw new Error(`Upload failed: ${error.message}`);
      }
      if (!error) uploaded.push(path);
    }
  } catch (error) {
    if (uploaded.length) await storage.remove(uploaded);
    throw error;
  }
  return buildPublicUrl(`${folderPath}/${fileHash}.${IMAGE_VARIANT_VERSION}-main.webp`);
}

export async function deleteProductImages(imageUrls: string[]) {
  const paths = uniqueStrings(imageUrls.flatMap((url) => productImageFiles(normalizeStoragePath(url) || "")));

  if (paths.length === 0) return;

  const { error } = await getSupabaseAdmin()
    .storage.from(productImageBucket)
    .remove(paths);

  if (error) {
    throw new Error(`Failed to delete images: ${error.message}`);
  }
}

export async function moveDraftImagesToProductFolder(
  imageUrls: string[],
  productId: string,
  existingImageRefs: string[] = []
) {
  const targetFolder = getProductFolderPath(productId);
  const supabase = getSupabaseAdmin();
  const sourcePaths = uniqueStrings(
    imageUrls.map((imageRef) => normalizeStoragePath(imageRef))
  );
  const nextPaths = [...sourcePaths];
  const draftSourcePaths = sourcePaths.filter(isDraftStoragePath);
  const copiedPaths: string[] = [];
  const existingPaths = new Set(normalizeProductImages(existingImageRefs));

  try {
    for (let i = 0; i < sourcePaths.length; i += 1) {
      const sourcePath = sourcePaths[i];

      if (!isDraftStoragePath(sourcePath)) {
        continue;
      }

      const fileName = sourcePath.split("/").pop();
      if (!fileName) {
        throw new Error("Invalid image path");
      }

      const destinationPath = `${targetFolder}/${fileName}`;

      // Content-addressed uploads may reuse an image already saved on this product.
      if (existingPaths.has(destinationPath)) {
        nextPaths[i] = destinationPath;
        continue;
      }

      const sourceFiles = productImageFiles(sourcePath);
      const destinationFiles = productImageFiles(destinationPath);
      for (let index = 0; index < sourceFiles.length; index += 1) {
        const { error: copyError } = await supabase.storage.from(productImageBucket)
          .copy(sourceFiles[index], destinationFiles[index]);
        if (copyError) {
          throw new Error(`Failed to move image: ${copyError.message}`);
        }
        copiedPaths.push(destinationFiles[index]);
      }
      nextPaths[i] = destinationPath;
    }
  } catch (error) {
    const cleanupPaths = uniqueStrings([...draftSourcePaths.flatMap(productImageFiles), ...copiedPaths]);

    if (cleanupPaths.length > 0) {
      try {
        const { error } = await supabase.storage.from(productImageBucket).remove(cleanupPaths);
        if (error) throw error;
      } catch (cleanupError) {
        console.error(
          "Failed to clean up draft images after move failure:",
          cleanupError
        );
      }
    }

    throw error;
  }

  if (draftSourcePaths.length > 0) {
    const { error: removeError } = await supabase
      .storage.from(productImageBucket)
      .remove(uniqueStrings(draftSourcePaths.flatMap(productImageFiles)));

    if (removeError) {
      throw new Error(`Failed to clean up old images: ${removeError.message}`);
    }
  }

  return nextPaths;
}
