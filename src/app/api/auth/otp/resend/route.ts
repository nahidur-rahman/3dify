import { NextRequest } from "next/server";
import { clearAdminOtpCookie, setAdminOtpCookie } from "@/lib/auth";
import { authResponse, checkAdminAuthRequest } from "@/lib/adminAuthRequest";
import { issueAdminOtp } from "@/lib/adminOtp";
import { ADMIN_OTP_COOKIE } from "@/lib/adminOtpConfig";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const rejected = checkAdminAuthRequest(request);
  if (rejected) return rejected;
  try {
    const token = request.cookies.get(ADMIN_OTP_COOKIE)?.value;
    if (!token) return authResponse({ error: "Sign in with your email and password first.", restart: true }, 401);
    const result = await issueAdminOtp({ token });
    if (!result.ok) {
      const restart = "restart" in result && result.restart;
      if (restart) clearAdminOtpCookie();
      return authResponse({ error: result.error, restart: !!restart }, result.status, "retryAfter" in result ? result.retryAfter : undefined);
    }
    setAdminOtpCookie(result.token);
    return authResponse({ requiresOtp: true, email: result.email, expiresAt: result.expiresAt, resendAvailableAt: result.resendAvailableAt, serverTime: result.serverTime });
  } catch {
    console.error("Admin OTP resend failed");
    return authResponse({ error: "Unable to send a new code. Please try again shortly." }, 503);
  }
}
