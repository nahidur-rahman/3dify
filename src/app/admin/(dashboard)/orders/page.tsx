import OrdersPageClient from "./OrdersPageClient";
import { getAdminOrders, getAdminOrderStatusCounts } from "@/lib/adminOrders";

export default async function AdminOrdersPage() {
  const [initialOrders, initialStatusCounts] = await Promise.all([
    getAdminOrders({ status: "PENDING" }),
    getAdminOrderStatusCounts(),
  ]);

  return (
    <OrdersPageClient
      initialOrders={initialOrders}
      initialStatusCounts={initialStatusCounts}
    />
  );
}
