// Raised panel. `title` renders a section heading row with an optional `action` on the right.
export function Card({ title, action, as = "section", className = "", bodyClassName = "", children, ...rest }) {
  const Tag = as;
  return (
    <Tag className={`rounded-panel border border-line bg-surface-2 shadow-raised ${className}`} {...rest}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          {title && <h2 className="font-display text-lg uppercase text-ink">{title}</h2>}
          {action}
        </header>
      )}
      <div className={bodyClassName || "p-4 sm:p-5"}>{children}</div>
    </Tag>
  );
}
