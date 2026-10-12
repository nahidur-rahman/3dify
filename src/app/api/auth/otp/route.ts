import { NextRequest } from "next/server";
import { z } from "zod";
import { clearAdminOtpCookie, setSessionCookie, signToken } from "@/lib/auth";
import { authResponse, checkAdminAuthRequest, readAdminAuthJson } from "@/lib/adminAuthRequest";
import { cancelAdminOtp, getAdminOtpStatus, verifyAdminOtp } from "@/lib/adminOtp";
import { ADMIN_OTP_COOKIE, ADMIN_OTP_LENGTH } from "@/lib/adminOtpConfig";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const otpSchema = z.object({ otp: z.string().regex(new RegExp(`^\\d{${ADMIN_OTP_LENGTH}}$`)) }).strict();

export async function GET(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return authResponse({ error: "Invalid request origin." }, 403);
  try {
    const token = request.cookies.get(ADMIN_OTP_COOKIE)?.value;
    const challenge = token ? await getAdminOtpStatus(token) : null;
    if (!challenge) {
      clearAdminOtpCookie();
      return authResponse({ requiresOtp: false });
    }
    return authResponse({ requiresOtp: true, ...challenge });
  } catch {
    return authResponse({ error: "Unable to check verification. Please try again." }, 503);
  }
}

export async function POST(request: NextRequest) {
  const rejected = checkAdminAuthRequest(request);
  if (rejected) return rejected;
  try {
    const token = request.cookies.get(ADMIN_OTP_COOKIE)?.value;
    if (!token) return authResponse({ error: "Sign in with your email and password first.", restart: true }, 401);
    const parsed = otpSchema.safeParse(await readAdminAuthJson(request));
    if (!parsed.success) return authResponse({ error: `Enter the ${ADMIN_OTP_LENGTH}-digit verification code.` }, 400);

    const result = await verifyAdminOtp(token, parsed.data.otp);
    if (!result.ok) {
      const restart = "restart" in result && result.restart;
      if (restart) clearAdminOtpCookie();
      return authResponse({ error: result.error, restart: !!restart }, result.status);
    }
    // The challenge was consumed and its deletion committed before signing the session.
    const sessionToken = await signToken(result.admin);
    setSessionCookie(sessionToken);
    clearAdminOtpCookie();
    return authResponse({ success: true });
  } catch {
    console.error("Admin OTP verification failed");
    return authResponse({ error: "Unable to verify your code. Please sign in again.", restart: true }, 503);
  }
}

export async function DELETE(request: NextRequest) {
  const rejected = checkAdminAuthRequest(request);
  if (rejected) return rejected;
  try {
    const token = request.cookies.get(ADMIN_OTP_COOKIE)?.value;
    if (token) await cancelAdminOtp(token);
    clearAdminOtpCookie();
    return authResponse({ success: true });
  } catch {
    return authResponse({ error: "Unable to cancel verification. Please try again." }, 503);
  }
}
