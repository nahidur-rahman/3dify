import Skeleton from "@/components/ui/Skeleton";

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-dark-200 dark:bg-dark-100 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16 sm:w-24" />
          <Skeleton className="h-8 w-14" />
        </div>
        <Skeleton className="h-8 w-8 sm:h-12 sm:w-12 rounded-xl" />
      </div>
    </div>
  );
}

export default function AdminDashboardLoading() {
  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-5 sm:mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:mb-8 sm:gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-dark-200 dark:bg-dark-100 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-11 w-64 max-w-full rounded-xl" />
            </div>
            <Skeleton className="mb-3 h-12 w-40" />
            <Skeleton className="mb-2 h-9 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-xl sm:h-44" />
            <Skeleton className="mt-1 h-4 w-full" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-dark-200 dark:bg-dark-100 sm:p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-start gap-2 rounded-xl bg-gray-50 p-3 dark:bg-dark-200 sm:flex-row sm:items-center sm:gap-3 sm:p-4"
            >
              <Skeleton className="h-5 w-5 shrink-0 rounded-md sm:h-8 sm:w-8" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-20 sm:w-24" />
                <Skeleton className="h-3 w-full max-w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
