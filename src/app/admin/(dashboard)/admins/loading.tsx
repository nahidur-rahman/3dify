import Skeleton from "@/components/ui/Skeleton";

function AdminRowSkeleton() {
  return (
    <tr className="border-b border-gray-100 dark:border-dark-200 last:border-0">
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-28" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-36" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-40" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="px-4 py-4 text-right">
        <Skeleton className="h-8 w-20 rounded-full" />
      </td>
    </tr>
  );
}

export default function AdminsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-10 w-44 rounded-full" />
      </div>

      <div className="bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200 p-6 space-y-5">
        <Skeleton className="h-6 w-32" />
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-dark-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-200 text-left">
                {Array.from({ length: 6 }).map((_, index) => (
                  <th key={index} className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, index) => (
                <AdminRowSkeleton key={index} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}