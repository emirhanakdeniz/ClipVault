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

/**
 * True when the query contains non-whitespace characters. */
export function hasQuery(query: string): boolean {
  return query.trim().length > 0;
}

/**
 * The single source of truth for which snippets a view shows:
 * view filtering (favorites only, archived/active), search matching,
 * and the pinned-first ordering. Used by both views for rendering and
 * by App for keyboard selection so they can never disagree.
 *
 * Archived snippets are excluded unless `archivedOnly` is set (the
 * Archive view shows only archived snippets).
 */
export function getVisibleSnippets(
  snippets: Snippet[],
  query: string,
  options?: { favoritesOnly?: boolean; archivedOnly?: boolean },
): Snippet[] {
  let base = snippets;
  if (options?.favoritesOnly) base = base.filter((s) => s.favorite);
  base = options?.archivedOnly
    ? base.filter((s) => s.archived)
    : base.filter((s) => !s.archived);
  const matching = base.filter((s) => matchesQuery(s, query));
  return [
    ...matching.filter((s) => s.pinned),
    ...matching.filter((s) => !s.pinned),
  ];
}