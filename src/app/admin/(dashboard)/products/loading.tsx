import Skeleton from "@/components/ui/Skeleton";

function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-100 last:border-0 dark:border-dark-200">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <Skeleton className="h-4 w-36 rounded-md" />
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="mt-1.5 h-3 w-24 rounded-md" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="mt-1.5 h-3 w-14 rounded-md" />
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col items-start gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-24 rounded-md" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-24 rounded-md" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

export default function AdminProductsLoading() {
  return (
    <div>
      <div className="mb-5 flex flex-col items-start gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-5 w-72 rounded-md" />
        </div>
        <Skeleton className="h-10 w-36 shrink-0 rounded-xl" />
      </div>

      <div className="mb-6 rounded-[1.5rem] border border-gray-200/80 bg-white/90 p-3.5 shadow-sm dark:border-dark-200 dark:bg-dark-100/90">
        <Skeleton className="mb-3 h-4 w-32 rounded-md" />
        <div className="flex flex-wrap items-end gap-2">
          <Skeleton className="h-10 min-w-[220px] flex-[2_1_280px] rounded-xl !bg-gray-100 dark:!bg-dark-200" />
          <Skeleton className="h-10 min-w-[140px] flex-[1_1_160px] rounded-xl !bg-gray-100 dark:!bg-dark-200" />
          <Skeleton className="h-10 min-w-[160px] flex-[1_1_190px] rounded-xl !bg-gray-100 dark:!bg-dark-200" />
          <Skeleton className="h-10 min-w-[140px] flex-[1_1_160px] rounded-xl !bg-gray-100 dark:!bg-dark-200" />
          <Skeleton className="h-10 min-w-[170px] flex-[1_1_190px] rounded-xl !bg-gray-100 dark:!bg-dark-200" />
          <Skeleton className="h-10 min-w-[150px] flex-[1_1_170px] rounded-xl !bg-gray-100 dark:!bg-dark-200" />
          <Skeleton className="h-10 min-w-[170px] flex-[1_1_210px] rounded-xl !bg-gray-100 dark:!bg-dark-200" />
          <Skeleton className="h-10 min-w-[150px] flex-[1_1_180px] rounded-xl !bg-gray-100 dark:!bg-dark-200" />
          <Skeleton className="h-10 min-w-[150px] flex-[1_1_180px] rounded-xl !bg-gray-100 dark:!bg-dark-200" />
          <Skeleton className="h-10 w-28 flex-none rounded-xl" />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-dark-200 dark:bg-dark-100">
        <p className="admin-table-hint">Swipe to see all columns. Actions stay on the right.</p>
        <div className="admin-table-scroll overflow-x-auto">
          <table className="admin-table admin-products-table w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-200">
                {Array.from({ length: 7 }).map((_, index) => (
                  <th key={index} className="px-6 py-4 text-left">
                    <Skeleton className={`h-4 w-20 rounded-md ${index === 6 ? "ml-auto" : ""}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <TableRowSkeleton key={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
