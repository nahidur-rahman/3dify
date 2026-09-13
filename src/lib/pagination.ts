export const ADMIN_PAGE_SIZES = [20, 50, 100] as const;
export const DEFAULT_ADMIN_PAGE_SIZE = ADMIN_PAGE_SIZES[0];

export type AdminPageSize = (typeof ADMIN_PAGE_SIZES)[number];
export type PaginationItem = number | "ellipsis";

export function parsePage(value: string | number | null | undefined) {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(value || "1", 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function parseAdminPageSize(
  value: string | number | null | undefined
): AdminPageSize {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(value || String(DEFAULT_ADMIN_PAGE_SIZE), 10);

  return ADMIN_PAGE_SIZES.includes(parsed as AdminPageSize)
    ? (parsed as AdminPageSize)
    : DEFAULT_ADMIN_PAGE_SIZE;
}

export function getPaginationItems(
  currentPage: number,
  totalPages: number
): PaginationItem[] {
  if (totalPages <= 0) return [];

  const current = Math.min(Math.max(currentPage, 1), totalPages);
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, current - 1, current, current + 1]);

  if (current <= 4) {
    [2, 3, 4, 5].forEach((page) => pages.add(page));
  }

  if (current >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach(
      (page) => pages.add(page)
    );
  }

  const visiblePages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second);
  const items: PaginationItem[] = [];

  visiblePages.forEach((page, index) => {
    const previousPage = visiblePages[index - 1];
    if (previousPage && page - previousPage > 1) {
      items.push("ellipsis");
    }
    items.push(page);
  });

  return items;
}

export function getPaginationRange(
  page: number,
  pageSize: number,
  total: number
) {
  if (total <= 0) return { start: 0, end: 0 };

  const start = (page - 1) * pageSize + 1;
  return {
    start,
    end: Math.min(start + pageSize - 1, total),
  };
}
