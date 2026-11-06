import { LuTriangleAlert, LuRotateCw } from "react-icons/lu";

// Inline error / empty message. Pass `onRetry` to show a retry button (e.g. query.refetch).
export function ErrorState({
  title = "Couldn't load data",
  message = "The F1 data service didn't respond. It may be rate limiting requests; try again in a moment.",
  onRetry,
  tone = "error",
  className = "",
}) {
  const isError = tone === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex flex-col items-start gap-3 rounded-panel border border-line bg-surface-2 p-5 ${className}`}
    >
      <div className="flex items-center gap-2">
        {isError && <LuTriangleAlert className="size-5 shrink-0 text-danger" aria-hidden />}
        <p className="font-semibold text-ink">{title}</p>
      </div>
      {message && <p className="max-w-prose text-sm text-ink-2">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={() => onRetry()}
          className="inline-flex h-10 items-center gap-2 rounded-panel border border-line-strong px-4 text-sm font-medium text-ink hover:bg-surface-3 transition-colors duration-150"
        >
          <LuRotateCw className="size-4" aria-hidden />
          Try again
        </button>
      )}
    </div>
  );
}
