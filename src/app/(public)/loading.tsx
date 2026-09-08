import StorefrontProductGridSkeleton from "@/components/loading/StorefrontProductGridSkeleton";
import Skeleton from "@/components/ui/Skeleton";

function HeroSkeleton() {
  return (
    <section className="mx-auto max-w-7xl rounded-b-3xl bg-white px-3 py-3 dark:bg-dark sm:px-6 sm:py-5 lg:px-8 lg:py-6">
      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-dark-100 sm:rounded-3xl lg:min-h-[430px] lg:flex-row xl:min-h-[450px]">
        <div className="relative z-20 flex flex-col justify-center p-5 sm:p-7 md:p-9 lg:w-5/12 lg:px-10 lg:py-8 xl:px-12 xl:py-10">
          <Skeleton className="mb-2 h-4 w-40 rounded-md sm:w-48" />
          <div className="mb-3 space-y-2.5 sm:mb-4">
            <Skeleton className="h-8 w-full max-w-md sm:h-10 lg:h-12" />
            <Skeleton className="h-8 w-5/6 max-w-sm sm:h-10 lg:h-12" />
          </div>
          <div className="mb-5 space-y-2 sm:mb-6 lg:mb-7">
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-4/5 max-w-sm" />
          </div>
          <Skeleton className="h-10 w-40 rounded-xl sm:h-11 sm:w-44" />
        </div>

        <div className="flex items-center justify-center border-t border-gray-200 bg-gray-100 p-4 dark:border-white/10 dark:bg-dark-200 lg:w-7/12 lg:border-l lg:border-t-0 lg:p-5 xl:p-6">
          <div className="grid h-full max-h-[360px] w-full grid-cols-2 gap-3 sm:max-h-[400px] sm:gap-4 lg:max-h-[430px] xl:max-h-[450px]">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="relative flex aspect-square items-end overflow-hidden rounded-2xl border border-gray-300/40 bg-gray-200 dark:border-white/5 dark:bg-dark-300 md:aspect-auto"
              >
                <div className="w-full bg-gradient-to-t from-gray-300/80 to-transparent p-3 dark:from-dark/70 sm:p-4">
                  <Skeleton className="mx-auto h-3.5 w-24 !bg-gray-400/50 dark:!bg-gray-300/30 sm:h-4 sm:w-28" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoriesSkeleton() {
  return (
    <section className="mx-4 mb-4 mt-4 max-w-7xl rounded-3xl bg-white pb-6 pt-1 dark:bg-dark sm:mx-auto sm:mb-6 sm:mt-6 sm:pb-7 sm:pt-1.5">
      <div className="px-4 pt-1 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <Skeleton className="h-7 w-44 sm:h-8 sm:w-52" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
        <div className="flex items-start gap-2 overflow-hidden px-1 py-1 sm:gap-3 md:gap-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="flex min-w-[64px] max-w-[105px] flex-1 shrink-0 flex-col items-center gap-2"
            >
              <Skeleton className="h-12 w-12 rounded-full !bg-gray-100 dark:!bg-dark-200 sm:h-16 sm:w-16" />
              <Skeleton className="h-3 w-14 rounded-md sm:w-16" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HighlightSectionSkeleton({ first = false }: { first?: boolean }) {
  return (
    <section className={`${first ? "mt-8 " : ""}border-t border-gray-100 pb-12 pt-8 dark:border-white/10`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-7 w-44 sm:w-52" />
          <Skeleton className="h-4 w-14 rounded-md" />
        </div>
        <StorefrontProductGridSkeleton highlights />
      </div>
    </section>
  );
}

export default function PublicLoading() {
  return (
    <div>
      <HeroSkeleton />
      <CategoriesSkeleton />
      <HighlightSectionSkeleton first />
      <HighlightSectionSkeleton />
    </div>
  );
}
