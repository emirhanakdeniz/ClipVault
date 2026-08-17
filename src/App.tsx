import { useState } from "react";
import Sidebar from "./components/Sidebar";
import SnippetsView from "./views/SnippetsView";
import FavoritesView from "./views/FavoritesView";
import type { ViewId } from "./components/Sidebar";

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>("snippets");

  return (
    <div className="app">
      <Sidebar activeView={activeView} onSelect={setActiveView} />
      <main className="content">
        {activeView === "snippets" && <SnippetsView />}
        {activeView === "favorites" && <FavoritesView />}
      </main>
    </div>
  );
}
