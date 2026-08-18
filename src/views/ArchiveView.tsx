import SnippetListView from "./SnippetListView";
import type { SnippetFilters } from "../lib/search";
import type { Snippet } from "../types";

export interface ArchiveViewProps {
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

export default function ArchiveView(props: ArchiveViewProps) {
  return <SnippetListView view="archive" {...props} />;
}

