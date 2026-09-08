import Skeleton from "@/components/ui/Skeleton";

export default function ProductCatalogFilterSkeleton() {
  return (
    <div className="mb-4 rounded-2xl border border-gray-200/70 bg-white/85 p-3 shadow-sm dark:border-dark-200 dark:bg-dark-100/85 sm:mb-6 sm:rounded-[1.5rem] sm:p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,0.9fr)]">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-11 w-full rounded-xl !bg-gray-100 dark:!bg-dark"
          />
        ))}
      </div>
    </div>
  );
}
