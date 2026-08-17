import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import SearchBar from "./components/SearchBar";
import NewSnippetForm from "./components/NewSnippetForm";
import SnippetsView from "./views/SnippetsView";
import FavoritesView from "./views/FavoritesView";
import type { ViewId } from "./components/Sidebar";
import type { Snippet, SnippetType } from "./types";
import {
  listSnippets,
  createSnippet,
  setFavorite,
  setPinned,
  deleteSnippet,
} from "./lib/api";
import { getVisibleSnippets } from "./lib/search";
import { copyText } from "./lib/clipboard";
import useShortcuts from "./hooks/useShortcuts";

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>("snippets");
  const [query, setQuery] = useState("");
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const favoriteCount = snippets.filter((s) => s.favorite).length;

  // Same list the active view renders; keeps keyboard selection in sync.
  const visible = useMemo(
    () =>
      getVisibleSnippets(snippets, query, {
        favoritesOnly: activeView === "favorites",
      }),
    [snippets, query, activeView],
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
  }) {
    try {
      const created = await createSnippet(input);
      setSnippets((prev) => [created, ...prev]);
      setShowForm(false);
      setError(null);
    } catch (reason) {
      setError(String(reason));
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
    newSnippet: () => setShowForm((open) => !open),
    copySelected,
    toggleFavorite: () => {
      if (selectedId) toggleFavorite(selectedId);
    },
    selectPrevious,
    selectNext,
    clearSelection: () => setSelectedId(null),
  });

  return (
    <div className="app">
      <Sidebar
        activeView={activeView}
        onSelect={setActiveView}
        snippetCount={snippets.length}
        favoriteCount={favoriteCount}
      />
      <main className="content">
        <div className="toolbar">
          <SearchBar query={query} onChange={setQuery} />
          <button
            className="toolbar__new"
            type="button"
            onClick={() => setShowForm((visible) => !visible)}
            title="New snippet (Ctrl+N)"
          >
            + New
          </button>
        </div>
        {showForm && (
          <NewSnippetForm onCreate={handleCreate} onCancel={() => setShowForm(false)} />
        )}
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
        <div className="view">
          {activeView === "snippets" && (
            <SnippetsView
              snippets={snippets}
              query={query}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggleFavorite={toggleFavorite}
              onTogglePin={togglePin}
              onDelete={handleDelete}
            />
          )}
          {activeView === "favorites" && (
            <FavoritesView
              snippets={snippets}
              query={query}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggleFavorite={toggleFavorite}
              onTogglePin={togglePin}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>
    </div>
  );
}


