import Skeleton from "@/components/ui/Skeleton";

export default function TrackOrderSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-3 py-6 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto mb-5 max-w-xl text-center sm:mb-10">
        <Skeleton className="mx-auto mb-2 h-8 w-52" />
        <div className="space-y-2">
          <Skeleton className="mx-auto h-4 w-full" />
          <Skeleton className="mx-auto h-4 w-4/5" />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-dark-200 dark:bg-dark-100 sm:mb-10 sm:rounded-3xl sm:p-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5 sm:gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-2 sm:col-span-2">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-12 w-full rounded-xl !bg-gray-100 dark:!bg-dark" />
            </div>
          ))}
          <div className="flex items-end sm:col-span-1">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>

      <Skeleton className="mx-auto h-4 w-32 rounded-md" />
    </div>
  );
}
