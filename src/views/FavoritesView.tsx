import SnippetCard from "../components/SnippetCard";
import EmptyState from "../components/EmptyState";
import type { Snippet } from "../types";

interface FavoritesViewProps {
  snippets: Snippet[];
  query: string;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function FavoritesView({
  snippets,
  query,
  onToggleFavorite,
  onDelete,
}: FavoritesViewProps) {
  const q = query.trim().toLowerCase();
  const favorites = snippets.filter((s) => s.favorite);
  const visible = q
    ? favorites.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q),
      )
    : favorites;

  return (
    <section aria-label="Favorites">
      {visible.length === 0 ? (
        q ? (
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
              onToggleFavorite={onToggleFavorite}
              onDelete={onDelete}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}

