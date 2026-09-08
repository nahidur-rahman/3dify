import Skeleton from "@/components/ui/Skeleton";

export default function ShippingRatesSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className="h-7 w-44 rounded-lg" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-dark-200 dark:bg-dark-100 sm:p-6"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 basis-full space-y-1.5 sm:basis-auto sm:flex-1">
                <Skeleton className="h-3 w-16 rounded-md" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <Skeleton className="mb-2 h-4 w-24 rounded-md" />
              <Skeleton className="h-10 w-20 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
