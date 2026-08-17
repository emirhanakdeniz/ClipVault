import { useEffect, useState } from "react";
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
  deleteSnippet,
} from "./lib/api";

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>("snippets");
  const [query, setQuery] = useState("");
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const favoriteCount = snippets.filter((s) => s.favorite).length;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>(".searchbar__input")?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  async function handleDelete(id: string) {
    try {
      await deleteSnippet(id);
      setSnippets((prev) => prev.filter((s) => s.id !== id));
      setError(null);
    } catch (reason) {
      setError(String(reason));
    }
  }

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
              onToggleFavorite={toggleFavorite}
              onDelete={handleDelete}
            />
          )}
          {activeView === "favorites" && (
            <FavoritesView
              snippets={snippets}
              query={query}
              onToggleFavorite={toggleFavorite}
              onDelete={handleDelete}
            />
          )}
        </div>
      </main>
    </div>
  );
}


