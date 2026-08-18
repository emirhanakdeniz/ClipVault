import { useEffect, useRef } from "react";
import type { Snippet } from "../types";
import {
  IconCopy,
  IconHeart,
  IconBookmark,
  IconLock,
  IconLockOpen,
  IconArchive,
  IconRestore,
  IconTrash,
  IconSnippets,
} from "./Icons";

export interface ContextMenuPosition {
  x: number;
  y: number;
  snippet: Snippet;
}

interface ContextMenuProps {
  position: ContextMenuPosition;
  onClose: () => void;
  onCopy: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleSensitive?: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  isArchiveView?: boolean;
}

export default function ContextMenu({
  position,
  onClose,
  onCopy,
  onEdit,
  onToggleFavorite,
  onTogglePin,
  onToggleSensitive,
  onArchive,
  onRestore,
  onDelete,
  isArchiveView = false,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { x, y, snippet } = position;

  // Viewport-aware positioning
  const menuWidth = 210;
  const menuHeight = 260;
  const clampedX = Math.max(10, Math.min(x, window.innerWidth - menuWidth - 10));
  const clampedY = Math.max(10, Math.min(y, window.innerHeight - menuHeight - 10));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    }

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: `${clampedY}px`, left: `${clampedX}px` }}
      role="menu"
      aria-label="Snippet options"
    >
      <button
        type="button"
        className="context-menu__item"
        role="menuitem"
        onClick={() => {
          onCopy(snippet.id);
          onClose();
        }}
      >
        <span className="context-menu__icon">
          <IconCopy size={14} />
        </span>
        <span className="context-menu__label">Copy content</span>
        <kbd className="context-menu__kbd">Ctrl+C</kbd>
      </button>

      <button
        type="button"
        className="context-menu__item"
        role="menuitem"
        onClick={() => {
          onEdit(snippet.id);
          onClose();
        }}
      >
        <span className="context-menu__icon">
          <IconSnippets size={14} />
        </span>
        <span className="context-menu__label">Edit snippet</span>
        <kbd className="context-menu__kbd">Enter</kbd>
      </button>

      <button
        type="button"
        className="context-menu__item"
        role="menuitem"
        onClick={() => {
          onToggleFavorite(snippet.id);
          onClose();
        }}
      >
        <span className="context-menu__icon">
          <IconHeart size={14} filled={snippet.favorite} />
        </span>
        <span className="context-menu__label">
          {snippet.favorite ? "Unfavorite" : "Favorite"}
        </span>
        <kbd className="context-menu__kbd">Ctrl+D</kbd>
      </button>

      <button
        type="button"
        className="context-menu__item"
        role="menuitem"
        onClick={() => {
          onTogglePin(snippet.id);
          onClose();
        }}
      >
        <span className="context-menu__icon">
          <IconBookmark size={14} filled={snippet.pinned} />
        </span>
        <span className="context-menu__label">
          {snippet.pinned ? "Unpin from top" : "Pin to top"}
        </span>
        <kbd className="context-menu__kbd">P</kbd>
      </button>

      {onToggleSensitive && (
        <button
          type="button"
          className="context-menu__item"
          role="menuitem"
          onClick={() => {
            onToggleSensitive(snippet.id);
            onClose();
          }}
        >
          <span className="context-menu__icon">
            {snippet.sensitive ? <IconLock size={14} /> : <IconLockOpen size={14} />}
          </span>
          <span className="context-menu__label">
            {snippet.sensitive ? "Remove sensitive mark" : "Mark sensitive"}
          </span>
        </button>
      )}

      <div className="context-menu__divider" />

      {!isArchiveView && onArchive && (
        <button
          type="button"
          className="context-menu__item"
          role="menuitem"
          onClick={() => {
            onArchive(snippet.id);
            onClose();
          }}
        >
          <span className="context-menu__icon">
            <IconArchive size={14} />
          </span>
          <span className="context-menu__label">Archive</span>
          <kbd className="context-menu__kbd">Del</kbd>
        </button>
      )}

      {isArchiveView && onRestore && (
        <button
          type="button"
          className="context-menu__item"
          role="menuitem"
          onClick={() => {
            onRestore(snippet.id);
            onClose();
          }}
        >
          <span className="context-menu__icon">
            <IconRestore size={14} />
          </span>
          <span className="context-menu__label">Restore</span>
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          className="context-menu__item context-menu__item--danger"
          role="menuitem"
          onClick={() => {
            onDelete(snippet.id);
            onClose();
          }}
        >
          <span className="context-menu__icon">
            <IconTrash size={14} />
          </span>
          <span className="context-menu__label">Delete</span>
        </button>
      )}
    </div>
  );
}
