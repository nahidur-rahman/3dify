"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AdminOrderSummary,
  AdminOrdersPage as AdminOrdersPageData,
  AdminOrdersPagination,
} from "@/lib/adminOrders";
import { formatPrice } from "@/lib/utils";
import {
  ADMIN_PAGE_SIZES,
  DEFAULT_ADMIN_PAGE_SIZE,
  getPaginationItems,
  getPaginationRange,
  type AdminPageSize,
} from "@/lib/pagination";
import AdminOrdersTableSkeleton from "@/components/loading/AdminOrdersTableSkeleton";
import Image from "next/image";
import {
  HiOutlineCalendar,
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineUser,
  HiOutlineXCircle,
  HiSearch,
  HiX,
} from "react-icons/hi";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  selectedSize: string | null;
  color: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

type OrderSummary = AdminOrderSummary;

interface Order extends Omit<OrderSummary, "items" | "itemCount"> {
  customerEmail: string | null;
  shippingCost: number;
  subtotal: number;
  notes: string | null;
  items: OrderItem[];
}

type OrderFilter = Order["status"] | "ALL";

interface OrdersPageClientProps {
  initialOrdersPage: AdminOrdersPageData;
  initialStatusCounts: Record<string, number>;
  initialActiveStatus: string;
  initialSearch: string;
}

const STATUS_LIST = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "ALL",
  "CANCELLED",
] as const satisfies readonly OrderFilter[];

function sortOrdersByNewest<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
  );
}

