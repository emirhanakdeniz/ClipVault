import { useEffect, useRef, useState } from "react";
import type { Snippet } from "../types";
import { relativeTime } from "../lib/time";
import { copyText } from "../lib/clipboard";

interface SnippetCardProps {
  snippet: Snippet;
  selected?: boolean;
  onSelect?: (id: string) => void;
  bulkSelected?: boolean;
  onToggleBulk?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  index: number;
}

export default function SnippetCard({
  snippet,
  selected = false,
  onSelect,
  bulkSelected = false,
  onToggleBulk,
  onToggleFavorite,
  onTogglePin,
  onArchive,
  onRestore,
  onDelete,
  index,
}: SnippetCardProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);

  function handleCopy() {
    copyText(snippet.content).then((ok) => {
      if (!ok) {
        // Clipboard access denied (e.g. non-secure context); no-op.
        return;
      }
      setCopied(true);
      timer.current = window.setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <article
      className={`card card--${snippet.type}${selected ? " card--selected" : ""}`}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      tabIndex={0}
      onClick={() => onSelect?.(snippet.id)}
    >
      <header className="card__header">
        {onToggleBulk && (
          <input
            type="checkbox"
            className={
              bulkSelected
                ? "card__check card__check--checked"
                : "card__check"
            }
            checked={bulkSelected}
            onChange={() => onToggleBulk(snippet.id)}
            onClick={(event) => event.stopPropagation()}
            aria-label={`Select ${snippet.title} for bulk actions`}
          />
        )}
        <h3 className="card__title">{snippet.title}</h3>
        <div className="card__actions">
          <button
            type="button"
            className={
              snippet.pinned ? "card__pin card__pin--active" : "card__pin"
            }
            onClick={() => onTogglePin(snippet.id)}
            aria-label={
              snippet.pinned
                ? `Unpin ${snippet.title}`
                : `Pin ${snippet.title}`
            }
            aria-pressed={snippet.pinned}
          >
            📌
          </button>
          <button
            type="button"
            className={
              snippet.favorite
                ? "card__star card__star--active"
                : "card__star"
            }
            onClick={() => onToggleFavorite(snippet.id)}
            aria-label={
              snippet.favorite
                ? `Remove ${snippet.title} from favorites`
                : `Add ${snippet.title} to favorites`
            }
            aria-pressed={snippet.favorite}
          >
            ★
          </button>
          {onArchive && (
            <button
              type="button"
              className="card__archive"
              onClick={() => onArchive(snippet.id)}
              aria-label={`Archive ${snippet.title}`}
              title="Archive"
            >
              ⌄
            </button>
          )}
          {onRestore && (
            <button
              type="button"
              className="card__restore"
              onClick={() => onRestore(snippet.id)}
              aria-label={`Restore ${snippet.title}`}
              title="Restore"
            >
              ↥
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="card__delete"
              onClick={() => onDelete(snippet.id)}
              aria-label={`Delete ${snippet.title}`}
            >
              ×
            </button>
          )}
        </div>
      </header>
      <pre className="card__preview">{snippet.content}</pre>
      <footer className="card__meta">
        <span className={`card__type card__type--${snippet.type}`}>
          {snippet.type}
        </span>
        {snippet.tags.map((tag) => (
          <span key={tag} className="card__tag">
            #{tag}
          </span>
        ))}
        <span className="card__time">{relativeTime(snippet.createdAt)}</span>
        <button
          type="button"
          className={
            copied ? "card__copy card__copy--done" : "card__copy"
          }
          onClick={handleCopy}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </footer>
    </article>
  );
}

