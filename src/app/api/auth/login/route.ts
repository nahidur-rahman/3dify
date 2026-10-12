import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { setAdminOtpCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { adminAuthSource, authResponse, checkAdminAuthRequest, readAdminAuthJson } from "@/lib/adminAuthRequest";
import { issueAdminOtp, limitAdminPasswordAttempts } from "@/lib/adminOtp";

export const runtime = "nodejs";
export const maxDuration = 30;
const DUMMY_PASSWORD_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxuUwG0CNA.X7ZiFRUKpOHi6.8i";

export async function POST(request: NextRequest) {
  const rejected = checkAdminAuthRequest(request);
  if (rejected) return rejected;
  try {
    const parsed = loginSchema.safeParse(await readAdminAuthJson(request));
    if (!parsed.success) return authResponse({ error: "Enter a valid email and password." }, 400);

    const { email, password } = parsed.data;

    const limited = await limitAdminPasswordAttempts(email, adminAuthSource(request));
    if (limited) return authResponse({ error: limited.error }, limited.status, limited.retryAfter);

    // Preserve the email matching rules of existing accounts. Unknown accounts still perform bcrypt work.
    const admin = await prisma.admin.findUnique({ where: { email } });
    const passwordMatches = await compare(password, admin?.password || DUMMY_PASSWORD_HASH);
    if (!admin || !passwordMatches) return authResponse({ error: "Invalid email or password" }, 401);

    const result = await issueAdminOtp({ admin });
    if (!result.ok) return authResponse({ error: result.error }, result.status, "retryAfter" in result ? result.retryAfter : undefined);
    setAdminOtpCookie(result.token);
    return authResponse({ requiresOtp: true, email: result.email, expiresAt: result.expiresAt, resendAvailableAt: result.resendAvailableAt, serverTime: result.serverTime });
  } catch {
    console.error("Admin login challenge failed");
    return authResponse({ error: "Unable to sign in. Please try again shortly." }, 503);
  }
}
