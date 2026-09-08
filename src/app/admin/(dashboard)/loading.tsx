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
