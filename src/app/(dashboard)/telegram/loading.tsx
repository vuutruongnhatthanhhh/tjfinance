function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl ${className ?? ""}`}
      style={{ background: "rgba(45,154,75,0.08)" }}
    />
  );
}

export default function TelegramLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div
        className="sticky top-0 z-10 border-b px-4 py-4 backdrop-blur-xl sm:px-6"
        style={{
          background: "rgba(8,20,12,0.86)",
          borderColor: "rgba(45,154,75,0.12)",
        }}
      >
        <div className="flex items-start gap-3">
          <Skeleton className="mt-1 h-11 w-11 lg:hidden" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 flex-shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-64 max-w-[70vw]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div
            className="rounded-3xl border p-5 sm:p-6"
            style={{
              borderColor: "rgba(45,154,75,0.14)",
              background:
                "linear-gradient(135deg, rgba(45,154,75,0.10), rgba(8,20,12,0.94))",
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-4">
                <Skeleton className="h-7 w-28 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 w-44" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              </div>
              <div className="flex min-w-[280px] flex-col gap-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
          </div>
        </div>
      </div>
    </div>
  );
}
