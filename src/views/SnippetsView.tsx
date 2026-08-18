import SnippetListView from "./SnippetListView";
import type { SnippetFilters } from "../lib/search";
import type { Snippet } from "../types";

export interface SnippetsViewProps {
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
  onArchive: (id: string) => void;
}

export default function SnippetsView(props: SnippetsViewProps) {
  return <SnippetListView view="snippets" {...props} />;
}


