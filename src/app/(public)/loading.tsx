import Skeleton from "@/components/ui/Skeleton";

function HeroSkeleton() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-dark to-primary-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.18),_transparent_22%)]" />

      <div className="relative max-w-7xl mx-auto px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <Skeleton className="mb-3 h-7 w-56 rounded-full bg-white/10" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-full max-w-[34rem] bg-white/12 sm:h-14" />
              <Skeleton className="h-12 w-full max-w-[28rem] bg-white/12 sm:h-14" />
              <Skeleton className="h-12 w-full max-w-[22rem] bg-white/12 sm:h-14" />
            </div>
            <div className="mt-3 space-y-2.5 max-w-2xl">
              <Skeleton className="h-5 w-full bg-white/10" />
              <Skeleton className="h-5 w-11/12 bg-white/10" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Skeleton className="h-8 w-36 rounded-full bg-white/10" />
              <Skeleton className="h-8 w-36 rounded-full bg-white/10" />
              <Skeleton className="h-8 w-52 rounded-full bg-white/10" />
            </div>
            <div className="mt-6 flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
              <Skeleton className="h-11 w-full rounded-full bg-white/12 sm:w-40" />
              <Skeleton className="h-11 w-full rounded-full border border-white/10 bg-white/8 sm:w-36" />
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-center backdrop-blur-sm"
                >
                  <Skeleton className="mx-auto h-8 w-16 bg-white/12" />
                  <Skeleton className="mx-auto mt-2 h-3 w-20 bg-white/8" />
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary-500/20 to-transparent blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/8 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur-sm">
              <div className="grid gap-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <Skeleton className="h-3 w-24 bg-white/10" />
                    <Skeleton className="h-6 w-24 rounded-full bg-emerald-400/15" />
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-12 rounded-2xl bg-white/8" />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-[1.1fr_0.9fr] gap-3">
                  <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-primary-500/15 to-primary-900/20 p-4">
                    <Skeleton className="h-3 w-24 bg-white/10" />
                    <div className="mt-3 space-y-2">
                      <Skeleton className="h-8 w-full bg-white/12" />
                      <Skeleton className="h-8 w-4/5 bg-white/12" />
                    </div>
                    <div className="mt-3 space-y-2">
                      <Skeleton className="h-4 w-full bg-white/8" />
                      <Skeleton className="h-4 w-5/6 bg-white/8" />
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                    <Skeleton className="h-3 w-20 bg-white/10" />
                    <Skeleton className="mt-3 h-10 w-32 bg-white/12" />
                    <div className="mt-3 space-y-2">
                      <Skeleton className="h-4 w-full bg-white/8" />
                      <Skeleton className="h-4 w-5/6 bg-white/8" />
                      <Skeleton className="h-4 w-4/6 bg-white/8" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeaderSkeleton() {
  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <Skeleton className="mb-2 h-6 w-40 rounded-full" />
        <Skeleton className="h-8 w-56 sm:h-9 sm:w-64" />
        <Skeleton className="mt-2 h-5 w-full max-w-xl" />
      </div>
      <Skeleton className="h-14 w-full rounded-2xl lg:w-80" />
    </div>
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
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary-600 to-primary-800 px-5 py-6 text-center shadow-2xl shadow-primary-900/20 sm:px-8">
            <div className="mx-auto max-w-3xl space-y-3">
              <Skeleton className="mx-auto h-9 w-72 bg-white/12" />
              <Skeleton className="mx-auto h-5 w-full max-w-2xl bg-white/10" />
            </div>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <CTAButtonSkeleton />
              <CTAButtonSkeleton />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}