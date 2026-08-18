import type { Snippet } from "../types";

/**
 * Trims leading/trailing whitespace and collapses internal whitespace runs
 * (spaces, tabs, newlines) to a single space, so differently formatted but
 * otherwise identical content compares equal.
 */
export function normalizeContent(content: string): string {
  return content.trim().replace(/\s+/g, " ");
}

/**
 * Returns the first existing snippet whose normalized content matches the
 * normalized input, or null. Case-sensitive; title is not considered.
 */
export function findDuplicate(
  snippets: Snippet[],
  content: string,
): Snippet | null {
  const normalized = normalizeContent(content);
  if (!normalized) return null;
  return (
    snippets.find(
      (snippet) => normalizeContent(snippet.content) === normalized,
    ) ?? null
  );
}
