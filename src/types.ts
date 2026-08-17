export type SnippetType = "code" | "text" | "link";

export interface Snippet {
  id: string;
  title: string;
  content: string;
  type: SnippetType;
  favorite: boolean;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

