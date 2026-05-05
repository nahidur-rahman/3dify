import Skeleton from "@/components/ui/Skeleton";

function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-14" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

export default function AdminDashboardLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      <div className="bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200 p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-dark-200"
            >
              <Skeleton className="h-8 w-8 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}