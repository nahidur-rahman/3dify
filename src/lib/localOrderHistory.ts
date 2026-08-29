export type LocalOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface LocalOrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  selectedSize?: string;
  color?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface LocalOrder {
  orderNumber: string;
  orderId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  district: string;
  postalCode?: string;
  shippingMethod: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
  shippingCost: number;
  subtotal: number;
  total: number;
  paymentMethod: "COD";
  status: LocalOrderStatus;
  createdAt: string;
  items: LocalOrderItem[];
}

const STORAGE_KEY = "3dify-orders";
const MAX_STORED_ORDERS = 12;

export const LOCAL_ORDERS_UPDATED_EVENT = "3dify-orders-updated";

function sortOrdersByNewest(orders: LocalOrder[]) {
  return [...orders].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );
}

function isValidLocalOrder(value: unknown): value is LocalOrder {
  if (!value || typeof value !== "object") {
    return false;
  }

  const order = value as Partial<LocalOrder>;

  return (
    typeof order.orderNumber === "string" &&
    typeof order.customerName === "string" &&
    typeof order.customerPhone === "string" &&
    typeof order.address === "string" &&
    typeof order.district === "string" &&
    typeof order.createdAt === "string" &&
    typeof order.total === "number" &&
    Array.isArray(order.items)
  );
}

export function loadStoredOrders(): LocalOrder[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortOrdersByNewest(parsed.filter(isValidLocalOrder));
  } catch {
    return [];
  }
}

export function saveStoredOrder(order: LocalOrder) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const existingOrders = loadStoredOrders().filter(
      (existingOrder) => existingOrder.orderNumber !== order.orderNumber
    );
    const nextOrders = sortOrdersByNewest([order, ...existingOrders]).slice(
      0,
      MAX_STORED_ORDERS
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextOrders));
    window.dispatchEvent(new Event(LOCAL_ORDERS_UPDATED_EVENT));
  } catch {
    // Storage unavailable or full.
  }
}