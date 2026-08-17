import SnippetCard from "../components/SnippetCard";
import EmptyState from "../components/EmptyState";
import { getVisibleSnippets, hasQuery } from "../lib/search";
import type { Snippet } from "../types";

interface FavoritesViewProps {
  snippets: Snippet[];
  query: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function FavoritesView({
  snippets,
  query,
  selectedId,
  onSelect,
  onToggleFavorite,
  onTogglePin,
  onDelete,
}: FavoritesViewProps) {
  const visible = getVisibleSnippets(snippets, query, { favoritesOnly: true });

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

