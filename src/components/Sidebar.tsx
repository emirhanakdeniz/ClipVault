import type { ReactNode } from "react";

export type ViewId = "snippets" | "favorites" | "archive";

interface SidebarProps {
  activeView: ViewId;
  onSelect: (view: ViewId) => void;
  snippetCount: number;
  favoriteCount: number;
  archiveCount: number;
  onExport: () => void;
  onImport: () => void;
  footerExtra?: ReactNode;
}

export default function Sidebar({
  activeView,
  onSelect,
  snippetCount,
  favoriteCount,
  archiveCount,
  onExport,
  onImport,
  footerExtra,
}: SidebarProps) {
  const navItems: { id: ViewId; label: string; glyph: string; count: number }[] =
    [
      { id: "snippets", label: "Snippets", glyph: "▤", count: snippetCount },
      { id: "favorites", label: "Favorites", glyph: "★", count: favoriteCount },
      { id: "archive", label: "Archive", glyph: "▣", count: archiveCount },
    ];

  return (
    <nav className="sidebar" aria-label="Main">
      <div className="sidebar__brand">
        <span className="sidebar__brand-glyph" aria-hidden="true">
          ⌗
        </span>
        <span className="sidebar__brand-name">ClipVault</span>
      </div>
      <div className="sidebar__nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              item.id === activeView
                ? "sidebar__item sidebar__item--active"
                : "sidebar__item"
            }
            onClick={() => onSelect(item.id)}
            aria-current={item.id === activeView ? "page" : undefined}
          >
            <span className="sidebar__item-glyph" aria-hidden="true">
              {item.glyph}
            </span>
            <span className="sidebar__item-label">{item.label}</span>
            <span className="sidebar__item-count">{item.count}</span>
          </button>
        ))}
      </div>
      <div className="sidebar__footer">
        {footerExtra}
        <span className="sidebar__footer-count">{snippetCount} saved</span>
        <div className="sidebar__footer-actions">
          <button
            type="button"
            className="sidebar__footer-btn"
            onClick={onExport}
            title="Export all snippets to a JSON file"
          >
            ↥ Export
          </button>
          <button
            type="button"
            className="sidebar__footer-btn"
            onClick={onImport}
            title="Import snippets from a ClipVault JSON file"
          >
            ↧ Import
          </button>
        </div>
      </div>
    </nav>
  );
}

