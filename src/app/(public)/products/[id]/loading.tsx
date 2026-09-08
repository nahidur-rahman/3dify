import Skeleton from "@/components/ui/Skeleton";

function OptionSkeletons() {
  return (
    <div>
      <Skeleton className="mb-2 h-4 w-12 rounded-md" />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export default function ProductDetailLoading() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-10 rounded-md" />
          <Skeleton className="h-3 w-2 rounded-sm" />
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-3 w-2 rounded-sm" />
          <Skeleton className="h-3 w-28 rounded-md" />
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl !bg-gray-100 dark:!bg-dark-100" />
            <div className="mt-3 flex justify-center gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-16 rounded-xl" />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-5 sm:gap-6">
            <div>
              <Skeleton className="mb-3 h-6 w-28 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-11/12 sm:h-9" />
                <Skeleton className="h-7 w-2/3 sm:h-9" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Skeleton className="h-2.5 w-2.5 rounded-full !bg-emerald-300 dark:!bg-emerald-700" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>

            <hr className="border-gray-200 dark:border-dark-200" />

            <div className="flex flex-col gap-5">
              <Skeleton className="h-7 w-28 rounded-md" />
              <OptionSkeletons />
              <OptionSkeletons />
              <div>
                <Skeleton className="mb-2 h-4 w-16 rounded-md" />
                <Skeleton className="h-11 w-36 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                <Skeleton className="h-12 w-full rounded-xl sm:flex-1" />
                <Skeleton className="h-12 w-full rounded-xl sm:flex-1" />
              </div>
            </div>

            <hr className="border-gray-200 dark:border-dark-200" />

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-dark-200">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-dark-200 dark:bg-dark-100">
                <Skeleton className="h-4 w-28 rounded-md" />
              </div>
              <div className="flex justify-between px-4 py-3">
                <Skeleton className="h-4 w-12 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              <div className="flex justify-between border-t border-gray-200 px-4 py-3 dark:border-dark-200">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-10 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10">
          <Skeleton className="mb-3 h-5 w-28 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </section>
    </>
  );
}
