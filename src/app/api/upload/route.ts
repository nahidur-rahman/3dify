import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createDraftFolderKey,
  getProductImageLimit,
  uploadProductImage,
} from "@/lib/productImages";

function getUploadErrorCode(message: string) {
  if (message === "Unauthorized") return "UNAUTHORIZED";
  if (message === "No files provided") return "NO_FILES";
  if (message === "Invalid folder key") return "INVALID_FOLDER_KEY";
  if (message.startsWith("Invalid file type")) return "INVALID_FILE_TYPE";
  if (message.includes("Max size")) return "FILE_TOO_LARGE";
  if (message.startsWith("Upload failed:")) return "STORAGE_UPLOAD_FAILED";
  return "UPLOAD_FAILED";
}

// POST /api/upload — upload product images (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const providedFolderKey = formData.get("folderKey");

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const imageLimit = getProductImageLimit();
    if (imageLimit !== null && files.length > imageLimit) {
      return NextResponse.json(
        {
          error: `Image limit reached. Maximum ${imageLimit} images per upload.`,
        },
        { status: 400 }
      );
    }

    const folderKey =
      typeof providedFolderKey === "string" && providedFolderKey.trim().length > 0
        ? providedFolderKey.trim()
        : createDraftFolderKey();
    const urls: string[] = [];

    for (const file of files) {
      urls.push(await uploadProductImage(file, folderKey));
    }

    return NextResponse.json({ urls, folderKey });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.startsWith("Invalid") || message.includes("Max size") ? 400 : 500;
    const code = getUploadErrorCode(message);

    console.error("Upload error:", error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
