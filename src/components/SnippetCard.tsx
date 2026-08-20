import { useEffect, useRef, useState } from "react";
import type { Snippet } from "../types";
import { relativeTime } from "../lib/time";
import { copyText } from "../lib/clipboard";
import {
  IconHeart,
  IconBookmark,
  IconLock,
  IconLockOpen,
  IconArchive,
  IconRestore,
  IconTrash,
  IconCopy,
  IconCheck,
} from "./Icons";

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
  onCopy?: (id: string) => void;
  onContextMenu?: (event: React.MouseEvent, snippet: Snippet) => void;
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
  onCopy,
  onContextMenu,
  index,
}: SnippetCardProps) {
  const cardRef = useRef<HTMLElement>(null);
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

  // Smoothly scroll active card into view during keyboard navigation
  useEffect(() => {
    if (selected && cardRef.current) {
      cardRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selected]);

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
      onCopy?.(snippet.id);
      setCopied(true);
      timer.current = window.setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(snippet.id);
    }
  }

  return (
    <article
      ref={cardRef}
      className={`card${selected ? " card--selected" : ""}${bulkSelected ? " card--bulk-selected" : ""}${snippet.pinned ? " card--pinned" : ""}${snippet.sensitive ? " card--sensitive" : ""}${snippet.locked ? " card--locked" : ""}`}
      onClick={() => onSelect?.(snippet.id)}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu?.(event, snippet);
      }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Snippet: ${snippet.title}`}
      data-index={index}
      aria-pressed={selected}
    >
      <header className="card__header">
        {onToggleBulk && (
          <input
            type="checkbox"
            className="card__bulk-checkbox"
            checked={bulkSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleBulk(snippet.id);
            }}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${snippet.title} for bulk actions`}
          />
        )}
        <h3 className="card__title" title={snippet.title}>
          {snippet.title}
        </h3>
        <div className="card__actions" onClick={(e) => e.stopPropagation()}>
          {onToggleSensitive && (
            <button
              type="button"
              className={
                snippet.sensitive
                  ? "card__btn card__btn--lock card__btn--active"
                  : "card__btn card__btn--lock"
              }
              onClick={() => onToggleSensitive(snippet.id)}
              aria-label={
                snippet.sensitive
                  ? `Mark ${snippet.title} as not sensitive`
                  : `Mark ${snippet.title} as sensitive`
              }
              aria-pressed={snippet.sensitive}
              title={
                snippet.sensitive
                  ? "Sensitive snippet (encrypted when vault locked)"
                  : "Mark as sensitive"
              }
            >
              {snippet.sensitive ? (
                <IconLock size={15} />
              ) : (
                <IconLockOpen size={15} />
              )}
            </button>
          )}
          <button
            type="button"
            className={
              snippet.pinned
                ? "card__btn card__btn--pin card__btn--active"
                : "card__btn card__btn--pin"
            }
            onClick={() => onTogglePin(snippet.id)}
            aria-label={
              snippet.pinned
                ? `Unpin ${snippet.title}`
                : `Pin ${snippet.title}`
            }
            aria-pressed={snippet.pinned}
            title={snippet.pinned ? "Unpin snippet (P)" : "Pin to top (P)"}
          >
            <IconBookmark size={15} filled={snippet.pinned} />
          </button>
          <button
            type="button"
            className={
              snippet.favorite
                ? "card__btn card__btn--heart card__btn--active"
                : "card__btn card__btn--heart"
            }
            onClick={() => onToggleFavorite(snippet.id)}
            aria-label={
              snippet.favorite
                ? `Remove ${snippet.title} from favorites`
                : `Add ${snippet.title} to favorites`
            }
            aria-pressed={snippet.favorite}
            title={
              snippet.favorite
                ? "Favorited (Ctrl+D / F)"
                : "Add to favorites (Ctrl+D / F)"
            }
          >
            <IconHeart size={15} filled={snippet.favorite} />
          </button>
          {onArchive && (
            <button
              type="button"
              className="card__btn card__btn--archive"
              onClick={() => onArchive(snippet.id)}
              aria-label={`Archive ${snippet.title}`}
              title="Archive snippet (Del)"
            >
              <IconArchive size={15} />
            </button>
          )}
          {onRestore && (
            <button
              type="button"
              className="card__btn card__btn--restore"
              onClick={() => onRestore(snippet.id)}
              aria-label={`Restore ${snippet.title}`}
              title="Restore from archive"
            >
              <IconRestore size={15} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="card__btn card__btn--delete"
              onClick={() => onDelete(snippet.id)}
              aria-label={`Delete ${snippet.title}`}
              title="Delete permanently"
            >
              <IconTrash size={15} />
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
          title="Copy content to clipboard (Ctrl+C)"
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
        >
          {copied ? (
            <>
              <IconCheck size={13} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <IconCopy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </footer>
    </article>
  );
}
