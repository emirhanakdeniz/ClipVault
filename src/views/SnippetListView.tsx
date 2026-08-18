import SnippetCard from "../components/SnippetCard";
import EmptyState from "../components/EmptyState";
import { getVisibleSnippets, hasQuery } from "../lib/search";
import type { SnippetFilters } from "../lib/search";
import type { Snippet, ViewId } from "../types";

export interface SnippetListViewProps {
  view: ViewId;
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
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUnlockVault?: () => void;
  onCopy?: (id: string) => void;
  onContextMenu?: (event: React.MouseEvent, snippet: Snippet) => void;
}

const VIEW_METADATA: Record<
  ViewId,
  { label: string; emptyGlyph: string; emptyTitle: string; emptyHint: string }
> = {
  snippets: {
    label: "Snippets",
    emptyGlyph: "▤",
    emptyTitle: "Nothing saved yet",
    emptyHint: "Save your first snippet with + New.",
  },
  favorites: {
    label: "Favorites",
    emptyGlyph: "★",
    emptyTitle: "No favorites yet",
    emptyHint: "Star a snippet to keep it within reach.",
  },
  archive: {
    label: "Archive",
    emptyGlyph: "▣",
    emptyTitle: "Nothing archived",
    emptyHint: "Archived snippets land here instead of being deleted.",
  },
  statistics: {
    label: "Statistics",
    emptyGlyph: "📊",
    emptyTitle: "Statistics",
    emptyHint: "View your local usage statistics.",
  },
  settings: {
    label: "Settings",
    emptyGlyph: "⚙",
    emptyTitle: "Settings",
    emptyHint: "Configure your preferences.",
  },
};

export default function SnippetListView({
  view,
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
  onArchive,
  onRestore,
  onDelete,
  onUnlockVault,
  onCopy,
  onContextMenu,
}: SnippetListViewProps) {
  const visible = getVisibleSnippets(snippets, query, {
    favoritesOnly: view === "favorites",
    archivedOnly: view === "archive",
    filters,
  });

  const meta = VIEW_METADATA[view];

  return (
    <section aria-label={meta.label}>
      {visible.length === 0 ? (
        hasQuery(query) ? (
          <EmptyState
            glyph="⌕"
            title={`No matches for “${query.trim()}”`}
            hint="Check the spelling, or clear the search."
          />
        ) : (
          <EmptyState
            glyph={meta.emptyGlyph}
            title={meta.emptyTitle}
            hint={meta.emptyHint}
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
              onArchive={view !== "archive" ? onArchive : undefined}
              onRestore={view === "archive" ? onRestore : undefined}
              onDelete={view === "archive" ? onDelete : undefined}
              onUnlockVault={onUnlockVault}
              onCopy={onCopy}
              onContextMenu={onContextMenu}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}
