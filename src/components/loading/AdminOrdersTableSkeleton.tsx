import Skeleton from "@/components/ui/Skeleton";

function OrderRowSkeleton() {
  return (
    <tr className="border-b border-gray-200 last:border-0 dark:border-dark-200">
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="mt-2 h-3 w-28 rounded-md" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="mt-2 h-3 w-28 rounded-md" />
        <Skeleton className="mt-1.5 h-3 w-44 rounded-md" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-8 w-8 rounded-lg border-2 border-white dark:border-dark-100"
              />
            ))}
          </div>
          <Skeleton className="h-3 w-14 rounded-md" />
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-20 rounded-md" />
        <Skeleton className="mt-2 h-3 w-12 rounded-md" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-8 w-28 rounded-xl" />
      </td>
      <td className="px-6 py-4 text-right">
        <Skeleton className="ml-auto h-8 w-20 rounded-xl" />
      </td>
    </tr>
  );
}

export default function AdminOrdersTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-dark-200 dark:bg-dark-100">
      <p className="admin-table-hint">Swipe to see all columns. Details stay on the right.</p>
      <div className="admin-table-scroll overflow-x-auto">
        <table className="admin-table w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50 dark:border-dark-200 dark:bg-dark-200/50">
              {Array.from({ length: 6 }).map((_, index) => (
                <th key={index} className="px-6 py-4">
                  <Skeleton className={`h-3 rounded-md ${index === 5 ? "ml-auto w-16" : "w-20"}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <OrderRowSkeleton key={index} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
