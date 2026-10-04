import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";
import {
  META_CURRENCY,
  buildOrderUserData,
  sendMetaEvents,
} from "@/lib/metaConversions";

const ORDER_OUTCOME_EVENTS: Partial<Record<OrderStatus, string>> = {
  DELIVERED: "OrderDelivered",
  CANCELLED: "OrderCancelled",
};

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (err) {
    console.error("Failed to fetch order details:", err);
    return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { status } = body;

    if (!status || !Object.values(OrderStatus).includes(status as OrderStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: { status: status as OrderStatus },
      include: { items: true },
    });

    // Tell Meta how COD orders actually end, so ads optimize for buyers who
    // accept delivery rather than for anyone who places an order.
    const outcomeEventName = ORDER_OUTCOME_EVENTS[updatedOrder.status];

    if (outcomeEventName && existingOrder.status !== updatedOrder.status) {
      await sendMetaEvents([
        {
          event_name: outcomeEventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: `${outcomeEventName}-${updatedOrder.orderNumber}`,
          action_source: "system_generated",
          user_data: buildOrderUserData(updatedOrder),
          custom_data: {
            value: updatedOrder.total,
            currency: META_CURRENCY,
            order_id: updatedOrder.orderNumber,
            content_type: "product",
            content_ids: Array.from(
              new Set(updatedOrder.items.map((item) => item.productId))
            ),
          },
        },
      ]);
    }

    return NextResponse.json(updatedOrder);
  } catch (err) {
    console.error("Failed to update order status:", err);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
