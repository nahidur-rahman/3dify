import StorefrontProductGridSkeleton from "./StorefrontProductGridSkeleton";
import Skeleton from "@/components/ui/Skeleton";

export default function HighlightSectionSkeleton({ first = false }: { first?: boolean }) {
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
