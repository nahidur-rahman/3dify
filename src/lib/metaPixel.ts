// Browser-side Meta Pixel helpers. Everything here is a no-op until
// NEXT_PUBLIC_META_PIXEL_ID is configured.

const RAW_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID || "").trim();

export const META_PIXEL_ID = /^\d+$/.test(RAW_PIXEL_ID) ? RAW_PIXEL_ID : "";
export const META_CURRENCY = "BDT";

export type MetaEventName =
  | "ViewContent"
  | "Search"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase"
  | "Contact";

// Events that are also sent through the Conversions API (deduplicated by
// event id) so they survive ad blockers and browser tracking prevention.
const SERVER_MIRRORED_EVENTS: MetaEventName[] = [
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
  "Contact",
];

interface FbqFunction {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: FbqFunction;
  loaded: boolean;
  version: string;
  disablePushState: boolean;
}

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
  }
}

// Creates the standard fbq queue without loading the library. Events are
// buffered here and flushed once fbevents.js arrives (loaded lazily by
// <MetaPixel />), so tracking never blocks rendering.
export function ensureMetaPixel(): FbqFunction | null {
  if (!META_PIXEL_ID || typeof window === "undefined") return null;
  if (window.fbq) return window.fbq;

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  } as FbqFunction;

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];
  // Route changes are tracked by <MetaPixel />; avoid duplicate PageViews.
  fbq.disablePushState = true;

  window.fbq = fbq;
  window._fbq = fbq;

  fbq("init", META_PIXEL_ID);
  fbq("track", "PageView");

  return fbq;
}

export function trackMetaPageView() {
  ensureMetaPixel()?.("track", "PageView");
}

function createEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sendToServer(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon?.("/api/meta/events", body)) return;
  } catch {
    // Fall through to fetch
  }

  fetch("/api/meta/events", { method: "POST", body, keepalive: true }).catch(
    () => {}
  );
}

export function trackMetaEvent(
  name: MetaEventName,
  params: Record<string, unknown> = {},
  options: { eventId?: string; orderNumber?: string } = {}
) {
  const fbq = ensureMetaPixel();
  if (!fbq) return;

  const eventId = options.eventId || createEventId();

  fbq("track", name, params, { eventID: eventId });

  if (SERVER_MIRRORED_EVENTS.includes(name)) {
    sendToServer({
      name,
      eventId,
      url: window.location.href,
      params,
      orderNumber: options.orderNumber,
    });
  }
}

export function getPurchaseEventId(orderNumber: string) {
  return `purchase-${orderNumber}`;
}
