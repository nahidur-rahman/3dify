import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  parseAdminPageSize,
  parsePage,
  type AdminPageSize,
} from "@/lib/pagination";

export interface AdminOrderPreviewItem {
  id: string;
  productName: string;
  productImage: string | null;
  quantity: number;
}

export interface AdminOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  shippingMethod: string;
  total: number;
  paymentMethod: string;
  status: OrderStatus;
  items: AdminOrderPreviewItem[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrdersPagination {
  page: number;
  pageSize: AdminPageSize;
  total: number;
  totalPages: number;
}

export interface AdminOrdersPage {
  orders: AdminOrderSummary[];
  pagination: AdminOrdersPagination;
}

interface GetAdminOrdersParams {
  status?: string | null;
  search?: string | null;
  page?: string | number | null;
  pageSize?: string | number | null;
}

const orderSummarySelect = {
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
    take: 3,
    orderBy: { id: "asc" },
    select: {
      id: true,
      productName: true,
      productImage: true,
      quantity: true,
    },
  },
} satisfies Prisma.OrderSelect;

type OrderSummaryRecord = Prisma.OrderGetPayload<{
  select: typeof orderSummarySelect;
}>;

function serializeOrderSummary(
  order: OrderSummaryRecord,
  itemCount: number
): AdminOrderSummary {
  return {
    ...order,
    itemCount,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function buildAdminOrderWhere({ status, search }: GetAdminOrdersParams): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  const trimmedSearch = search?.trim();

  if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
    where.status = status as OrderStatus;
  }

  if (trimmedSearch) {
    where.OR = [
      { orderNumber: { contains: trimmedSearch, mode: "insensitive" } },
      { customerName: { contains: trimmedSearch, mode: "insensitive" } },
      { customerPhone: { contains: trimmedSearch, mode: "insensitive" } },
      { customerEmail: { contains: trimmedSearch, mode: "insensitive" } },
      { address: { contains: trimmedSearch, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function getAdminOrders(
  params: GetAdminOrdersParams = {}
): Promise<AdminOrdersPage> {
  const where = buildAdminOrderWhere(params);
  const requestedPage = parsePage(params.page);
  const pageSize = parseAdminPageSize(params.pageSize);
  const findPage = (page: number) =>
    prisma.order.findMany({
      where,
      select: orderSummarySelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

  const [initialOrders, total] = await Promise.all([
    findPage(requestedPage),
    prisma.order.count({ where }),
  ]);
  const totalPages = Math.ceil(total / pageSize);
  const page = totalPages > 0 ? Math.min(requestedPage, totalPages) : 1;
  const orders = page === requestedPage ? initialOrders : await findPage(page);
  const quantityCounts = orders.length
    ? await prisma.orderItem.groupBy({
        by: ["orderId"],
        where: { orderId: { in: orders.map((order) => order.id) } },
        _sum: { quantity: true },
      })
    : [];
  const quantityByOrderId = new Map(
    quantityCounts.map((count) => [count.orderId, count._sum.quantity ?? 0])
  );

  return {
    orders: orders.map((order) =>
      serializeOrderSummary(order, quantityByOrderId.get(order.id) ?? 0)
    ),
    pagination: { page, pageSize, total, totalPages },
  };
}

export async function getAdminOrderStatusCounts() {
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
