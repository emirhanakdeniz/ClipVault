import { useState } from "react";
import Sidebar from "./components/Sidebar";
import SearchBar from "./components/SearchBar";
import NewSnippetForm from "./components/NewSnippetForm";
import QuickCapture from "./components/QuickCapture";
import SnippetEditor from "./components/SnippetEditor";
import SnippetListView from "./views/SnippetListView";
import StatisticsView from "./views/StatisticsView";
import SettingsView from "./views/SettingsView";
import BulkActionBar from "./components/BulkActionBar";
import FilterBar from "./components/FilterBar";
import ShortcutSettings from "./components/ShortcutSettings";
import ClipboardHistorySettings from "./components/ClipboardHistorySettings";
import VaultSettings from "./components/VaultSettings";
import VaultModal, { type VaultModalMode } from "./components/VaultModal";
import ContextMenu, { type ContextMenuPosition } from "./components/ContextMenu";
import ShortcutsHelpModal from "./components/ShortcutsHelpModal";
import useShortcuts from "./hooks/useShortcuts";
import useGlobalQuickCapture from "./hooks/useGlobalQuickCapture";
import useClipboardHistory from "./hooks/useClipboardHistory";
import { useVault } from "./hooks/useVault";
import { useSnippets } from "./hooks/useSnippets";
import { useTheme } from "./hooks/useTheme";
import { useAutostart } from "./hooks/useAutostart";

export default function App() {
  const store = useSnippets();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const autostart = useAutostart();
  const [vaultModalMode, setVaultModalMode] = useState<VaultModalMode | null>(
    null,
  );
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
    null,
  );
  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);

  const vault = useVault(() => {
    void store.reloadSnippets();
  });

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
    togglePin: () => {
      if (store.selectedId) store.togglePin(store.selectedId);
    },
    editSelected: () => {
      if (store.selectedId) {
        document.querySelector<HTMLInputElement>(".snippeteditor__input")?.focus();
      }
    },
    archiveSelected: () => {
      if (store.selectedId) {
        if (store.activeView === "archive") {
          void store.handleDelete(store.selectedId);
        } else {
          void store.handleArchive(store.selectedId);
        }
      }
    },
    openSettings: () => store.setActiveView("settings"),
    openHelp: () => setShortcutsHelpOpen((prev) => !prev),
    selectPrevious: store.selectPrevious,
    selectNext: store.selectNext,
    clearSelection: () => {
      if (contextMenu) {
        setContextMenu(null);
        return;
      }
      if (shortcutsHelpOpen) {
        setShortcutsHelpOpen(false);
        return;
      }
      if (vaultModalMode) {
        setVaultModalMode(null);
        return;
      }
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
        onOpenShortcutsHelp={() => setShortcutsHelpOpen(true)}
        footerExtra={
          <>
            <VaultSettings
              status={vault.status}
              onOpenModal={(mode) => setVaultModalMode(mode)}
              onLock={() => {
                vault.lock().catch((err) => store.setError(String(err)));
              }}
            />
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
        {store.activeView !== "statistics" && store.activeView !== "settings" && (
          <FilterBar
            view={store.activeView}
            filters={store.filters}
            tags={store.allTags}
            onChange={store.setFilters}
          />
        )}
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
          {store.activeView === "settings" ? (
            <SettingsView
              theme={theme}
              resolvedTheme={resolvedTheme}
              onSetTheme={setTheme}
              vaultStatus={vault.status}
              onOpenVaultModal={(mode) => setVaultModalMode(mode)}
              onLockVault={vault.lock}
              onExport={store.handleExport}
              onImport={store.handleImport}
              globalQuickCapture={globalQuickCapture}
              clipboardHistory={clipboardHistory}
              autostart={autostart}
            />
          ) : store.activeView === "statistics" ? (
            <StatisticsView
              onSelectSnippet={(id) => {
                store.setActiveView("snippets");
                store.setSelectedId(id);
              }}
            />
          ) : (
            <>
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
                onUnlockVault={() => setVaultModalMode("unlock")}
                onCopy={store.trackCopy}
                onContextMenu={(event, snippet) =>
                  setContextMenu({
                    x: event.clientX,
                    y: event.clientY,
                    snippet,
                  })
                }
              />
            </>
          )}
        </div>
      </main>

      {contextMenu && (
        <ContextMenu
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onCopy={(id) => {
            const item = store.snippets.find((s) => s.id === id);
            if (item) void store.copySelected();
          }}
          onEdit={(id) => {
            store.setSelectedId(id);
            window.setTimeout(() => {
              document
                .querySelector<HTMLInputElement>(".snippeteditor__input")
                ?.focus();
            }, 50);
          }}
          onToggleFavorite={store.toggleFavorite}
          onTogglePin={store.togglePin}
          onToggleSensitive={store.toggleSensitive}
          onArchive={store.handleArchive}
          onRestore={store.handleRestore}
          onDelete={store.handleDelete}
          isArchiveView={store.activeView === "archive"}
        />
      )}

      <ShortcutsHelpModal
        isOpen={shortcutsHelpOpen}
        onClose={() => setShortcutsHelpOpen(false)}
      />

      {vaultModalMode && (
        <VaultModal
          mode={vaultModalMode}
          onClose={() => setVaultModalMode(null)}
          onSetup={vault.setup}
          onUnlock={vault.unlock}
          onChangePassphrase={vault.changePassphrase}
          onDisable={vault.disable}
        />
      )}
    </div>
  );
}
