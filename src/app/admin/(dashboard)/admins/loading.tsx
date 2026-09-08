import Skeleton from "@/components/ui/Skeleton";

function CreateAdminSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-dark-200 dark:bg-dark-100">
      <div className="p-6 pb-2">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="space-y-5 p-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

function AdminTableSkeleton() {
  return (
    <div className="h-fit min-w-0 rounded-2xl border border-gray-200 bg-white dark:border-dark-200 dark:bg-dark-100">
      <div className="p-6 pb-2">
        <Skeleton className="h-6 w-36" />
      </div>
      <div className="p-3 sm:p-6">
        <p className="admin-table-hint">Swipe to see all account details.</p>
        <div className="admin-table-scroll overflow-x-auto">
          <table className="admin-table admin-accounts-table w-full table-fixed">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-200">
                {Array.from({ length: 6 }).map((_, index) => (
                  <th key={index} className="px-4 py-3">
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-gray-100 last:border-0 dark:border-dark-200"
                >
                  {Array.from({ length: 6 }).map((_, columnIndex) => (
                    <td key={columnIndex} className="px-4 py-4">
                      <Skeleton
                        className={`${columnIndex === 5 ? "ml-auto h-8 w-16 rounded-full" : "h-4 w-24 rounded-md"}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-5 w-full max-w-xl rounded-md sm:w-[32rem]" />
        </div>
        <Skeleton className="h-9 w-56 rounded-full" />
      </div>

      <div className="grid gap-8 xl:grid-cols-[375px_minmax(0,1fr)]">
        <CreateAdminSkeleton />
        <AdminTableSkeleton />
      </div>
    </div>
  );
}
