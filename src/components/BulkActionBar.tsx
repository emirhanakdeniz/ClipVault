import type { ViewId } from "../types";
import { IconHeart, IconArchive, IconRestore, IconTrash } from "./Icons";

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
        <IconHeart size={14} filled={true} /> Favorite
      </button>
      <button type="button" className="bulkbar__btn" onClick={() => onSetFavorite(false)}>
        <IconHeart size={14} filled={false} /> Unfavorite
      </button>
      {view !== "archive" ? (
        <button type="button" className="bulkbar__btn" onClick={onArchive}>
          <IconArchive size={14} /> Archive
        </button>
      ) : (
        <button type="button" className="bulkbar__btn" onClick={onRestore}>
          <IconRestore size={14} /> Restore
        </button>
      )}
      {view === "archive" && (
        <button
          type="button"
          className="bulkbar__btn bulkbar__btn--danger"
          onClick={onDelete}
        >
          <IconTrash size={14} /> Delete
        </button>
      )}
      <button type="button" className="bulkbar__btn bulkbar__btn--ghost" onClick={onClear}>
        Clear
      </button>
    </div>
  );
}
