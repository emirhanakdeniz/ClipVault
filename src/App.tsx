import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import SearchBar from "./components/SearchBar";
import NewSnippetForm from "./components/NewSnippetForm";
import QuickCapture from "./components/QuickCapture";
import SnippetEditor from "./components/SnippetEditor";
import SnippetsView from "./views/SnippetsView";
import FavoritesView from "./views/FavoritesView";
import ArchiveView from "./views/ArchiveView";
import BulkActionBar from "./components/BulkActionBar";
import FilterBar from "./components/FilterBar";
import type { ViewId } from "./components/Sidebar";
import type { Snippet, SnippetType } from "./types";
import {
  listSnippets,
  createSnippet,
  updateSnippet,
  setFavorite,
  setPinned,
  setArchived,
  deleteSnippet,
  exportSnippets,
  importSnippets,
} from "./lib/api";
import { save, open } from "@tauri-apps/plugin-dialog";
import { getVisibleSnippets } from "./lib/search";
import type { SnippetFilters } from "./lib/search";
import { copyText } from "./lib/clipboard";
import { findDuplicate } from "./lib/duplicates";
import useShortcuts from "./hooks/useShortcuts";
import useGlobalQuickCapture from "./hooks/useGlobalQuickCapture";
import ShortcutSettings from "./components/ShortcutSettings";

export default function App() {
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

  const active = snippets.filter((s) => !s.archived);
  const favoriteCount = active.filter((s) => s.favorite).length;
  const archiveCount = snippets.filter((s) => s.archived).length;

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

  useEffect(() => {
    listSnippets()
      .then((loaded) => {
        setSnippets(loaded);
        setError(null);
      })
      .catch((reason) => setError(String(reason)));
  }, []);

  async function handleCreate(input: {
    title: string;
    content: string;
    type: SnippetType;
    tags?: string[];
  }): Promise<boolean> {
    // Prevent accidental duplicates (whitespace-normalized comparison).
    // Existing snippets are never deleted or merged; the form stays open so
    // the user can edit the content or cancel.
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

  async function runBulk(
    action: (id: string) => Promise<Snippet | null>,
  ) {
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
      if (!path) return; // user cancelled
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
      if (!path) return; // user cancelled
      const result = await importSnippets(path);
      // Re-fetch so the list reflects exactly what landed in SQLite.
      const loaded = await listSnippets();
      setSnippets(loaded);
      const skipped =
        result.skipped > 0 ? ` (${result.skipped} duplicate${result.skipped === 1 ? "" : "s"} skipped)` : "";
      setStatusNotice(`Imported ${result.imported} snippet${result.imported === 1 ? "" : "s"}${skipped}.`);
      setError(null);
    } catch (reason) {
      // Validation or parse failure: nothing was written to the database.
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
    await copyText(current.content);
  }

  useShortcuts({
    focusSearch: () =>
      document.querySelector<HTMLInputElement>(".searchbar__input")?.focus(),
    focusQuickCapture: () =>
      document
        .querySelector<HTMLInputElement>(".quickcapture__content")
        ?.focus(),
    newSnippet: () => setShowForm((open) => !open),
    copySelected,
    toggleFavorite: () => {
      if (selectedId) toggleFavorite(selectedId);
    },
    selectPrevious,
    selectNext,
    clearSelection: () => {
      setSelectedId(null);
      setBulkIds([]);
    },
  });

  // System-wide Quick Capture shortcut: brings the window forward from any
  // app and focuses the capture input (same target as the in-app Ctrl+I).
  const globalQuickCapture = useGlobalQuickCapture(() =>
    document
      .querySelector<HTMLInputElement>(".quickcapture__content")
      ?.focus(),
  );

  // The snippet being edited. Keyed by id so the editor's draft resets only
  // when a different snippet is selected — never when this prop refreshes.
  const editing = snippets.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="app">
      <Sidebar
        activeView={activeView}
        onSelect={(view) => {
          setActiveView(view);
          setBulkIds([]);
          setFilters({});
        }}
        snippetCount={active.length}
        favoriteCount={favoriteCount}
        archiveCount={archiveCount}
        onExport={handleExport}
        onImport={handleImport}
        footerExtra={
          <ShortcutSettings
            setting={globalQuickCapture.setting}
            status={globalQuickCapture.status}
            message={globalQuickCapture.message}
            onChange={globalQuickCapture.update}
          />
        }
      />
      <main className="content">
        <div className="toolbar">
          <SearchBar query={query} onChange={setQuery} />
          <QuickCapture
            onCreate={handleCreate}
            notice={duplicateNotice}
            onDismissNotice={() => setDuplicateNotice(null)}
          />
          <button
            className="toolbar__new"
            type="button"
            onClick={() => setShowForm((visible) => !visible)}
            title="New snippet (Ctrl+N)"
          >
            + New
          </button>
        </div>
        <FilterBar view={activeView} filters={filters} tags={allTags} onChange={setFilters} />
        {showForm && (
          <NewSnippetForm
            onCreate={handleCreate}
            notice={duplicateNotice}
            onDismissNotice={() => setDuplicateNotice(null)}
            onCancel={() => {
              setShowForm(false);
              setDuplicateNotice(null);
            }}
          />
        )}
        {editing && (
          <SnippetEditor
            key={editing.id}
            snippet={editing}
            onSave={handleUpdate}
            onClose={() => setSelectedId(null)}
          />
        )}
        {statusNotice && (
          <div className="status-banner" role="status">
            {statusNotice}
          </div>
        )}
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
        <div className="view">
          <BulkActionBar
            count={bulkIds.length}
            view={activeView}
            onSetFavorite={bulkSetFavorite}
            onArchive={bulkArchive}
            onRestore={bulkRestore}
            onDelete={bulkDelete}
            onClear={() => setBulkIds([])}
          />
          {activeView === "snippets" && (
            <SnippetsView
              snippets={snippets}
              query={query}
              filters={filters}
              selectedId={selectedId}
              onSelect={setSelectedId}
              bulkIds={bulkIds}
              onToggleBulk={toggleBulk}
              onToggleFavorite={toggleFavorite}
              onTogglePin={togglePin}
              onArchive={handleArchive}
            />
          )}
          {activeView === "favorites" && (
            <FavoritesView
              snippets={snippets}
              query={query}
              filters={filters}
              selectedId={selectedId}
              onSelect={setSelectedId}
              bulkIds={bulkIds}
              onToggleBulk={toggleBulk}
              onToggleFavorite={toggleFavorite}
              onTogglePin={togglePin}
              onArchive={handleArchive}
            />
          )}
          {activeView === "archive" && (
            <ArchiveView
              snippets={snippets}
              query={query}
              filters={filters}
              selectedId={selectedId}
              onSelect={setSelectedId}
              bulkIds={bulkIds}
              onToggleBulk={toggleBulk}
              onToggleFavorite={toggleFavorite}
              onTogglePin={togglePin}
              onRestore={handleRestore}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>
    </div>
  );
}


