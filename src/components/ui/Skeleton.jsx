// Loading placeholder block. Pulse is disabled for reduced-motion users.
export function Skeleton({ className = "" }) {
  return <div aria-hidden className={`rounded-panel bg-surface-3 motion-safe:animate-pulse ${className}`} />;
}

// N placeholder rows shaped like StandingsRow.
export function SkeletonRows({ rows = 6, label = "Loading" }) {
  return (
    <div role="status" aria-label={label} className="divide-y divide-line">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4">
          <Skeleton className="h-6 w-7" />
          <Skeleton className="h-8 w-1" />
          <Skeleton className="h-4 flex-1 max-w-48" />
          <Skeleton className="ml-auto h-4 w-12" />
        </div>
      ))}
    </div>
  );
}
