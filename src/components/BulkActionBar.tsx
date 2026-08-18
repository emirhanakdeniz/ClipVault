import type { ViewId } from "./Sidebar";

interface BulkActionBarProps {
  count: number;
  view: ViewId;
  onSetFavorite: (favorite: boolean) => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export default function BulkActionBar({
  count,
  view,
  onSetFavorite,
  onArchive,
  onRestore,
  onDelete,
  onClear,
}: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="bulkbar" role="toolbar" aria-label="Bulk snippet actions">
      <span className="bulkbar__count">
        {count} selected
      </span>
      <button type="button" className="bulkbar__btn" onClick={() => onSetFavorite(true)}>
        ★ Favorite
      </button>
      <button type="button" className="bulkbar__btn" onClick={() => onSetFavorite(false)}>
        ☆ Unfavorite
      </button>
      {view !== "archive" ? (
        <button type="button" className="bulkbar__btn" onClick={onArchive}>
          ⌄ Archive
        </button>
      ) : (
        <button type="button" className="bulkbar__btn" onClick={onRestore}>
          ↥ Restore
        </button>
      )}
      {view === "archive" && (
        <button
          type="button"
          className="bulkbar__btn bulkbar__btn--danger"
          onClick={onDelete}
        >
          × Delete
        </button>
      )}
      <button type="button" className="bulkbar__btn bulkbar__btn--ghost" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}
