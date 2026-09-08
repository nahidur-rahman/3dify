import Skeleton from "@/components/ui/Skeleton";

function CartItemSkeleton() {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm dark:border-dark-200 dark:bg-dark-100 sm:flex sm:gap-6 sm:p-5">
      <Skeleton className="h-[5.5rem] w-[5.5rem] shrink-0 rounded-xl !bg-gray-100 dark:!bg-dark-200 sm:h-32 sm:w-32" />
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartLoading() {
  return (
    <div className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-5 flex items-center justify-between sm:mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
        <Skeleton className="h-4 w-16 rounded-md" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <CartItemSkeleton />
          <CartItemSkeleton />
        </div>

        <div className="lg:col-span-1">
          <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-200 dark:bg-dark-100">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <hr className="border-gray-200 dark:border-dark-200" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
