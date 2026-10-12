import "server-only";
import { NextRequest, NextResponse } from "next/server";

export function authResponse(body: object, status = 200, retryAfter?: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
    },
  });
}

// JSON plus origin checks prevent login CSRF and cross-site challenge manipulation.
export function checkAdminAuthRequest(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let trustedOrigin = request.nextUrl.origin;
  if (process.env.NODE_ENV === "production") {
    try {
      if (!configuredOrigin) throw new Error("Missing site URL");
      const site = new URL(configuredOrigin);
      const hostname = site.hostname.replace(/\.$/, "");
      const isLocal = hostname === "localhost" || hostname.endsWith(".localhost")
        || hostname === "[::1]" || hostname === "0.0.0.0" || hostname.startsWith("127.");
      if (site.protocol !== "https:" || site.username || site.password || isLocal) {
        throw new Error("Invalid production site URL");
      }
      trustedOrigin = site.origin;
    } catch {
      console.error("Admin authentication requires NEXT_PUBLIC_SITE_URL to be a public HTTPS URL in production.");
      return authResponse({ error: "Authentication is unavailable. Check the production site URL configuration." }, 503);
    }
  }
  if ((origin && origin !== trustedOrigin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return authResponse({ error: "Invalid request origin." }, 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return authResponse({ error: "Expected a JSON request." }, 415);
  }
  return null;
}

// Account limits are authoritative even when a proxy does not provide a client IP.
export function adminAuthSource(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim().slice(0, 128) || "unknown";
}

/** Bound the actual stream as Content-Length can be absent or untrusted. */
export async function readAdminAuthJson(request: NextRequest): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 8_192) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
    const body = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
