import { createHash } from "crypto";
import { getSupabaseAdmin, productImageBucket } from "@/lib/supabaseAdmin";
import type { Product, ProductSizeOption } from "@/lib/types";

const PRODUCT_FOLDER_PREFIX = "products";
const DRAFT_FOLDER_PREFIX = "draft";

function ensureFolderKey(folderKey: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(folderKey)) {
    throw new Error("Invalid folder key");
  }
}

function getExtension(fileName: string) {
  const segments = fileName.split(".");
  const ext = segments.length > 1 ? segments.pop() : "";
  return ext ? ext.toLowerCase() : "jpg";
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

async function getBlobHash(blob: Blob) {
  return hashBuffer(await blob.arrayBuffer());
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

function resolveDisplayUrl(imageRef: string) {
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
}): Product {
  return {
    ...item,
    images: uniqueStrings(item.images.map((imageRef) => resolveDisplayUrl(imageRef))),
    sizeOptions: normalizeSizeOptions(item.sizeOptions),
  } as Product;
}

export async function getImageSignatures(imageUrls: string[]) {
  const signatures = await Promise.all(
    imageUrls.map(async (imageUrl) => {
      try {
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
  if (!file.type.startsWith("image/")) {
    throw new Error(`Invalid file type: ${file.type}`);
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File too large. Max size is 5MB.");
  }

  const folderPath = getProductFolderPath(folderKey);
  const ext = getExtension(file.name);
  const fileHash = await getBlobHash(file);
  const imagePath = `${folderPath}/${fileHash}.${ext}`;
  const contentType = file.type || `image/${ext}`;

  const { error } = await getSupabaseAdmin()
    .storage.from(productImageBucket)
    .upload(imagePath, file, {
      upsert: true,
      contentType,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return buildPublicUrl(imagePath);
}

export async function deleteProductImages(imageUrls: string[]) {
  const paths = uniqueStrings(imageUrls.map((url) => normalizeStoragePath(url)));

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
  productId: string
) {
  const targetFolder = getProductFolderPath(productId);
  const supabase = getSupabaseAdmin();
  const sourcePaths = uniqueStrings(
    imageUrls.map((imageRef) => normalizeStoragePath(imageRef))
  );
  const nextPaths = [...sourcePaths];
  const copiedPaths: string[] = [];

  for (let i = 0; i < sourcePaths.length; i += 1) {
    const sourcePath = sourcePaths[i];

    if (
      !sourcePath.startsWith(`${PRODUCT_FOLDER_PREFIX}/${DRAFT_FOLDER_PREFIX}-`)
    ) {
      continue;
    }

    const fileName = sourcePath.split("/").pop();
    if (!fileName) {
      throw new Error("Invalid image path");
    }

    const destinationPath = `${targetFolder}/${fileName}`;

    const { error: copyError } = await supabase
      .storage.from(productImageBucket)
      .copy(sourcePath, destinationPath);

    if (copyError) {
      throw new Error(`Failed to move image: ${copyError.message}`);
    }

    copiedPaths.push(sourcePath);
    nextPaths[i] = destinationPath;
  }

  if (copiedPaths.length > 0) {
    const { error: removeError } = await supabase
      .storage.from(productImageBucket)
      .remove(copiedPaths);

    if (removeError) {
      throw new Error(`Failed to clean up old images: ${removeError.message}`);
    }
  }

  return nextPaths;
}
