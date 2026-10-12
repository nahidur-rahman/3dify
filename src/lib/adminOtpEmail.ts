import "server-only";
import { z } from "zod";
import { ADMIN_OTP_LENGTH } from "@/lib/adminOtpConfig";

/** No provider payloads or OTP values are logged, including on delivery failure. */
export async function sendAdminOtpEmail(email: string, otp: string, challengeId: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ADMIN_OTP_FROM?.trim();
  const senderAddress = from?.includes("<") ? from.match(/^[^<>\r\n]+<([^<>]+)>$/)?.[1] : from;
  if (!apiKey || !from || /[\r\n]/.test(from) || !senderAddress
    || !z.email().safeParse(senderAddress).success
    || !new RegExp(`^\\d{${ADMIN_OTP_LENGTH}}$`).test(otp)) return false;

  const body = JSON.stringify({
    from,
    to: [email],
    subject: "Your 3DifyBD admin verification code",
    text: `Your 3DifyBD admin login code is: ${otp}\n\nThis code expires in 5 minutes and can be used only once. Never share this code. If you did not request it, secure your admin password and ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;color:#111827;max-width:480px;margin:auto;padding:24px"><h1 style="font-size:22px">Verify your admin login</h1><p>Your 3DifyBD verification code:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px">${otp}</p><p>This code expires in <strong>5 minutes</strong> and can be used only once.</p><p>Never share this code. If you did not request it, secure your admin password and ignore this email.</p></div>`,
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    let retryDelay = 1_000;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `admin-login-otp/${challengeId}`,
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
      const payload = await response.json().catch(() => null);
      if (response.ok && typeof payload?.id === "string" && payload.id.length > 0) return true;
      const retryable = response.status >= 500 || response.status === 408
        || (response.status === 429 && !["daily_quota_exceeded", "monthly_quota_exceeded"].includes(payload?.name))
        || (response.status === 409 && payload?.name === "concurrent_idempotent_requests");
      if (!retryable) return false;
      const retryAfter = response.headers.get("retry-after");
      if (retryAfter) {
        const seconds = Number(retryAfter);
        const delay = Number.isFinite(seconds) ? seconds * 1_000 : Date.parse(retryAfter) - Date.now();
        if (Number.isFinite(delay)) {
          if (delay > 2_000) return false;
          retryDelay = Math.max(0, delay);
        }
      }
    } catch {
      // An idempotency key ensures retrying an ambiguous network result cannot duplicate the email.
    }
    if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, retryDelay));
  }
  return false;
}
