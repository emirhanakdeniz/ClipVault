import type { ReactNode } from "react";
import type { ViewId } from "../types";
import {
  IconSnippets,
  IconHeart,
  IconArchive,
  IconStats,
  IconSettings,
} from "./Icons";

export type { ViewId };

interface SidebarProps {
  activeView: ViewId;
  onSelect: (view: ViewId) => void;
  snippetCount: number;
  favoriteCount: number;
  archiveCount: number;
  onExport: () => void;
  onImport: () => void;
  onOpenShortcutsHelp?: () => void;
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
  onOpenShortcutsHelp,
  footerExtra,
}: SidebarProps) {
  const navItems: {
    id: ViewId;
    label: string;
    icon: ReactNode;
    count?: number;
    title?: string;
  }[] = [
    {
      id: "snippets",
      label: "Snippets",
      icon: <IconSnippets size={16} />,
      count: snippetCount,
    },
    {
      id: "favorites",
      label: "Favorites",
      icon: <IconHeart size={16} />,
      count: favoriteCount,
    },
    {
      id: "archive",
      label: "Archive",
      icon: <IconArchive size={16} />,
      count: archiveCount,
    },
    {
      id: "statistics",
      label: "Statistics",
      icon: <IconStats size={16} />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <IconSettings size={16} />,
      title: "Settings (Ctrl+,)",
    },
  ];

  return (
    <nav className="sidebar" aria-label="Main">
      <div className="sidebar__brand" onClick={() => onSelect("snippets")} role="button" tabIndex={0}>
        <img
          src="/app-icon.png"
          alt="ClipVault"
          className="sidebar__brand-logo"
          width="24"
          height="24"
        />
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
            title={item.title ?? item.label}
            aria-label={item.label}
            aria-current={item.id === activeView ? "page" : undefined}
          >
            <span className="sidebar__item-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="sidebar__item-label">{item.label}</span>
            {item.count !== undefined && (
              <span className="sidebar__item-count">{item.count}</span>
            )}
          </button>
        ))}
      </div>
      <div className="sidebar__footer">
        {footerExtra}
        <span className="sidebar__footer-count">{snippetCount} saved</span>
        <div className="sidebar__footer-actions">
          {onOpenShortcutsHelp && (
            <button
              type="button"
              className="sidebar__footer-btn"
              onClick={onOpenShortcutsHelp}
              title="Keyboard shortcuts cheat sheet (? / F1)"
            >
              Shortcuts (?)
            </button>
          )}
          <button
            type="button"
            className="sidebar__footer-btn"
            onClick={onExport}
            title="Export all snippets to a JSON file"
          >
            Export
          </button>
          <button
            type="button"
            className="sidebar__footer-btn"
            onClick={onImport}
            title="Import snippets from a ClipVault JSON file"
          >
            Import
          </button>
        </div>
      </div>
    </nav>
  );
}
