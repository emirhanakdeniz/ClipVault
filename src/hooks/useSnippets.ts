import { useEffect, useMemo, useState } from "react";
import type { Snippet, SnippetType, ViewId } from "../types";
import {
  listSnippets,
  createSnippet,
  updateSnippet,
  setFavorite,
  setPinned,
  setArchived,
  setSensitive,
  deleteSnippet,
  exportSnippets,
  importSnippets,
} from "../lib/api";
import { save, open } from "@tauri-apps/plugin-dialog";
import { getVisibleSnippets } from "../lib/search";
import type { SnippetFilters } from "../lib/search";
import { copyText } from "../lib/clipboard";
import { findDuplicate } from "../lib/duplicates";

export function useSnippets() {
  const [activeView, setActiveView] = useState<ViewId>("snippets");
  const [query, setQuery] = useState("");
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bulkIds, setBulkIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<SnippetFilters>({});
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const active = useMemo(() => snippets.filter((s) => !s.archived), [snippets]);
  const favoriteCount = useMemo(
    () => active.filter((s) => s.favorite).length,
    [active],
  );
  const archiveCount = useMemo(
    () => snippets.filter((s) => s.archived).length,
    [snippets],
  );

  // Same list the active view renders; keeps keyboard selection in sync.
  const visible = useMemo(
    () =>
      getVisibleSnippets(snippets, query, {
        favoritesOnly: activeView === "favorites",
        archivedOnly: activeView === "archive",
        filters,
      }),
    [snippets, query, activeView, filters],
  );

  // Unique tags across all snippets, for the tag filter dropdown.
  const allTags = useMemo(
    () =>
      [...new Set(snippets.flatMap((s) => s.tags))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [snippets],
  );

  const reloadSnippets = () => {
    return listSnippets()
      .then((loaded) => {
        setSnippets(loaded);
        setError(null);
      })
      .catch((reason) => setError(String(reason)));
  };

  useEffect(() => {
    void reloadSnippets();
  }, []);

  async function handleCreate(input: {
    title: string;
    content: string;
    type: SnippetType;
    tags?: string[];
    sensitive?: boolean;
  }): Promise<boolean> {
    const duplicate = findDuplicate(snippets, input.content);
    if (duplicate) {
      setDuplicateNotice(
        `Already saved as “${duplicate.title}” — not saved again.`,
      );
      return false;
    }
    try {
      const created = await createSnippet(input);
      setSnippets((prev) => [created, ...prev]);
      setShowForm(false);
      setDuplicateNotice(null);
      setError(null);
      return true;
    } catch (reason) {
      setError(String(reason));
      return false;
    }
  }

  async function toggleFavorite(id: string) {
    const current = snippets.find((s) => s.id === id);
    if (!current) return;
    try {
      const updated = await setFavorite(id, !current.favorite);
      setSnippets((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setError(null);
    } catch (reason) {
      setError(String(reason));
    }
  }

  async function handleUpdate(
    id: string,
    title: string,
    content: string,
  ): Promise<Snippet> {
    try {
      const updated = await updateSnippet(id, title, content);
      setSnippets((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setError(null);
      return updated;
    } catch (reason) {
      setError(String(reason));
      throw reason;
    }
  }

  async function togglePin(id: string) {
    const current = snippets.find((s) => s.id === id);
    if (!current) return;
    try {
      const updated = await setPinned(id, !current.pinned);
      setSnippets((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setError(null);
    } catch (reason) {
      setError(String(reason));
    }
  }

  async function toggleSensitive(id: string) {
    const current = snippets.find((s) => s.id === id);
    if (!current) return;
    try {
      const updated = await setSensitive(id, !current.sensitive);
      setSnippets((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setError(null);
    } catch (reason) {
      setError(String(reason));
    }
  }

  async function handleArchive(id: string) {
    try {
      const updated = await setArchived(id, true);
      setSnippets((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setSelectedId((prev) => (prev === id ? null : prev));
      setError(null);
    } catch (reason) {
      setError(String(reason));
    }
  }

  async function handleRestore(id: string) {
    try {
      const updated = await setArchived(id, false);
      setSnippets((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setError(null);
    } catch (reason) {
      setError(String(reason));
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSnippet(id);
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
      setError(null);
    } catch (reason) {
      setError(String(reason));
    }
  }

  function toggleBulk(id: string) {
    setBulkIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function runBulk(action: (id: string) => Promise<Snippet | null>) {
    const ids = [...bulkIds];
    const results = await Promise.allSettled(ids.map(action));
    const updatedById = new Map<string, Snippet>();
    const removedIds = new Set<string>();
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        if (result.value) updatedById.set(ids[index], result.value);
        else removedIds.add(ids[index]);
      }
    });
    setSnippets((prev) =>
      prev
        .map((s) => updatedById.get(s.id) ?? s)
        .filter((s) => !removedIds.has(s.id)),
    );
    const failed = results.filter((r) => r.status === "rejected");
    setError(
      failed.length > 0
        ? `${failed.length} of ${ids.length} bulk actions failed`
        : null,
    );
    setBulkIds([]);
    setSelectedId((prev) => (ids.includes(prev ?? "") ? null : prev));
  }

  function bulkSetFavorite(favorite: boolean) {
    return runBulk((id) => setFavorite(id, favorite));
  }

  function bulkArchive() {
    return runBulk((id) => setArchived(id, true));
  }

  function bulkRestore() {
    return runBulk((id) => setArchived(id, false));
  }

  function bulkDelete() {
    return runBulk((id) => deleteSnippet(id).then(() => null));
  }

  async function handleExport() {
    try {
      const path = await save({
        title: "Export snippets",
        defaultPath: "clipvault-snippets.json",
        filters: [{ name: "ClipVault JSON", extensions: ["json"] }],
      });
      if (!path) return;
      const count = await exportSnippets(path);
      setStatusNotice(`Exported ${count} snippet${count === 1 ? "" : "s"}.`);
      setError(null);
    } catch (reason) {
      setError(String(reason));
    }
  }

  async function handleImport() {
    try {
      const path = await open({
        title: "Import snippets",
        multiple: false,
        directory: false,
        filters: [{ name: "ClipVault JSON", extensions: ["json"] }],
      });
      if (!path) return;
      const result = await importSnippets(path);
      const loaded = await listSnippets();
      setSnippets(loaded);
      const skipped =
        result.skipped > 0
          ? ` (${result.skipped} duplicate${result.skipped === 1 ? "" : "s"} skipped)`
          : "";
      setStatusNotice(
        `Imported ${result.imported} snippet${result.imported === 1 ? "" : "s"}${skipped}.`,
      );
      setError(null);
    } catch (reason) {
      setError(String(reason));
    }
  }

  function selectNext() {
    if (visible.length === 0) return;
    const index = visible.findIndex((s) => s.id === selectedId);
    const next = index === -1 ? 0 : Math.min(index + 1, visible.length - 1);
    setSelectedId(visible[next].id);
  }

  function selectPrevious() {
    if (visible.length === 0) return;
    const index = visible.findIndex((s) => s.id === selectedId);
    setSelectedId(visible[index <= 0 ? 0 : index - 1].id);
  }

  async function copySelected() {
    const current = visible.find((s) => s.id === selectedId);
    if (!current) return;
    const ok = await copyText(current.content);
    if (!ok) {
      setError("Clipboard access denied or unavailable");
    } else {
      setStatusNotice(`Copied “${current.title}” to clipboard.`);
      window.setTimeout(() => setStatusNotice(null), 1500);
    }
  }

  function handleClipboardCapture(captured: Snippet) {
    setSnippets((prev) => [captured, ...prev]);
    setError(null);
  }

  function handleClipboardRemove(removedIds: string[]) {
    const removed = new Set(removedIds);
    setSnippets((prev) => prev.filter((s) => !removed.has(s.id)));
    setSelectedId((current) =>
      current && removed.has(current) ? null : current,
    );
    setBulkIds((prev) => prev.filter((id) => !removed.has(id)));
  }

  const editing = snippets.find((s) => s.id === selectedId) ?? null;

  return {
    activeView,
    setActiveView,
    query,
    setQuery,
    snippets,
    error,
    setError,
    showForm,
    setShowForm,
    selectedId,
    setSelectedId,
    bulkIds,
    setBulkIds,
    filters,
    setFilters,
    duplicateNotice,
    setDuplicateNotice,
    statusNotice,
    setStatusNotice,
    active,
    favoriteCount,
    archiveCount,
    visible,
    allTags,
    editing,
    handleCreate,
    handleUpdate,
    toggleFavorite,
    togglePin,
    toggleSensitive,
    handleArchive,
    handleRestore,
    handleDelete,
    toggleBulk,
    bulkSetFavorite,
    bulkArchive,
    bulkRestore,
    bulkDelete,
    handleExport,
    handleImport,
    selectNext,
    selectPrevious,
    copySelected,
    handleClipboardCapture,
    handleClipboardRemove,
    reloadSnippets,
  };
}
