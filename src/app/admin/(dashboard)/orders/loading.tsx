import AdminOrdersTableSkeleton from "@/components/loading/AdminOrdersTableSkeleton";
import Skeleton from "@/components/ui/Skeleton";

export default function AdminOrdersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-md" />
          <Skeleton className="h-7 w-52 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-64 rounded-md" />
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-dark-200 dark:bg-dark-100">
        <Skeleton className="h-11 w-full rounded-xl !bg-gray-100 dark:!bg-dark" />
        <div className="flex gap-2 overflow-hidden pb-1">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-8 w-28 shrink-0 rounded-xl !bg-gray-100 dark:!bg-dark-200"
            />
          ))}
        </div>
      </div>

      <AdminOrdersTableSkeleton />
    </div>
  );
}
