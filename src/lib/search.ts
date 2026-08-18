import type { Snippet } from "../types";

/** Preset date ranges for date-based filtering (rolling windows). */
export type DateRange = "all" | "today" | "week" | "month";

/**
 * Smart search filters applied on top of a view's base snippet set. All
 * active filters combine with the search text using AND.
 */
export interface SnippetFilters {
  /** Keep only favorite snippets. */
  favorite?: boolean;
  /** Keep only pinned snippets. */
  pinned?: boolean;
  /** In normal views, stop excluding archived snippets. */
  includeArchived?: boolean;
  /** Keep only snippets carrying this tag. */
  tag?: string | null;
  /** Keep only snippets created within the range. */
  dateRange?: DateRange;
}

/** True when any filter is active (i.e. not the default state). */
export function hasFilters(filters: SnippetFilters): boolean {
  return (
    filters.favorite === true ||
    filters.pinned === true ||
    filters.includeArchived === true ||
    (filters.tag != null && filters.tag !== "") ||
    (filters.dateRange != null && filters.dateRange !== "all")
  );
}

function dateCutoff(range: DateRange | undefined): number | null {
  const now = Date.now();
  switch (range) {
    case "today": {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      return start.getTime();
    }
    case "week":
      return now - 7 * 24 * 60 * 60 * 1000;
    case "month":
      return now - 30 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

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
 * The single source of truth for which snippets a view shows: view filtering
 * (favorites only, archived/active), smart filters (favorite, pinned,
 * archived, tag, date), search matching, and the pinned-first ordering.
 * Used by every view for rendering and by App for keyboard selection so they
 * can never disagree. There is deliberately no per-view filtering logic.
 *
 * Archived snippets are excluded unless `archivedOnly` is set (the Archive
 * view shows only archived snippets) or the `includeArchived` filter is on.
 */
export function getVisibleSnippets(
  snippets: Snippet[],
  query: string,
  options?: {
    favoritesOnly?: boolean;
    archivedOnly?: boolean;
    filters?: SnippetFilters;
  },
): Snippet[] {
  const { favoritesOnly, archivedOnly, filters } = options ?? {};
  let base = snippets;
  if (favoritesOnly || filters?.favorite) base = base.filter((s) => s.favorite);
  base = archivedOnly
    ? base.filter((s) => s.archived)
    : filters?.includeArchived
      ? base
      : base.filter((s) => !s.archived);
  if (filters?.pinned) base = base.filter((s) => s.pinned);
  const tag = filters?.tag ?? null;
  if (tag) base = base.filter((s) => s.tags.includes(tag));
  const cutoff = dateCutoff(filters?.dateRange);
  if (cutoff !== null) base = base.filter((s) => s.createdAt >= cutoff);
  const matching = base.filter((s) => matchesQuery(s, query));
  return [
    ...matching.filter((s) => s.pinned),
    ...matching.filter((s) => !s.pinned),
  ];
}