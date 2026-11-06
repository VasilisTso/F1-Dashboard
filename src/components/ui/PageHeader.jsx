// Page title block. `meta` sits under the title (season, round, counts); `actions` on the right.
export function PageHeader({ title, meta, actions, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
      <div className="min-w-0">
        <h1 className="font-display text-4xl uppercase text-ink text-balance sm:text-5xl">{title}</h1>
        {meta && <p className="mt-2 text-sm text-ink-2">{meta}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
