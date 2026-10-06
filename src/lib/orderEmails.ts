import "server-only";

import { z } from "zod";
import { buildOrderEmails, type EmailOrder, type OrderEmailConfig } from "@/lib/orderEmailTemplates";

const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 4_000;
const MAX_RETRY_DELAY_MS = 2_000;

function getConfig(): OrderEmailConfig & { apiKey: string } {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY is missing");

  const from = process.env.ORDER_EMAIL_FROM?.trim() || "3DifyBD Orders <orders@mail.3difybd.com>";
  const adminEmail = process.env.ORDER_ADMIN_EMAIL?.trim() || "3difybd@gmail.com";
  const replyTo = process.env.ORDER_EMAIL_REPLY_TO?.trim() || adminEmail;
  const senderAddress = from.includes("<") ? from.match(/^[^<>\r\n]+<([^<>]+)>$/)?.[1] : from;
  if (!senderAddress || /[\r\n]/.test(from) || !z.email().safeParse(senderAddress).success) {
    throw new Error("ORDER_EMAIL_FROM must be an email or Name <email>");
  }
  for (const [name, value] of [["ORDER_ADMIN_EMAIL", adminEmail], ["ORDER_EMAIL_REPLY_TO", replyTo]]) {
    if (!z.email().safeParse(value).success) throw new Error(`${name} must be a single valid email`);
  }
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://3difybd.com");
  if (!["https:", "http:"].includes(site.protocol) || site.username || site.password) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) URL without credentials");
  }
  return { apiKey, from, adminEmail, replyTo, siteUrl: site.origin };
}

function retryDelay(response: Response | undefined, attempt: number): number | null {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    const delay = Number.isFinite(seconds) ? seconds * 1_000 : Date.parse(retryAfter) - Date.now();
    // Don't wait beyond the checkout's bounded email budget.
    if (Number.isFinite(delay)) return delay > MAX_RETRY_DELAY_MS ? null : Math.max(0, delay);
  }
  return Math.min(750 * 2 ** attempt + Math.floor(Math.random() * 250), MAX_RETRY_DELAY_MS);
}

export interface OrderEmailResult {
  success: boolean;
  emailIds?: string[];
}

/** Awaited after commit: serverless runtimes can discard unawaited email work. */
export async function sendOrderEmails(order: EmailOrder): Promise<OrderEmailResult> {
  try {
    const { apiKey, ...config } = getConfig();
    // Build once so every retry has exactly the same body and idempotency key.
    const messages = buildOrderEmails(order, config);
    const body = JSON.stringify(messages);
    let status: number | undefined;
    let code = "network_error";

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      let response: Response | undefined;
      let retryable = true;
      try {
        response = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `order-placed/${order.id}`,
          },
          body,
          cache: "no-store",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        status = response.status;
        const payload = await response.json().catch(() => null);
        if (response.ok && Array.isArray(payload?.data) && payload.data.length === messages.length
          && payload.data.every((email: { id?: unknown }) => typeof email?.id === "string" && email.id)) {
          return { success: true, emailIds: payload.data.map((email: { id: string }) => email.id) };
        }
        code = typeof payload?.name === "string" && /^[a-z_]+$/.test(payload.name)
          ? payload.name : "invalid_response";
        retryable = response.ok || response.status >= 500 || response.status === 408
          || (response.status === 429 && code !== "daily_quota_exceeded" && code !== "monthly_quota_exceeded")
          || (response.status === 409 && code === "concurrent_idempotent_requests");
      } catch {
        status = undefined;
        code = "network_error_or_timeout";
      }
      if (!retryable || attempt === MAX_ATTEMPTS - 1) break;
      const delay = retryDelay(response, attempt);
      if (delay === null) break;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    // Log identifiers only; provider responses can include customer data.
    console.error("Order email delivery failed", { orderId: order.id, status, code });
  } catch {
    console.error("Order email configuration or template failed; check email environment variables", { orderId: order.id });
  }
  return { success: false };
}
