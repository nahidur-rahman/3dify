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
    images: item.images.map((imageRef) => resolveDisplayUrl(imageRef)),
    sizeOptions: normalizeSizeOptions(item.sizeOptions),
  } as Product;
}

export function normalizeProductImages(imageRefs: string[]) {
  return imageRefs
    .map((imageRef) => normalizeStoragePath(imageRef))
    .filter((imageRef): imageRef is string => Boolean(imageRef));
}

export function getProductFolderPath(folderKey: string) {
  ensureFolderKey(folderKey);
  return `${PRODUCT_FOLDER_PREFIX}/${folderKey}`;
}

export function createDraftFolderKey() {
  return `${DRAFT_FOLDER_PREFIX}-${crypto.randomUUID()}`;
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
  const imagePath = `${folderPath}/${crypto.randomUUID()}.${ext}`;
  const contentType = file.type || `image/${ext}`;

  const { error } = await getSupabaseAdmin()
    .storage.from(productImageBucket)
    .upload(imagePath, file, {
      upsert: false,
      contentType,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return buildPublicUrl(imagePath);
}

export async function deleteProductImages(imageUrls: string[]) {
  const paths = imageUrls
    .map((url) => normalizeStoragePath(url))
    .filter((path): path is string => Boolean(path));

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
  const nextPaths = imageUrls
    .map((imageRef) => normalizeStoragePath(imageRef))
    .filter((path): path is string => Boolean(path));
  const copiedPaths: string[] = [];

  for (let i = 0; i < imageUrls.length; i += 1) {
    const imageUrl = imageUrls[i];
    const sourcePath = normalizeStoragePath(imageUrl);

    if (!sourcePath || !sourcePath.startsWith(`${PRODUCT_FOLDER_PREFIX}/${DRAFT_FOLDER_PREFIX}-`)) {
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
