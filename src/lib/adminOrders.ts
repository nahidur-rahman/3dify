import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

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
  createdAt: string;
  updatedAt: string;
}

interface GetAdminOrdersParams {
  status?: string | null;
  search?: string | null;
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

function serializeOrderSummary(order: OrderSummaryRecord): AdminOrderSummary {
  return {
    ...order,
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
): Promise<AdminOrderSummary[]> {
  const orders = await prisma.order.findMany({
    where: buildAdminOrderWhere(params),
    select: orderSummarySelect,
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders.map(serializeOrderSummary);
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