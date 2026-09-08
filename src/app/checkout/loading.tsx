import Skeleton from "@/components/ui/Skeleton";

function CheckoutSectionSkeleton({ fields = 1 }: { fields?: number }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded-md" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: fields }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-12 w-full rounded-xl !bg-white dark:!bg-dark-100"
          />
        ))}
      </div>
    </section>
  );
}

export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-8 h-8 w-36" />
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-5">
        <div className="order-first lg:order-last lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-200 dark:bg-dark-100">
            <Skeleton className="mb-4 h-5 w-36" />
            <div className="mb-4 space-y-3 px-1 pb-2 pt-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-14 w-14 shrink-0 rounded-lg !bg-gray-100 dark:!bg-dark-200" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
            <hr className="border-gray-200 dark:border-dark-200" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
            <hr className="my-4 border-gray-200 dark:border-dark-200" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="mt-6 hidden h-14 w-full rounded-xl lg:block" />
          </div>
        </div>

        <div className="order-last space-y-6 lg:order-first lg:col-span-3">
          <CheckoutSectionSkeleton fields={2} />
          <Skeleton className="h-4 w-4/5 rounded-md" />
          <CheckoutSectionSkeleton fields={5} />
          <CheckoutSectionSkeleton />
          <CheckoutSectionSkeleton />
          <Skeleton className="h-14 w-full rounded-xl lg:hidden" />
        </div>
      </div>
    </div>
  );
}
