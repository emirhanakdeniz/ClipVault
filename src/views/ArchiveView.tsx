import SnippetCard from "../components/SnippetCard";
import EmptyState from "../components/EmptyState";
import { getVisibleSnippets, hasQuery } from "../lib/search";
import type { SnippetFilters } from "../lib/search";
import type { Snippet } from "../types";

interface ArchiveViewProps {
  snippets: Snippet[];
  query: string;
  filters: SnippetFilters;
  selectedId: string | null;
  onSelect: (id: string) => void;
  bulkIds: string[];
  onToggleBulk: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleSensitive?: (id: string) => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ArchiveView({
  snippets,
  query,
  filters,
  selectedId,
  onSelect,
  bulkIds,
  onToggleBulk,
  onToggleFavorite,
  onTogglePin,
  onToggleSensitive,
  onRestore,
  onDelete,
}: ArchiveViewProps) {
  const visible = getVisibleSnippets(snippets, query, {
    archivedOnly: true,
    filters,
  });

  return (
    <section aria-label="Archive">
      {visible.length === 0 ? (
        hasQuery(query) ? (
          <EmptyState
            glyph="⌕"
            title={`No matches for “${query.trim()}”`}
            hint="Check the spelling, or clear the search."
          />
        ) : (
          <EmptyState
            glyph="▣"
            title="Nothing archived"
            hint="Archived snippets land here instead of being deleted."
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
              onToggleSensitive={onToggleSensitive}
              onRestore={onRestore}
              onDelete={onDelete}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
