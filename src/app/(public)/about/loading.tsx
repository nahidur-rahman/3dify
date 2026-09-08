import Skeleton from "@/components/ui/Skeleton";

function FeatureCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-dark-200 dark:bg-dark-100">
      <Skeleton className="mb-3 h-10 w-10 rounded-xl" />
      <Skeleton className="mb-2 h-5 w-32 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
      </div>
    </div>
  );
}

export default function AboutLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 max-w-4xl text-center">
        <Skeleton className="mx-auto mb-4 h-6 w-28 rounded-full" />
        <div className="space-y-2.5">
          <Skeleton className="mx-auto h-9 w-11/12 max-w-2xl sm:h-11" />
          <Skeleton className="mx-auto h-9 w-3/4 max-w-xl sm:h-11" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="mx-auto h-4 w-full max-w-3xl sm:h-5" />
          <Skeleton className="mx-auto h-4 w-11/12 max-w-2xl sm:h-5" />
          <Skeleton className="mx-auto h-4 w-3/4 max-w-xl sm:h-5" />
        </div>
      </div>

      <div className="mb-12 rounded-[2rem] border border-gray-200/70 bg-gray-50/80 p-6 shadow-sm dark:border-dark-200 dark:bg-dark-100/80 sm:p-8">
        <Skeleton className="mb-3 h-7 w-56 sm:h-8" />
        <div className="space-y-2.5">
          <Skeleton className="h-4 w-full sm:h-5" />
          <Skeleton className="h-4 w-full sm:h-5" />
          <Skeleton className="h-4 w-11/12 sm:h-5" />
          <Skeleton className="h-4 w-3/4 sm:h-5" />
        </div>
      </div>

      <div className="mb-12">
        <Skeleton className="mx-auto mb-8 h-8 w-56 sm:h-9" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <FeatureCardSkeleton key={index} />
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-center shadow-2xl shadow-primary-900/20 sm:p-8">
        <Skeleton className="mx-auto mb-3 h-7 w-56 !bg-white/20 sm:h-8" />
        <div className="mx-auto mb-5 max-w-xl space-y-2">
          <Skeleton className="h-4 w-full !bg-white/15" />
          <Skeleton className="mx-auto h-4 w-4/5 !bg-white/15" />
        </div>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Skeleton className="h-11 w-full rounded-full !bg-white/20 sm:w-44" />
          <Skeleton className="h-11 w-full rounded-full !bg-white/15 sm:w-40" />
        </div>
      </div>
    </div>
  );
}
