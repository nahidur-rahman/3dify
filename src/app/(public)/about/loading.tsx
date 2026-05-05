import Skeleton from "@/components/ui/Skeleton";

function FeatureCardSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200 p-6 space-y-4">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export default function AboutLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <section className="text-center max-w-3xl mx-auto space-y-5">
        <Skeleton className="h-8 w-40 mx-auto rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-14 w-4/5 mx-auto" />
          <Skeleton className="h-14 w-3/4 mx-auto" />
        </div>
        <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
        <Skeleton className="h-6 w-5/6 max-w-xl mx-auto" />
      </section>

      <section className="bg-gray-50 dark:bg-dark-100 rounded-3xl p-8 sm:p-12 space-y-4">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-4/5" />
      </section>

      <section className="space-y-10">
        <div className="text-center space-y-2">
          <Skeleton className="h-9 w-64 mx-auto" />
          <Skeleton className="h-5 w-72 mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <FeatureCardSkeleton key={index} />
          ))}
        </div>
      </section>

      <section className="text-center bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 sm:p-12 space-y-5">
        <Skeleton className="h-8 w-56 mx-auto bg-white/12" />
        <Skeleton className="h-5 w-full max-w-2xl mx-auto bg-white/10" />
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Skeleton className="h-12 w-44 rounded-full bg-white/12" />
          <Skeleton className="h-12 w-40 rounded-full bg-white/8" />
        </div>
      </section>
    </div>
  );
}