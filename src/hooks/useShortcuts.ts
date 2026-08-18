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

      // Focus search works even while typing (matches the original behavior).
      if (matchesShortcut(event, SHORTCUTS.focusSearch)) {
        event.preventDefault();
        actions.focusSearch();
        return;
      }

      // Quick capture focus also works while typing, so capturing never
      // requires leaving the keyboard.
      if (matchesShortcut(event, SHORTCUTS.focusQuickCapture)) {
        event.preventDefault();
        actions.focusQuickCapture();
        return;
      }

      // Never hijack keystrokes aimed at a text field or form control.
      if (isEditableTarget(event)) return;

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
        // Fall through to the native copy when the user has highlighted
        // text, so the OS clipboard behaviour is preserved.
        if (window.getSelection()?.toString()) return;
        event.preventDefault();
        actions.copySelected();
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
