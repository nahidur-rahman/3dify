import Skeleton from "@/components/ui/Skeleton";

export default function ConfirmationLoading() {
  return (
    <div className="mx-auto max-w-2xl px-3 py-8 text-center sm:px-6 sm:py-16 lg:px-8">
      <Skeleton className="mx-auto mb-4 h-14 w-14 rounded-full !bg-emerald-100 dark:!bg-emerald-900/30 sm:mb-6 sm:h-20 sm:w-20" />
      <Skeleton className="mx-auto mb-3 h-8 w-40" />
      <Skeleton className="mx-auto h-4 w-80 max-w-full" />

      <div className="mb-5 mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-dark-200 dark:bg-dark-100 sm:mb-8 sm:mt-6 sm:inline-block sm:w-auto sm:rounded-2xl sm:px-8 sm:py-6">
        <Skeleton className="mx-auto mb-2 h-4 w-24" />
        <Skeleton className="mx-auto h-7 w-40" />
      </div>

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 text-left dark:border-dark-200 dark:bg-dark-100 sm:mb-8 sm:rounded-2xl sm:p-6">
        <Skeleton className="mb-3 h-5 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:flex sm:justify-center sm:gap-3">
        <Skeleton className="col-span-2 h-12 w-full rounded-xl sm:col-auto sm:w-36" />
        <Skeleton className="h-12 w-full rounded-xl sm:w-28" />
        <Skeleton className="h-12 w-full rounded-xl sm:w-32" />
      </div>
    </div>
  );
}
