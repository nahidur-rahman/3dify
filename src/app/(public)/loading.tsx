import Skeleton from "@/components/ui/Skeleton";

function HeroSkeleton() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-gray-800/40 bg-gradient-to-br from-dark via-dark-100 to-primary-950 px-6 py-20 sm:px-10 sm:py-24 lg:px-16">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJIMnYtMmgzNHptMC0zMFYwSDJ2NGgzNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
      <div className="relative text-center">
        <Skeleton className="mx-auto h-7 w-56 rounded-full bg-white/10" />
        <div className="mx-auto mt-8 space-y-4 max-w-4xl">
          <Skeleton className="h-14 w-4/5 mx-auto bg-white/12" />
          <Skeleton className="h-14 w-3/4 mx-auto bg-white/12" />
          <Skeleton className="h-6 w-full max-w-2xl mx-auto bg-white/10" />
          <Skeleton className="h-6 w-5/6 max-w-xl mx-auto bg-white/10" />
        </div>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Skeleton className="h-14 w-full sm:w-44 rounded-full bg-white/12" />
          <Skeleton className="h-14 w-full sm:w-40 rounded-full bg-white/8 border border-white/10" />
        </div>
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-8 w-16 mx-auto bg-white/12" />
              <Skeleton className="h-4 w-20 mx-auto bg-white/8" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark-100 overflow-hidden p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

function FeatureCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-dark-200 bg-white dark:bg-dark-100 p-6 space-y-4">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

function StepSkeleton() {
  return (
    <div className="relative text-center space-y-4">
      <Skeleton className="mx-auto h-20 w-20 rounded-2xl" />
      <Skeleton className="h-5 w-20 mx-auto" />
      <Skeleton className="h-4 w-full max-w-44 mx-auto" />
    </div>
  );
}

function CTAButtonSkeleton() {
  return <Skeleton className="h-12 w-40 rounded-full" />;
}

export default function PublicLoading() {
  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-20">
        <HeroSkeleton />

        <section className="space-y-8">
          <div className="space-y-2 text-center">
            <Skeleton className="h-9 w-64 mx-auto" />
            <Skeleton className="h-5 w-80 mx-auto" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div className="space-y-2 text-center">
            <Skeleton className="h-9 w-56 mx-auto" />
            <Skeleton className="h-5 w-72 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <FeatureCardSkeleton key={index} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-gray-50 dark:bg-dark-100 px-8 py-12 sm:px-12 sm:py-16 space-y-8">
          <div className="space-y-2 text-center">
            <Skeleton className="h-9 w-48 mx-auto" />
            <Skeleton className="h-5 w-72 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <StepSkeleton key={index} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-gradient-to-r from-primary-600 to-primary-800 px-8 py-12 sm:px-12 sm:py-16 text-center space-y-6">
          <div className="space-y-3 max-w-3xl mx-auto">
            <Skeleton className="h-9 w-72 mx-auto bg-white/12" />
            <Skeleton className="h-5 w-full max-w-2xl mx-auto bg-white/10" />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <CTAButtonSkeleton />
            <CTAButtonSkeleton />
          </div>
        </section>
      </div>
    </div>
  );
}