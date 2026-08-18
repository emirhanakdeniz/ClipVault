export type SnippetType = "code" | "text" | "link";

/** How a snippet entered the vault: created by the user or auto-captured. */
export type SnippetSource = "manual" | "clipboard";

/** Primary view identifier for navigation and routing. */
export type ViewId = "snippets" | "favorites" | "archive";

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
}

export interface EncryptionStatus {
  configured: boolean;
  unlocked: boolean;
}

