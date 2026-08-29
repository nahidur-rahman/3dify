export interface LocalOrder {
  orderNumber: string;
  customerPhone: string;
  total: number;
  createdAt: string;
}

const STORAGE_KEY = "3dify-orders";
const STORAGE_VERSION = 2;
const MAX_STORED_ORDERS = 12;

export const LOCAL_ORDERS_UPDATED_EVENT = "3dify-orders-updated";

interface StoredOrdersPayload {
  version: typeof STORAGE_VERSION;
  orders: LocalOrder[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function sortOrdersByNewest(orders: LocalOrder[]) {
  return [...orders].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );
}

function normalizeStoredOrder(value: unknown): LocalOrder | null {
  if (!isRecord(value)) {
    return null;
  }

  const { orderNumber, customerPhone, total, createdAt } = value;

  if (
    typeof orderNumber !== "string" ||
    typeof customerPhone !== "string" ||
    typeof total !== "number" ||
    Number.isNaN(total) ||
    typeof createdAt !== "string"
  ) {
    return null;
  }

  return {
    orderNumber,
    customerPhone,
    total,
    createdAt,
  };
}

function dedupeOrders(orders: LocalOrder[]) {
  const uniqueOrders = new Map<string, LocalOrder>();

  for (const order of sortOrdersByNewest(orders)) {
    if (!uniqueOrders.has(order.orderNumber)) {
      uniqueOrders.set(order.orderNumber, order);
    }
  }

  return [...uniqueOrders.values()];
}

function normalizeOrders(orders: unknown[]) {
  return dedupeOrders(orders.map(normalizeStoredOrder).filter(Boolean)).slice(
    0,
    MAX_STORED_ORDERS
  );
}

function persistOrders(orders: LocalOrder[]) {
  const payload: StoredOrdersPayload = {
    version: STORAGE_VERSION,
    orders,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function parseStoredOrders(value: string) {
  const parsed = JSON.parse(value);

  if (Array.isArray(parsed)) {
    return {
      orders: normalizeOrders(parsed),
      needsRewrite: true,
    };
  }

  if (
    isRecord(parsed) &&
    parsed.version === STORAGE_VERSION &&
    Array.isArray(parsed.orders)
  ) {
    return {
      orders: normalizeOrders(parsed.orders),
      needsRewrite: false,
    };
  }

  return {
    orders: [] as LocalOrder[],
    needsRewrite: false,
  };
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

    const { orders, needsRewrite } = parseStoredOrders(stored);

    if (needsRewrite) {
      persistOrders(orders);
    }

    return orders;
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

    persistOrders(nextOrders);
    window.dispatchEvent(new Event(LOCAL_ORDERS_UPDATED_EVENT));
  } catch {
    // Storage unavailable or full.
  }
}