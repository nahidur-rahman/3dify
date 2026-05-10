import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  ADMIN_TOKEN_COOKIE,
  AdminPayload,
  JWT_SECRET,
} from "@/lib/authConfig";

async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const typedPayload = payload as Partial<AdminPayload>;
    const username =
      typeof typedPayload.username === "string"
        ? typedPayload.username
        : typeof typedPayload.name === "string"
          ? typedPayload.name
          : null;

    if (
      typeof typedPayload.id !== "string" ||
      typeof typedPayload.email !== "string" ||
      !username
    ) {
      return null;
    }

    return {
      id: typedPayload.id,
      email: typedPayload.email,
      username,
    };
  } catch {
    return null;
  }
}

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  const isLoginPage = pathname === "/admin/login";

  if (!token) {
    return isLoginPage ? NextResponse.next() : redirectTo(request, "/admin/login");
  }

  const session = await verifyAdminToken(token);

  if (!session) {
    const response = isLoginPage ? NextResponse.next() : redirectTo(request, "/admin/login");
    response.cookies.delete(ADMIN_TOKEN_COOKIE);
    return response;
  }

  if (isLoginPage) {
    return redirectTo(request, "/admin");
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-admin-id", session.id);
  requestHeaders.set("x-admin-email", session.email);
  requestHeaders.set("x-admin-username", session.username);
  requestHeaders.set("x-admin-name", session.username);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};