export default function OrdersPageClient({
  initialOrdersPage,
  initialStatusCounts,
  initialActiveStatus,
  initialSearch,
}: OrdersPageClientProps) {
  const [orders, setOrders] = useState<OrderSummary[]>(() =>
    sortOrdersByNewest(initialOrdersPage.orders)
  );
  const [pagination, setPagination] = useState<AdminOrdersPagination>(
    initialOrdersPage.pagination
  );
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>(initialStatusCounts);
  const [loading, setLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState<OrderFilter>(
    initialActiveStatus as OrderFilter
  );
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialOrdersPage.pagination.page);
  const [pageSize, setPageSize] = useState<AdminPageSize>(
    initialOrdersPage.pagination.pageSize
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const hasHydratedInitialOrders = useRef(false);
  const ordersRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    if (search.trim() === debouncedSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [debouncedSearch, search]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    ordersRequest.current?.abort();
    const controller = new AbortController();
    ordersRequest.current = controller;

    try {
      const params = new URLSearchParams();
      if (activeStatus !== "ALL") params.set("status", activeStatus);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/admin/orders?${params.toString()}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data: AdminOrdersPageData = await res.json();
        setOrders(sortOrdersByNewest(data.orders || []));
        setPagination(data.pagination);
        if (data.pagination.page !== page) {
          setPage(data.pagination.page);
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Failed to fetch orders:", err);
      }
    } finally {
      if (ordersRequest.current === controller) {
        setLoading(false);
      }
    }
  }, [activeStatus, debouncedSearch, page, pageSize]);

  useEffect(() => {
    if (!hasHydratedInitialOrders.current) {
      hasHydratedInitialOrders.current = true;
      return;
    }

    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeStatus !== "PENDING") params.set("status", activeStatus);
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (page > 1) params.set("page", String(page));
    if (pageSize !== DEFAULT_ADMIN_PAGE_SIZE) {
      params.set("pageSize", String(pageSize));
    }

    const query = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      query ? `/admin/orders?${query}` : "/admin/orders"
    );
  }, [activeStatus, debouncedSearch, page, pageSize]);

  useEffect(
    () => () => {
      ordersRequest.current?.abort();
    },
    []
  );

  const openOrderDetails = useCallback(async (orderId: string) => {
    setDetailsLoadingId(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (res.ok) {
        const data: Order = await res.json();
        setSelectedOrder(data);
      }
    } catch (err) {
      console.error("Failed to fetch order details:", err);
    } finally {
      setDetailsLoadingId(null);
    }
  }, []);

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const previousOrder =
      orders.find((order) => order.id === orderId) ??
      (selectedOrder?.id === orderId ? selectedOrder : null);

    if (previousOrder?.status === newStatus) {
      return;
    }

    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated: Order = await res.json();
        const previousStatus = previousOrder?.status;

        setOrders((prev) => {
          const nextOrders = prev
            .map((order) => (order.id === orderId ? { ...order, ...updated } : order))
            .filter((order) => activeStatus === "ALL" || order.status === activeStatus);

          return sortOrdersByNewest(nextOrders);
        });

        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, ...updated } : null));
        }

        if (previousStatus && previousStatus !== updated.status) {
          setStatusCounts((prev) => ({
            ...prev,
            [previousStatus]: Math.max((prev[previousStatus] ?? 0) - 1, 0),
            [updated.status]: (prev[updated.status] ?? 0) + 1,
          }));

          if (activeStatus !== "ALL") {
            await fetchOrders();
          }
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  function getStatusBadge(status: Order["status"]) {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/50";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/50";
      case "PROCESSING":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800/50";
      case "SHIPPED":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/50";
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50";
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/50";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  }

  function getStatusIcon(status: Order["status"]) {
    switch (status) {
      case "PENDING":
        return <HiOutlineClock className="w-4 h-4" />;
      case "CONFIRMED":
        return <HiOutlineCheck className="w-4 h-4" />;
      case "PROCESSING":
        return <HiOutlineDocumentText className="w-4 h-4" />;
      case "SHIPPED":
        return <HiOutlineTruck className="w-4 h-4" />;
      case "DELIVERED":
        return <HiOutlineCheckCircle className="w-4 h-4" />;
      case "CANCELLED":
        return <HiOutlineXCircle className="w-4 h-4" />;
    }
  }

  const visibleRange = getPaginationRange(
    pagination.page,
    pagination.pageSize,
    pagination.total
  );
  const paginationItems = getPaginationItems(
    pagination.page,
    pagination.totalPages
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HiOutlineShoppingBag className="w-7 h-7 text-primary-500" />
            Order Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View, track, and process customer orders
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200 p-4 space-y-4 shadow-sm">
        <div className="relative">
          <HiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            aria-label="Search orders"
            placeholder="Search by order #, customer name, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-dark border border-gray-200 dark:border-dark-200 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
          />
          {search && (
            <button
              aria-label="Clear order search"
              onClick={() => {
                setSearch("");
                setDebouncedSearch("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <HiX className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_LIST.map((status) => {
            const count = statusCounts[status] ?? 0;
            const isActive = activeStatus === status;

            return (
              <button
                key={status}
                onClick={() => {
                  setActiveStatus(status);
                  setPage(1);
                }}
                aria-pressed={isActive}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-primary-500 text-white shadow-md shadow-primary-500/20"
                    : "bg-gray-100 dark:bg-dark-200 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-300"
                }`}
              >
                <span>{status === "ALL" ? "All Orders" : status}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 dark:bg-dark-300 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <AdminOrdersTableSkeleton />
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200 p-12 text-center">
          <HiOutlineShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">No orders found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {search
              ? "Try adjusting your search query or status filter."
              : "New customer orders will appear here once placed."}
          </p>
        </div>
      ) : (
        <div
          className="bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200 overflow-hidden shadow-sm"
          aria-busy={loading}
        >
          <p className="admin-table-hint">Swipe to see all columns. Details stay on the right.</p>
          <div
            className={`admin-table-scroll overflow-x-auto transition-opacity ${
              loading ? "pointer-events-none opacity-60" : ""
            }`}
            role="region"
            aria-label="Orders table"
            tabIndex={0}
          >
            <table className="admin-table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-dark-200 bg-gray-50/50 dark:bg-dark-200/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Order #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-200 text-sm">
                {orders.map((order) => {
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50/80 dark:hover:bg-dark-200/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-primary-600 dark:text-primary-400">
                          {order.orderNumber}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <HiOutlineCalendar className="w-3.5 h-3.5" />
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {order.customerName}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <HiOutlinePhone className="w-3.5 h-3.5" />
                          {order.customerPhone}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          <HiOutlineLocationMarker className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[16rem]">{order.address}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            {order.items.slice(0, 3).map((item) => (
                              <div
                                key={item.id}
                                className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-white dark:border-dark-100 bg-gray-100 dark:bg-dark-200 flex-shrink-0"
                              >
                                {item.productImage ? (
                                  <Image
                                    src={item.productImage}
                                    alt={item.productName}
                                    fill
                                    className="object-cover"
                                    sizes="32px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                                    3D
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 dark:text-white">
                          {formatPrice(order.total)}
                        </span>
                        <span className="block text-[11px] text-gray-400 uppercase font-semibold">
                          {order.paymentMethod}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          aria-label={`Status for order ${order.orderNumber}`}
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={`admin-order-status px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-all ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => void openOrderDetails(order.id)}
                          disabled={detailsLoadingId === order.id}
                          className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-dark-200 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 text-gray-700 dark:text-gray-300 font-semibold text-xs transition-colors"
                        >
                          {detailsLoadingId === order.id ? "Loading..." : "Details"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 dark:border-dark-200 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {visibleRange.start}–{visibleRange.end} of {pagination.total}
              </p>
              {loading ? (
                <span className="text-xs font-medium text-primary-600 dark:text-primary-400" role="status">
                  Refreshing…
                </span>
              ) : null}
              <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                Rows
                <select
                  aria-label="Orders per page"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value) as AdminPageSize);
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-dark-200 dark:bg-dark-200 dark:text-white"
                >
                  {ADMIN_PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {pagination.totalPages > 1 ? (
              <nav
                className="flex flex-wrap items-center gap-1.5"
                aria-label="Admin order pages"
              >
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  disabled={page <= 1 || loading}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-primary-500 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-dark-200 dark:text-gray-300"
                >
                  Previous
                </button>

                {paginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-1 text-gray-400"
                      aria-hidden="true"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      disabled={loading}
                      aria-current={item === page ? "page" : undefined}
                      className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors disabled:cursor-wait ${
                        item === page
                          ? "bg-primary-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-primary-500/10 hover:text-primary-600 dark:bg-dark-200 dark:text-gray-300"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(current + 1, pagination.totalPages)
                    )
                  }
                  disabled={page >= pagination.totalPages || loading}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-primary-500 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-dark-200 dark:text-gray-300"
                >
                  Next
                </button>
              </nav>
            ) : null}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-100 rounded-3xl max-w-2xl w-full max-h-[calc(100dvh-1rem)] sm:max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-200 shadow-2xl">
            <div className="flex items-start justify-between gap-2 p-3 sm:p-6 border-b border-gray-200 dark:border-dark-200">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Order {selectedOrder.orderNumber}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                      selectedOrder.status
                    )}`}
                  >
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Placed on{" "}
                  {new Date(selectedOrder.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <button
                aria-label="Close order details"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-dark-200 dark:hover:text-white transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 break-words">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-dark-200 border border-gray-100 dark:border-dark-300">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HiOutlineUser className="w-4 h-4 text-primary-500" /> Customer Information
                  </h3>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {selectedOrder.customerName}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    📞 {selectedOrder.customerPhone}
                  </p>
                  {selectedOrder.customerEmail && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                      ✉️ {selectedOrder.customerEmail}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-dark-200 border border-gray-100 dark:border-dark-300">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HiOutlineLocationMarker className="w-4 h-4 text-primary-500" /> Delivery Address
                  </h3>
                  <p className="text-xs text-gray-900 dark:text-white font-medium leading-relaxed">
                    {selectedOrder.address}
                  </p>
                  <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-1">
                    Method: {selectedOrder.shippingMethod.replace(/_/g, " ")} (৳{selectedOrder.shippingCost})
                  </p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
                    Customer Notes
                  </h4>
                  <p className="text-xs text-amber-900 dark:text-amber-200 italic">
                    &quot;{selectedOrder.notes}&quot;
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                  Ordered Items ({selectedOrder.items.length})
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-dark-200 border border-gray-100 dark:border-dark-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-200 dark:bg-dark-300 flex-shrink-0">
                          {item.productImage ? (
                            <Image
                              src={item.productImage}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                              3D
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            {item.productName}
                          </h4>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                            {item.color && <span>• Color: {item.color}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatPrice(item.unitPrice)} × {item.quantity}
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                          {formatPrice(item.totalPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-dark-200 space-y-2 text-sm border border-gray-100 dark:border-dark-300">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Shipping Fee</span>
                  <span>{formatPrice(selectedOrder.shippingCost)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-dark-300 flex justify-between font-bold text-gray-900 dark:text-white text-base">
                  <span>Total (Cash on Delivery)</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Update Order Status:
                </span>
                <div className="flex items-center gap-2">
                  <select
                    aria-label="Update order status"
                    value={selectedOrder.status}
                    disabled={updatingId === selectedOrder.id}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-dark border border-gray-200 dark:border-dark-300 text-gray-900 dark:text-white outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
