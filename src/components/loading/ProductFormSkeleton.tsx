import Skeleton from "@/components/ui/Skeleton";

function SectionHeadingSkeleton({ badge = false }: { badge?: boolean }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="space-y-1.5">
        <Skeleton className="h-2.5 w-24 rounded-md" />
        <Skeleton className="h-4 w-36 rounded-md" />
      </div>
      {badge ? <Skeleton className="h-5 w-16 rounded-full" /> : null}
    </div>
  );
}

function FieldSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-3 w-24 rounded-md" />
      <Skeleton className={`${tall ? "h-20" : "h-10"} w-full rounded-xl`} />
    </div>
  );
}

function FormSection({
  children,
  className = "",
  badge = false,
}: {
  children: React.ReactNode;
  className?: string;
  badge?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-gray-200/80 bg-white/90 p-3 shadow-sm dark:border-dark-200 dark:bg-dark-100/90 sm:p-4 ${className}`}
    >
      <SectionHeadingSkeleton badge={badge} />
      {children}
    </section>
  );
}

export default function ProductFormSkeleton({ mode }: { mode: "create" | "edit" }) {
  return (
    <div>
      <div className={`${mode === "create" ? "mb-5" : "mb-8"} space-y-2`}>
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-64 rounded-md" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-4 xl:contents">
          <FormSection className="xl:col-start-1 xl:row-start-1" badge>
            <div className="grid gap-3">
              <FieldSkeleton />
              <FieldSkeleton tall />
            </div>
          </FormSection>

          <FormSection className="xl:col-start-1 xl:row-start-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldSkeleton />
              <FieldSkeleton />
            </div>
          </FormSection>
        </div>

        <div className="space-y-4 xl:contents">
          <FormSection className="xl:col-start-2 xl:row-start-1">
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <FieldSkeleton key={index} />
              ))}
            </div>
          </FormSection>

          <FormSection className="xl:col-start-1 xl:row-start-3">
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-10">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="mt-3 h-8 w-52 rounded-full" />
          </FormSection>

          <FormSection className="xl:col-start-2 xl:row-start-2">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full rounded-xl" />
              ))}
            </div>
          </FormSection>
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row xl:col-span-2">
          <Skeleton className="h-9 w-full rounded-xl sm:w-36" />
          <Skeleton className="h-9 w-full rounded-xl sm:w-24" />
        </div>
      </div>
    </div>
  );
}
