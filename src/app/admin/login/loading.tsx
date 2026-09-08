import Skeleton from "@/components/ui/Skeleton";

export default function AdminLoginLoading() {
  return (
    <div className="flex min-h-[80dvh] items-center justify-center px-4 py-6 sm:min-h-[80vh] sm:py-0">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Skeleton className="mx-auto mb-4 h-[61px] w-44 rounded-lg" />
          <Skeleton className="mx-auto h-7 w-36" />
          <Skeleton className="mx-auto mt-2 h-4 w-52" />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-dark-200 dark:bg-dark-100">
          <div className="space-y-5 p-4 sm:p-8">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-1.5">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-12 w-full rounded-xl !bg-white dark:!bg-dark" />
              </div>
            ))}
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
