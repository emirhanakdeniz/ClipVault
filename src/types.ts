export type SnippetType = "code" | "text" | "link";

/** How a snippet entered the vault: created by the user or auto-captured. */
export type SnippetSource = "manual" | "clipboard";

/** Primary view identifier for navigation and routing. */
export type ViewId = "snippets" | "favorites" | "archive" | "statistics";

export interface Snippet {
  id: string;
  title: string;
  content: string;
  type: SnippetType;
  favorite: boolean;
  pinned: boolean;
  archived: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  source: SnippetSource;
  /** Sensitive snippets have their content hidden until explicitly revealed. */
  sensitive: boolean;
  /** True when the snippet is encrypted and the vault is locked. */
  locked?: boolean;
  /** Number of times this snippet has been copied to the clipboard. */
  copyCount?: number;
}

export interface EncryptionStatus {
  configured: boolean;
  unlocked: boolean;
}

export interface SnippetCopyStat {
  id: string;
  title: string;
  type: SnippetType;
  copyCount: number;
  favorite: boolean;
  sensitive: boolean;
  createdAt: number;
}

export interface UsageStatistics {
  totalSnippets: number;
  activeSnippets: number;
  favoriteSnippets: number;
  pinnedSnippets: number;
  archivedSnippets: number;
  sensitiveSnippets: number;
  totalCopies: number;
  topCopied: SnippetCopyStat[];
  typeCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  totalTags: number;
}

