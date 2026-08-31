import { NextRequest, NextResponse } from "next/server";
import { getAdminOrders, getAdminOrderStatusCounts } from "@/lib/adminOrders";
import { getSession } from "@/lib/auth";

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
      const statusCounts = await getAdminOrderStatusCounts();

      return NextResponse.json({ statusCounts });
    }

    const orders = await getAdminOrders({
      status: statusParam,
      search: searchParam,
    });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
