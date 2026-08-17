import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import SearchBar from "./components/SearchBar";
import SnippetsView from "./views/SnippetsView";
import FavoritesView from "./views/FavoritesView";
import { MOCK_SNIPPETS } from "./data/snippets";
import type { ViewId } from "./components/Sidebar";

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>("snippets");
  const [query, setQuery] = useState("");
  const [snippets, setSnippets] = useState(MOCK_SNIPPETS);

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

  function toggleFavorite(id: string) {
    setSnippets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, favorite: !s.favorite } : s)),
    );
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
        <SearchBar query={query} onChange={setQuery} />
        <div className="view">
          {activeView === "snippets" && (
            <SnippetsView
              snippets={snippets}
              query={query}
              onToggleFavorite={toggleFavorite}
            />
          )}
          {activeView === "favorites" && (
            <FavoritesView
              snippets={snippets}
              query={query}
              onToggleFavorite={toggleFavorite}
            />
          )}
        </div>
      </main>
    </div>
  );
}

