interface EmptyStateProps {
  glyph: string;
  title: string;
  hint?: string;
}

export default function EmptyState({ glyph, title, hint }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__glyph" aria-hidden="true">
        {glyph}
      </span>
      <span className="empty-state__title">{title}</span>
      {hint && <span className="empty-state__hint">{hint}</span>}
    </div>
  );
}
