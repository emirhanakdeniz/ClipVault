import { useEffect, useRef } from "react";
import {
  SHORTCUTS,
  isEditableTarget,
  matchesShortcut,
} from "../lib/shortcuts";

export interface ShortcutActions {
  focusSearch: () => void;
  focusQuickCapture: () => void;
  newSnippet: () => void;
  copySelected: () => void;
  toggleFavorite: () => void;
  togglePin?: () => void;
  editSelected?: () => void;
  archiveSelected?: () => void;
  openSettings?: () => void;
  openHelp?: () => void;
  selectPrevious: () => void;
  selectNext: () => void;
  clearSelection: () => void;
}

/**
 * Single window-level keydown listener for all app shortcuts.
 * Actions are read through a ref so callers can pass fresh closures
 * each render without re-binding the listener.
 */
export default function useShortcuts(actions: ShortcutActions) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const actions = actionsRef.current;

      // Global shortcuts that work anywhere (even while typing)
      if (matchesShortcut(event, SHORTCUTS.focusSearch)) {
        event.preventDefault();
        actions.focusSearch();
        return;
      }

      if (matchesShortcut(event, SHORTCUTS.focusQuickCapture)) {
        event.preventDefault();
        actions.focusQuickCapture();
        return;
      }

      if (matchesShortcut(event, SHORTCUTS.openSettings)) {
        event.preventDefault();
        actions.openSettings?.();
        return;
      }

      // Never hijack typing in text fields or form controls for non-global shortcuts
      if (isEditableTarget(event)) {
        if (event.key === "Escape") {
          // Blur input when pressing Escape inside search/quickcapture
          (event.target as HTMLElement)?.blur();
          actions.clearSelection();
        }
        return;
      }

      if (matchesShortcut(event, SHORTCUTS.newSnippet)) {
        event.preventDefault();
        actions.newSnippet();
        return;
      }

      if (matchesShortcut(event, SHORTCUTS.toggleFavorite)) {
        event.preventDefault();
        actions.toggleFavorite();
        return;
      }

      if (matchesShortcut(event, SHORTCUTS.copySelected)) {
        if (window.getSelection()?.toString()) return;
        event.preventDefault();
        actions.copySelected();
        return;
      }

      if (event.key === "?" || event.key === "F1") {
        event.preventDefault();
        actions.openHelp?.();
        return;
      }

      if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        actions.togglePin?.();
        return;
      }

      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        actions.toggleFavorite();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        actions.archiveSelected?.();
        return;
      }

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          actions.selectPrevious();
          break;
        case "ArrowDown":
          event.preventDefault();
          actions.selectNext();
          break;
        case "Escape":
          actions.clearSelection();
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
