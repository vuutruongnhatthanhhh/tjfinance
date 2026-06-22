function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className ?? ""}`}
      style={{ background: "rgba(45,154,75,0.08)" }}
    />
  );
}

export default function ExpensesLoading() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 sm:px-6 py-4 flex items-center gap-4"
        style={{
          background: "rgba(5, 13, 9, 0.85)",
          borderBottom: "1px solid rgba(45,154,75,0.1)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Skeleton className="w-10 h-10 lg:hidden flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="w-32 h-10 flex-shrink-0" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Filter row */}
        <div className="flex gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}
