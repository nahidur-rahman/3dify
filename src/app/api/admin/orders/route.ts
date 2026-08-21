import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const searchParam = searchParams.get("search")?.trim();

  try {
    const where: any = {};

    if (statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus)) {
      where.status = statusParam as OrderStatus;
    }

    if (searchParam) {
      where.OR = [
        { orderNumber: { contains: searchParam, mode: "insensitive" } },
        { customerName: { contains: searchParam, mode: "insensitive" } },
        { customerPhone: { contains: searchParam, mode: "insensitive" } },
        { customerEmail: { contains: searchParam, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Also get status counts for filters
    const counts = await prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const statusCounts: Record<string, number> = {
      ALL: orders.length,
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    counts.forEach((c) => {
      statusCounts[c.status] = c._count.status;
    });

    const totalCount = await prisma.order.count();
    statusCounts.ALL = totalCount;

    return NextResponse.json({ orders, statusCounts });
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
