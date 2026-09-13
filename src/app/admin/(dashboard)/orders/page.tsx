import OrdersPageClient from "./OrdersPageClient";
import { getAdminOrders, getAdminOrderStatusCounts } from "@/lib/adminOrders";
import { OrderStatus } from "@prisma/client";
import { parseAdminPageSize, parsePage } from "@/lib/pagination";

interface AdminOrdersSearchParams {
  status?: string;
  search?: string;
  page?: string;
  pageSize?: string;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: AdminOrdersSearchParams;
}) {
  const requestedStatus = searchParams.status?.trim() || "PENDING";
  const activeStatus =
    requestedStatus === "ALL" ||
    Object.values(OrderStatus).includes(requestedStatus as OrderStatus)
      ? requestedStatus
      : "PENDING";
  const search = searchParams.search?.trim() || "";
  const page = parsePage(searchParams.page);
  const pageSize = parseAdminPageSize(searchParams.pageSize);
  const [initialOrdersPage, initialStatusCounts] = await Promise.all([
    getAdminOrders({
      status: activeStatus === "ALL" ? null : activeStatus,
      search,
      page,
      pageSize,
    }),
    getAdminOrderStatusCounts(),
  ]);

  return (
    <OrdersPageClient
      initialOrdersPage={initialOrdersPage}
      initialStatusCounts={initialStatusCounts}
      initialActiveStatus={activeStatus}
      initialSearch={search}
    />
  );
}
