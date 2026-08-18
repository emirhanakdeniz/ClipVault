import { invoke } from "@tauri-apps/api/core";
import type { Snippet, SnippetType } from "../types";

export function listSnippets(): Promise<Snippet[]> {
  return invoke<Snippet[]>("list_snippets");
}

export function createSnippet(input: {
  title: string;
  content: string;
  type: SnippetType;
  tags?: string[];
}): Promise<Snippet> {
  return invoke<Snippet>("create_snippet", {
    title: input.title,
    content: input.content,
    snippetType: input.type,
    tags: input.tags ?? [],
  });
}

export function updateSnippet(
  id: string,
  title: string,
  content: string,
): Promise<Snippet> {
  return invoke<Snippet>("update_snippet", { id, title, content });
}

export function setFavorite(id: string, favorite: boolean): Promise<Snippet> {
  return invoke<Snippet>("set_favorite", { id, favorite });
}

export function setPinned(id: string, pinned: boolean): Promise<Snippet> {
  return invoke<Snippet>("set_pinned", { id, pinned });
}

export function setArchived(
  id: string,
  archived: boolean,
): Promise<Snippet> {
  return invoke<Snippet>("set_archived", { id, archived });
}

export function setSensitive(id: string, sensitive: boolean): Promise<Snippet> {
  return invoke<Snippet>("set_sensitive", { id, sensitive });
}

export function deleteSnippet(id: string): Promise<void> {
  return invoke<void>("delete_snippet", { id });
}

export function exportSnippets(path: string): Promise<number> {
  return invoke<number>("export_snippets", { path });
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

export function importSnippets(path: string): Promise<ImportResult> {
  return invoke<ImportResult>("import_snippets", { path });
}
