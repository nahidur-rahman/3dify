import Skeleton from "@/components/ui/Skeleton";

function DetailSpecSkeleton() {
  return (
    <div className="flex items-center gap-3 bg-gray-50 dark:bg-dark-100 rounded-xl p-4">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

function RelatedCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark-100 overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-end justify-between pt-1 gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <Skeleton className="aspect-square w-full" />

        <div className="flex flex-col space-y-6">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-9 w-40" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full max-w-2xl" />
            <Skeleton className="h-6 w-5/6 max-w-xl" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <DetailSpecSkeleton key={index} />
            ))}
          </div>

          <div className="space-y-3">
            <Skeleton className="h-6 w-36" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 dark:border-dark-200 bg-gray-50 dark:bg-dark-100 p-4 space-y-3"
                >
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            <div className="flex gap-3">
              <Skeleton className="h-11 w-32 rounded-full" />
              <Skeleton className="h-11 w-28 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <section className="mt-16 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <RelatedCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}