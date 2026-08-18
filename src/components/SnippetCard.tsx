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
  onToggleSensitive?: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUnlockVault?: () => void;
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
  onToggleSensitive,
  onArchive,
  onRestore,
  onDelete,
  onUnlockVault,
  index,
}: SnippetCardProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  // Reveal state is per-snippet and resets whenever a different snippet mounts,
  // so sensitive content is always hidden again by default.
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    setRevealed(false);
  }, [snippet.id, snippet.sensitive, snippet.locked]);

  function handleCopy() {
    if (snippet.locked) {
      onUnlockVault?.();
      return;
    }
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
        <h3 className="card__title">
          {snippet.sensitive && (
            <span
              className="card__sensitive-badge"
              title="Sensitive — content is hidden until revealed"
            >
              🔒
            </span>
          )}
          {snippet.title}
        </h3>
        <div className="card__actions">
          {onToggleSensitive && (
            <button
              type="button"
              className={
                snippet.sensitive
                  ? "card__lock card__lock--active"
                  : "card__lock"
              }
              onClick={() => onToggleSensitive(snippet.id)}
              aria-label={
                snippet.sensitive
                  ? `Mark ${snippet.title} as not sensitive`
                  : `Mark ${snippet.title} as sensitive`
              }
              aria-pressed={snippet.sensitive}
              title={snippet.sensitive ? "Remove sensitive mark" : "Mark as sensitive"}
            >
              🔒
            </button>
          )}
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
      {snippet.sensitive && snippet.locked ? (
        <div className="card__masked card__masked--locked">
          <span className="card__masked-dots" aria-hidden="true">
            ••••••••••••
          </span>
          <span className="card__masked-note">Encrypted & locked</span>
          {onUnlockVault && (
            <button
              type="button"
              className="card__reveal card__reveal--unlock"
              onClick={(event) => {
                event.stopPropagation();
                onUnlockVault();
              }}
            >
              Unlock
            </button>
          )}
        </div>
      ) : snippet.sensitive && !revealed ? (
        <div className="card__masked">
          <span className="card__masked-dots" aria-hidden="true">
            ••••••••••••
          </span>
          <span className="card__masked-note">Sensitive content hidden</span>
          <button
            type="button"
            className="card__reveal"
            onClick={(event) => {
              event.stopPropagation();
              setRevealed(true);
            }}
          >
            Reveal
          </button>
        </div>
      ) : snippet.sensitive && revealed ? (
        <div className="card__revealed">
          <pre className="card__preview">{snippet.content}</pre>
          <button
            type="button"
            className="card__reveal card__reveal--on"
            onClick={(event) => {
              event.stopPropagation();
              setRevealed(false);
            }}
          >
            Hide
          </button>
        </div>
      ) : (
        <pre className="card__preview">{snippet.content}</pre>
      )}
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

