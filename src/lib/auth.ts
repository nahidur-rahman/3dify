import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  ADMIN_AUTH_METHOD,
  ADMIN_TOKEN_COOKIE,
  ADMIN_TOKEN_MAX_AGE_SECONDS,
  ADMIN_TOKEN_VALIDITY,
  AdminPayload,
  JWT_SECRET,
  readAdminTokenPayload,
} from "@/lib/authConfig";
import { ADMIN_OTP_COOKIE, ADMIN_OTP_TTL_SECONDS } from "@/lib/adminOtpConfig";

export async function signToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload, authMethod: ADMIN_AUTH_METHOD })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ADMIN_TOKEN_VALIDITY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    return readAdminTokenPayload(payload);
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
    maxAge: ADMIN_TOKEN_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_TOKEN_COOKIE);
}

export function setAdminOtpCookie(token: string) {
  cookies().set(ADMIN_OTP_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ADMIN_OTP_TTL_SECONDS,
    path: "/api/auth",
  });
}

export function clearAdminOtpCookie() {
  cookies().set(ADMIN_OTP_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/api/auth",
  });
}
