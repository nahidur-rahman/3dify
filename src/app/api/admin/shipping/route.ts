import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/adminSession";
import { getAdminShippingRates } from "@/lib/shipping";
import type { ShippingMethod } from "@prisma/client";

const SHIPPING_METHODS: ShippingMethod[] = ["INSIDE_DHAKA", "OUTSIDE_DHAKA"];

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rates = await getAdminShippingRates();
    return NextResponse.json(rates);
  } catch (error) {
    console.error("Failed to load shipping rates:", error);
    return NextResponse.json(
      { error: "Failed to load shipping rates" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const method =
      typeof body.method === "string" ? (body.method.trim() as ShippingMethod) : null;
    const price = typeof body.price === "number" ? body.price : Number(body.price);
    const isActive = typeof body.isActive === "boolean" ? body.isActive : true;
    const currentRates = await getAdminShippingRates();
    const existingRate = method
      ? currentRates.find((rate) => rate.method === method)
      : null;
    const label =
      typeof body.label === "string" && body.label.trim().length > 0
        ? body.label.trim()
        : existingRate?.label;

    if (!method || !SHIPPING_METHODS.includes(method)) {
      return NextResponse.json({ error: "Invalid shipping method" }, { status: 400 });
    }

    if (!label) {
      return NextResponse.json({ error: "Shipping label is required" }, { status: 400 });
    }

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Shipping price must be zero or more" }, { status: 400 });
    }

    const rate = await prisma.shippingRate.upsert({
      where: { method },
      update: { price, label, isActive },
      create: { method, price, label, isActive: isActive ?? true },
    });

    return NextResponse.json(rate);
  } catch (err) {
    console.error("Failed to update shipping rate:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
