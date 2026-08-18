import SnippetCard from "../components/SnippetCard";
import EmptyState from "../components/EmptyState";
import { getVisibleSnippets, hasQuery } from "../lib/search";
import type { SnippetFilters } from "../lib/search";
import type { Snippet } from "../types";

interface FavoritesViewProps {
  snippets: Snippet[];
  query: string;
  filters: SnippetFilters;
  selectedId: string | null;
  onSelect: (id: string) => void;
  bulkIds: string[];
  onToggleBulk: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onArchive: (id: string) => void;
}

export default function FavoritesView({
  snippets,
  query,
  filters,
  selectedId,
  onSelect,
  bulkIds,
  onToggleBulk,
  onToggleFavorite,
  onTogglePin,
  onArchive,
}: FavoritesViewProps) {
  const visible = getVisibleSnippets(snippets, query, {
    favoritesOnly: true,
    filters,
  });

  return (
    <section aria-label="Favorites">
      {visible.length === 0 ? (
        hasQuery(query) ? (
          <EmptyState
            glyph="⌕"
            title={`No matches for “${query.trim()}”`}
            hint="Check the spelling, or clear the search."
          />
        ) : (
          <EmptyState
            glyph="★"
            title="No favorites yet"
            hint="Star a snippet to keep it within reach."
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
              bulkSelected={bulkIds.includes(snippet.id)}
              onToggleBulk={onToggleBulk}
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

