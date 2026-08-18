import SnippetCard from "../components/SnippetCard";
import EmptyState from "../components/EmptyState";
import { getVisibleSnippets, hasQuery } from "../lib/search";
import type { Snippet } from "../types";

interface SnippetsViewProps {
  snippets: Snippet[];
  query: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onArchive: (id: string) => void;
}

export default function SnippetsView({
  snippets,
  query,
  selectedId,
  onSelect,
  onToggleFavorite,
  onTogglePin,
  onArchive,
}: SnippetsViewProps) {
  const visible = getVisibleSnippets(snippets, query);

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
              selected={snippet.id === selectedId}
              onSelect={onSelect}
              onToggleFavorite={onToggleFavorite}
              onTogglePin={onTogglePin}
              onArchive={onArchive}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}

