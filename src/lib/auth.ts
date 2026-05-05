import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ADMIN_TOKEN_COOKIE, AdminPayload, JWT_SECRET } from "@/lib/authConfig";

export async function signToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(ADMIN_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_TOKEN_COOKIE);
}
