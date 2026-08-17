import { useEffect, useRef, useState } from "react";
import type { Snippet } from "../types";
import { relativeTime } from "../lib/time";

interface SnippetCardProps {
  snippet: Snippet;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
}

export default function SnippetCard({
  snippet,
  onToggleFavorite,
  onTogglePin,
  onDelete,
  index,
}: SnippetCardProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(timer.current);
  }, []);

  function handleCopy() {
    navigator.clipboard
      .writeText(snippet.content)
      .then(() => {
        setCopied(true);
        timer.current = window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // Clipboard access denied (e.g. non-secure context); no-op in mock phase.
      });
  }

  return (
    <article
      className={`card card--${snippet.type}`}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <header className="card__header">
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
          <button
            type="button"
            className="card__delete"
            onClick={() => onDelete(snippet.id)}
            aria-label={`Delete ${snippet.title}`}
          >
            ×
          </button>
        </div>
      </header>
      <pre className="card__preview">{snippet.content}</pre>
      <footer className="card__meta">
        <span className={`card__type card__type--${snippet.type}`}>
          {snippet.type}
        </span>
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

