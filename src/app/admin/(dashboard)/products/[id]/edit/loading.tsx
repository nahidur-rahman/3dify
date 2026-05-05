import Skeleton from "@/components/ui/Skeleton";

function FormFieldSkeleton({ width = "w-full" }: { width?: string }) {
  return <Skeleton className={`h-12 ${width}`} />;
}

export default function EditProductLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-72" />
      </div>

      <FormFieldSkeleton />
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-32 w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-20 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-6 w-32 rounded-full" />
        ))}
      </div>

      <div className="flex gap-4 pt-2">
        <Skeleton className="h-12 w-40 rounded-xl" />
        <Skeleton className="h-12 w-28 rounded-xl" />
      </div>
    </div>
  );
}