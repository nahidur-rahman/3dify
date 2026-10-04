import { createHash } from "crypto";

// Server-side Meta Conversions API helpers. Everything here is a no-op until
// NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_ACCESS_TOKEN are both configured.

const DEFAULT_GRAPH_API_VERSION = "v23.0";
const REQUEST_TIMEOUT_MS = 3000;

export const META_CURRENCY = "BDT";

export interface MetaUserData {
  em?: string[];
  ph?: string[];
  fn?: string[];
  ln?: string[];
  country?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
}

export interface MetaServerEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  action_source: "website" | "system_generated";
  event_source_url?: string;
  user_data: MetaUserData;
  custom_data?: Record<string, unknown>;
}

function getPixelId() {
  const pixelId = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").trim();
  return /^\d+$/.test(pixelId) ? pixelId : "";
}

function getAccessToken() {
  return (process.env.META_CAPI_ACCESS_TOKEN || "").trim();
}

export function isMetaConversionsConfigured(): boolean {
  return Boolean(getPixelId() && getAccessToken());
}

// Meta expects SHA-256 of the trimmed, lowercased value.
export function hashMetaValue(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

// Meta expects phone numbers as digits with the country code (8801XXXXXXXXX).
export function normalizeBdPhoneForMeta(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");

  if (/^8801\d{9}$/.test(digits)) return digits;
  if (/^01\d{9}$/.test(digits)) return `88${digits}`;
  if (/^1\d{9}$/.test(digits)) return `880${digits}`;

  return null;
}

export function buildOrderUserData(order: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
}): MetaUserData {
  const userData: MetaUserData = { country: [hashMetaValue("bd")] };
  const phone = normalizeBdPhoneForMeta(order.customerPhone);
  const email = order.customerEmail?.trim();
  const nameParts = order.customerName.trim().split(/\s+/).filter(Boolean);

  if (phone) userData.ph = [hashMetaValue(phone)];
  if (email) userData.em = [hashMetaValue(email)];
  if (nameParts.length > 0) userData.fn = [hashMetaValue(nameParts[0])];
  if (nameParts.length > 1) {
    userData.ln = [hashMetaValue(nameParts[nameParts.length - 1])];
  }

  return userData;
}

// The pixel stores the click id as fb.1.<timestamp>.<fbclid>; rebuild it from
// the landing URL when the cookie has not been written yet.
export function buildFbcFromUrl(url: string, now = Date.now()): string | null {
  try {
    const fbclid = new URL(url).searchParams.get("fbclid")?.trim();
    return fbclid ? `fb.1.${now}.${fbclid}` : null;
  } catch {
    return null;
  }
}

// Never throws: tracking must not be able to break an order or an admin action.
export async function sendMetaEvents(events: MetaServerEvent[]): Promise<boolean> {
  const pixelId = getPixelId();
  const accessToken = getAccessToken();

  if (!pixelId || !accessToken || events.length === 0) return false;

  const version =
    (process.env.META_GRAPH_API_VERSION || "").trim() || DEFAULT_GRAPH_API_VERSION;
  const testEventCode = (process.env.META_TEST_EVENT_CODE || "").trim();

  try {
    const response = await fetch(
      `https://graph.facebook.com/${version}/${pixelId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: events,
          access_token: accessToken,
          ...(testEventCode ? { test_event_code: testEventCode } : {}),
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      console.error(
        "Meta Conversions API rejected events:",
        response.status,
        await response.text()
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to send Meta Conversions API events:", err);
    return false;
  }
}
