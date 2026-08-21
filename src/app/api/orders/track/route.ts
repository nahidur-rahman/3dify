import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumberParam = searchParams.get("order") || searchParams.get("orderNumber");
  const phoneParam = searchParams.get("phone");

  if (!orderNumberParam || !phoneParam) {
    return NextResponse.json(
      { error: "Both Order Number and Phone Number are required." },
      { status: 400 }
    );
  }

  const cleanOrderNumber = orderNumberParam.trim().toUpperCase();
  const cleanPhone = phoneParam.replace(/\D/g, ""); // Strip non-digits

  if (!cleanPhone || cleanPhone.length < 6) {
    return NextResponse.json(
      { error: "Please enter a valid phone number." },
      { status: 400 }
    );
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        orderNumber: {
          equals: cleanOrderNumber,
          mode: "insensitive",
        },
      },
      include: {
        items: true,
      },
    });

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: "No order found with that Order Number." },
        { status: 404 }
      );
    }

    // Match phone (compare last 7 digits or clean digits)
    const matchingOrder = orders.find((o) => {
      const dbPhoneClean = o.customerPhone.replace(/\D/g, "");
      return dbPhoneClean.endsWith(cleanPhone) || cleanPhone.endsWith(dbPhoneClean);
    });

    if (!matchingOrder) {
      return NextResponse.json(
        { error: "Order number found, but phone number did not match." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: {
        id: matchingOrder.id,
        orderNumber: matchingOrder.orderNumber,
        status: matchingOrder.status,
        customerName: matchingOrder.customerName,
        city: matchingOrder.city,
        shippingMethod: matchingOrder.shippingMethod,
        shippingCost: matchingOrder.shippingCost,
        subtotal: matchingOrder.subtotal,
        total: matchingOrder.total,
        paymentMethod: matchingOrder.paymentMethod,
        createdAt: matchingOrder.createdAt,
        updatedAt: matchingOrder.updatedAt,
        items: matchingOrder.items.map((i) => ({
          id: i.id,
          productName: i.productName,
          productImage: i.productImage,
          selectedSize: i.selectedSize,
          color: i.color,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        })),
      },
    });
  } catch (err) {
    console.error("Error tracking order:", err);
    return NextResponse.json(
      { error: "Failed to fetch order details. Please try again." },
      { status: 500 }
    );
  }
}
