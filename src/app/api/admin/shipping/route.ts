import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

// Reuse existing auth pattern
async function isAuthenticated() {
  const cookieStore = cookies();
  const token = cookieStore.get("admin-token");
  return Boolean(token?.value);
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rates = await prisma.shippingRate.findMany({
    orderBy: { price: "asc" },
  });
  return NextResponse.json(rates);
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { method, price, label, isActive } = body;

    if (!method || price === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
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
