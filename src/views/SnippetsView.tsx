import SnippetCard from "../components/SnippetCard";
import EmptyState from "../components/EmptyState";
import { matchesQuery, hasQuery } from "../lib/search";
import type { Snippet } from "../types";

interface SnippetsViewProps {
  snippets: Snippet[];
  query: string;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function SnippetsView({
  snippets,
  query,
  onToggleFavorite,
  onTogglePin,
  onDelete,
}: SnippetsViewProps) {
  const matching = snippets.filter((s) => matchesQuery(s, query));
  // Pinned snippets float to the top; relative order (created_at DESC) is
  // preserved within each group via a stable partition.
  const visible = [
    ...matching.filter((s) => s.pinned),
    ...matching.filter((s) => !s.pinned),
  ];

  return (
    <section aria-label="Snippets">
      {visible.length === 0 ? (
        hasQuery(query) ? (
          <EmptyState
            glyph="⌕"
            title={`No matches for “${query.trim()}”`}
            hint="Check the spelling, or clear the search."
          />
        ) : (
          <EmptyState
            glyph="▤"
            title="Nothing saved yet"
            hint="Save your first snippet with + New."
          />
        )
      ) : (
        <div className="grid">
          {visible.map((snippet, index) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onToggleFavorite={onToggleFavorite}
              onTogglePin={onTogglePin}
              onDelete={onDelete}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}

