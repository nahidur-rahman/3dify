"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  ADMIN_PAGE_SIZES,
  DEFAULT_ADMIN_PAGE_SIZE,
  type AdminPageSize,
} from "@/lib/pagination";

export default function AdminProductsPageSizeSelect({
  value,
}: {
  value: AdminPageSize;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updatePageSize(pageSize: AdminPageSize) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (pageSize === DEFAULT_ADMIN_PAGE_SIZE) {
      params.delete("pageSize");
    } else {
      params.set("pageSize", String(pageSize));
    }

    const query = params.toString();
    router.push(query ? `/admin/products?${query}` : "/admin/products", {
      scroll: false,
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      Rows
      <select
        aria-label="Products per page"
        value={value}
        onChange={(event) =>
          updatePageSize(Number(event.target.value) as AdminPageSize)
        }
        className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-dark-200 dark:bg-dark-200 dark:text-white"
      >
        {ADMIN_PAGE_SIZES.map((pageSize) => (
          <option key={pageSize} value={pageSize}>
            {pageSize}
          </option>
        ))}
      </select>
    </label>
  );
}
