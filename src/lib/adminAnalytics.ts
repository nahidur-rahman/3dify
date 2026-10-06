import { prisma } from "@/lib/db";
import {
  fillAnalyticsDays,
  getDhakaDate,
  getDhakaDayStart,
  getPeriodStart,
  type DashboardAnalytics,
} from "@/lib/dashboardAnalytics";

export async function getDashboardAnalytics(now = new Date()): Promise<DashboardAnalytics> {
  const today = getDhakaDate(now);
  const start = getPeriodStart("6M", today);

  try {
    // Aggregate in the database and send only daily totals to the browser.
    // Sum item quantities before joining to avoid counting an order's amount
    // once for each of its items.
    const records = await prisma.$queryRaw<{
      date: string;
      orders: bigint;
      products: bigint;
      amount: number;
    }[]>`
      SELECT
        TO_CHAR(o."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Dhaka', 'YYYY-MM-DD') AS date,
        COUNT(*) AS orders,
        COALESCE(SUM(item_totals.quantity), 0)::bigint AS products,
        COALESCE(SUM(o.total), 0) AS amount
      FROM orders o
      LEFT JOIN LATERAL (
        SELECT SUM(i.quantity) AS quantity
        FROM order_items i
        WHERE i."orderId" = o.id
      ) item_totals ON TRUE
      WHERE o."createdAt" >= ${getDhakaDayStart(start)}
        AND o."createdAt" <= ${now}
        AND o.status <> 'CANCELLED'
      GROUP BY date
      ORDER BY date
    `;

    return {
      today,
      available: true,
      days: fillAnalyticsDays(records.map((record) => ({
        date: record.date,
        orders: Number(record.orders),
        products: Number(record.products),
        amount: Math.round(Number(record.amount) * 100) / 100,
      })), start, today),
    };
  } catch (error) {
    console.error("Failed to load dashboard analytics", error);
    return { today, available: false, days: [] };
  }
}
