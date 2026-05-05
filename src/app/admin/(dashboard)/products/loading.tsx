import Skeleton from "@/components/ui/Skeleton";

function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-100 dark:border-dark-200 last:border-0">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-28" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </td>
    </tr>
  );
}

export default function AdminProductsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>

      <div className="bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-200">
                {Array.from({ length: 5 }).map((_, index) => (
                  <th key={index} className="px-6 py-4 text-left">
                    <Skeleton className="h-4 w-24" />
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