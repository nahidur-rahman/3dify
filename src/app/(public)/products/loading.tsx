import Skeleton from "@/components/ui/Skeleton";

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-dark-100 rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-200"
        >
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex items-end justify-between pt-2 gap-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 space-y-3 max-w-3xl">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>

      <Skeleton className="h-12 w-full rounded-xl mb-8" />
      <ProductGridSkeleton />
    </div>
  );
}