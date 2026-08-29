import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { OrderStatus, Prisma } from "@prisma/client";

async function getStatusCounts() {
  const [counts, totalCount] = await Promise.all([
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.order.count(),
  ]);

  const statusCounts: Record<string, number> = {
    ALL: totalCount,
    PENDING: 0,
    CONFIRMED: 0,
    PROCESSING: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };

  counts.forEach((count) => {
    statusCounts[count.status] = count._count.status;
  });

  return statusCounts;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const searchParam = searchParams.get("search")?.trim();
  const countsOnly = searchParams.get("countsOnly") === "true";

  try {
    if (countsOnly) {
      const statusCounts = await getStatusCounts();

      return NextResponse.json({ statusCounts });
    }

    const where: Prisma.OrderWhereInput = {};

    if (statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus)) {
      where.status = statusParam as OrderStatus;
    }

    if (searchParam) {
      where.OR = [
        { orderNumber: { contains: searchParam, mode: "insensitive" } },
        { customerName: { contains: searchParam, mode: "insensitive" } },
        { customerPhone: { contains: searchParam, mode: "insensitive" } },
        { customerEmail: { contains: searchParam, mode: "insensitive" } },
        { address: { contains: searchParam, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        customerPhone: true,
        address: true,
        shippingMethod: true,
        total: true,
        paymentMethod: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            productName: true,
            productImage: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
