import Skeleton from "@/components/ui/Skeleton";

interface StorefrontProductGridSkeletonProps {
  count?: number;
  highlights?: boolean;
}

function getHighlightVisibility(index: number) {
  if (index < 6) return "";
  if (index < 8) return "hidden lg:block";
  if (index < 10) return "hidden xl:block";
  if (index < 12) return "hidden 2xl:block";
  return "hidden";
}

export function StorefrontProductCardSkeleton() {
  return (
    <div className="h-full overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm dark:border-dark-200 dark:bg-dark-100 sm:rounded-2xl">
      <Skeleton className="aspect-square w-full rounded-none !bg-gray-100 dark:!bg-dark/60" />
      <div className="space-y-2 p-2.5 sm:p-3">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-11/12 rounded-md" />
          <Skeleton className="h-3.5 w-2/3 rounded-md" />
        </div>
        <Skeleton className="h-4 w-24 rounded-md" />
      </div>
    </div>
  );
}

export default function StorefrontProductGridSkeleton({
  count = 12,
  highlights = false,
}: StorefrontProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={highlights ? getHighlightVisibility(index) : undefined}
        >
          <StorefrontProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}
