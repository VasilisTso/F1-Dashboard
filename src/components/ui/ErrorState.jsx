import { LuTriangleAlert, LuRotateCw } from "react-icons/lu";
import { useT } from "../../i18n/LanguageContext";

// Inline error / empty message. Pass `onRetry` to show a retry button (e.g. query.refetch).
// `titleAs="h1"` when the state replaces a whole page (not found), so the page keeps a heading.
export function ErrorState({
  title,
  message,
  onRetry,
  tone = "error",
  className = "",
  titleAs = "p",
}) {
  const t = useT();
  // Defaults describe the usual failure (Jolpica rate limiting). Pass `message={null}` for none.
  title ??= t("common.error.title");
  if (message === undefined) message = t("common.error.message");
  const isError = tone === "error";
  const Title = titleAs;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex flex-col items-start gap-3 rounded-panel border border-line bg-surface-2 p-5 ${className}`}
    >
      <div className="flex items-center gap-2">
        {isError && <LuTriangleAlert className="size-5 shrink-0 text-danger" aria-hidden />}
        <Title className="font-semibold text-ink">{title}</Title>
      </div>
      {message && <p className="max-w-prose text-sm text-ink-2">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={() => onRetry()}
          className="inline-flex h-10 items-center gap-2 rounded-panel border border-line-strong px-4 text-sm font-medium text-ink hover:bg-surface-3 transition-colors duration-150"
        >
          <LuRotateCw className="size-4" aria-hidden />
          {t("common.error.retry")}
        </button>
      )}
    </div>
  );
}
