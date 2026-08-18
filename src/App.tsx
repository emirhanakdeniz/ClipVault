import Sidebar from "./components/Sidebar";
import SearchBar from "./components/SearchBar";
import NewSnippetForm from "./components/NewSnippetForm";
import QuickCapture from "./components/QuickCapture";
import SnippetEditor from "./components/SnippetEditor";
import SnippetListView from "./views/SnippetListView";
import BulkActionBar from "./components/BulkActionBar";
import FilterBar from "./components/FilterBar";
import ShortcutSettings from "./components/ShortcutSettings";
import ClipboardHistorySettings from "./components/ClipboardHistorySettings";
import useShortcuts from "./hooks/useShortcuts";
import useGlobalQuickCapture from "./hooks/useGlobalQuickCapture";
import useClipboardHistory from "./hooks/useClipboardHistory";
import { useSnippets } from "./hooks/useSnippets";

export default function App() {
  const store = useSnippets();

  useShortcuts({
    focusSearch: () =>
      document.querySelector<HTMLInputElement>(".searchbar__input")?.focus(),
    focusQuickCapture: () =>
      document
        .querySelector<HTMLInputElement>(".quickcapture__content")
        ?.focus(),
    newSnippet: () => store.setShowForm((open) => !open),
    copySelected: store.copySelected,
    toggleFavorite: () => {
      if (store.selectedId) store.toggleFavorite(store.selectedId);
    },
    selectPrevious: store.selectPrevious,
    selectNext: store.selectNext,
    clearSelection: () => {
      store.setSelectedId(null);
      store.setBulkIds([]);
    },
  });

  const globalQuickCapture = useGlobalQuickCapture(() =>
    document
      .querySelector<HTMLInputElement>(".quickcapture__content")
      ?.focus(),
  );

  const clipboardHistory = useClipboardHistory({
    onCapture: store.handleClipboardCapture,
    onRemove: store.handleClipboardRemove,
    onError: (message) => store.setError(message),
  });

  return (
    <div className="app">
      <Sidebar
        activeView={store.activeView}
        onSelect={(view) => {
          store.setActiveView(view);
          store.setBulkIds([]);
          store.setFilters({});
        }}
        snippetCount={store.active.length}
        favoriteCount={store.favoriteCount}
        archiveCount={store.archiveCount}
        onExport={store.handleExport}
        onImport={store.handleImport}
        footerExtra={
          <>
            <ShortcutSettings
              setting={globalQuickCapture.setting}
              status={globalQuickCapture.status}
              message={globalQuickCapture.message}
              onChange={globalQuickCapture.update}
            />
            <ClipboardHistorySettings
              setting={clipboardHistory.setting}
              onChange={clipboardHistory.update}
            />
          </>
        }
      />
      <main className="content">
        <div className="toolbar">
          <SearchBar query={store.query} onChange={store.setQuery} />
          <QuickCapture
            onCreate={store.handleCreate}
            notice={store.duplicateNotice}
            onDismissNotice={() => store.setDuplicateNotice(null)}
          />
          <button
            className="toolbar__new"
            type="button"
            onClick={() => store.setShowForm((visible) => !visible)}
            title="New snippet (Ctrl+N)"
          >
            + New
          </button>
        </div>
        <FilterBar
          view={store.activeView}
          filters={store.filters}
          tags={store.allTags}
          onChange={store.setFilters}
        />
        {store.showForm && (
          <NewSnippetForm
            onCreate={store.handleCreate}
            notice={store.duplicateNotice}
            onDismissNotice={() => store.setDuplicateNotice(null)}
            onCancel={() => {
              store.setShowForm(false);
              store.setDuplicateNotice(null);
            }}
          />
        )}
        {store.editing && (
          <SnippetEditor
            key={store.editing.id}
            snippet={store.editing}
            onSave={store.handleUpdate}
            onClose={() => store.setSelectedId(null)}
          />
        )}
        {store.statusNotice && (
          <div className="status-banner" role="status">
            {store.statusNotice}
          </div>
        )}
        {store.error && (
          <div className="error-banner" role="alert">
            {store.error}
          </div>
        )}
        <div className="view">
          <BulkActionBar
            count={store.bulkIds.length}
            view={store.activeView}
            onSetFavorite={store.bulkSetFavorite}
            onArchive={store.bulkArchive}
            onRestore={store.bulkRestore}
            onDelete={store.bulkDelete}
            onClear={() => store.setBulkIds([])}
          />
          <SnippetListView
            view={store.activeView}
            snippets={store.snippets}
            query={store.query}
            filters={store.filters}
            selectedId={store.selectedId}
            onSelect={store.setSelectedId}
            bulkIds={store.bulkIds}
            onToggleBulk={store.toggleBulk}
            onToggleFavorite={store.toggleFavorite}
            onTogglePin={store.togglePin}
            onToggleSensitive={store.toggleSensitive}
            onArchive={store.handleArchive}
            onRestore={store.handleRestore}
            onDelete={store.handleDelete}
          />
        </div>
      </main>
    </div>
  );
}



