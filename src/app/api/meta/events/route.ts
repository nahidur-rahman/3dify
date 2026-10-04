import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  META_CURRENCY,
  buildFbcFromUrl,
  buildOrderUserData,
  isMetaConversionsConfigured,
  sendMetaEvents,
  type MetaUserData,
} from "@/lib/metaConversions";

const MAX_BODY_LENGTH = 8000;
// A Purchase is only accepted for an order placed moments ago, and its value
// and customer details always come from the database, never the browser.
const PURCHASE_WINDOW_MS = 30 * 60 * 1000;

const ContentSchema = z.object({
  id: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(999),
});

const EventSchema = z.object({
  name: z.enum(["ViewContent", "AddToCart", "InitiateCheckout", "Purchase", "Contact"]),
  eventId: z.string().min(1).max(100),
  url: z.string().url().max(2000),
  orderNumber: z.string().min(1).max(40).optional(),
  params: z
    .object({
      value: z.number().min(0).max(10_000_000).optional(),
      content_ids: z.array(z.string().min(1).max(64)).max(50).optional(),
      contents: z.array(ContentSchema).max(50).optional(),
      content_type: z.literal("product").optional(),
      content_name: z.string().max(200).optional(),
      content_category: z.string().max(100).optional(),
      num_items: z.number().int().min(1).max(9999).optional(),
    })
    .optional(),
});

function noContent() {
  return new NextResponse(null, { status: 204 });
}

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

function getClientUserData(request: NextRequest, url: string): MetaUserData {
  const userData: MetaUserData = {};
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent");
  const fbp = request.cookies.get("_fbp")?.value;
  const fbc = request.cookies.get("_fbc")?.value || buildFbcFromUrl(url);

  if (ip) userData.client_ip_address = ip;
  if (userAgent) userData.client_user_agent = userAgent;
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  return userData;
}

export async function POST(request: NextRequest) {
  if (!isMetaConversionsConfigured()) return noContent();

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_LENGTH) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const parsed = EventSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const event = parsed.data;
    let userData = getClientUserData(request, event.url);
    let eventId = event.eventId;
    let customData: Record<string, unknown> = {
      ...event.params,
      currency: META_CURRENCY,
    };

    if (event.name === "Purchase") {
      if (!event.orderNumber) return noContent();

      const order = await prisma.order.findUnique({
        where: { orderNumber: event.orderNumber },
        include: { items: true },
      });

      if (!order || Date.now() - order.createdAt.getTime() > PURCHASE_WINDOW_MS) {
        return noContent();
      }

      eventId = `purchase-${order.orderNumber}`;
      userData = { ...userData, ...buildOrderUserData(order) };
      customData = {
        value: order.total,
        currency: META_CURRENCY,
        order_id: order.orderNumber,
        content_type: "product",
        content_ids: Array.from(new Set(order.items.map((item) => item.productId))),
        contents: order.items.map((item) => ({
          id: item.productId,
          quantity: item.quantity,
          item_price: item.unitPrice,
        })),
        num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
      };
    }

    await sendMetaEvents([
      {
        event_name: event.name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: event.url,
        user_data: userData,
        custom_data: customData,
      },
    ]);

    return noContent();
  } catch {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }
}
