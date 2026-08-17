import type { Snippet } from "../types";

/**
 * Case-insensitive substring match over a snippet's title and content.
 * Whitespace-only queries match everything.
 */
export function matchesQuery(snippet: Snippet, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    snippet.title.toLowerCase().includes(q) ||
    snippet.content.toLowerCase().includes(q)
  );
}

/** True when the query contains non-whitespace characters. */
export function hasQuery(query: string): boolean {
  return query.trim().length > 0;
}