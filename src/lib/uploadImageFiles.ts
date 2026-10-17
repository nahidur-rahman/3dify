// Send one source per request so selecting several photos doesn't exceed
// Vercel's multipart request limit before the server can compress them.
export async function uploadImageFiles(files: File[], folderKey: string, purpose = "product") {
  const urls: string[] = [];
  try {
    for (const file of files) {
      const body = new FormData();
      body.append("files", file);
      body.append("folderKey", folderKey);
      body.append("purpose", purpose);
      const response = await fetch("/api/upload", { method: "POST", body });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Image upload failed. Please retry.");
      if (!Array.isArray(result?.urls) || result.urls.length !== 1 || typeof result.urls[0] !== "string") {
        throw new Error("Image upload incomplete. Please retry.");
      }
      urls.push(result.urls[0]);
    }
    return urls;
  } catch (error) {
    if (urls.length) {
      await fetch("/api/upload", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: urls }),
      }).catch(() => {});
    }
    throw error;
  }
}
