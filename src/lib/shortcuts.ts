/**
 * Central keyboard shortcut registry.
 *
 * Combos are written as "Modifier+Key" where the modifier is Ctrl on
 * Windows/Linux and Cmd on macOS. Chosen to avoid OS/browser-reserved
 * combinations (no Alt+*, no Win key, no Ctrl+C unless a snippet is
 * selected with no native text selection).
 */
export const SHORTCUTS = {
  focusSearch: { combo: "Ctrl+K", description: "Focus search" },
  focusQuickCapture: { combo: "Ctrl+I", description: "Focus quick capture" },
  newSnippet: { combo: "Ctrl+N", description: "New snippet" },
  copySelected: { combo: "Ctrl+C", description: "Copy selected snippet" },
  toggleFavorite: { combo: "Ctrl+D", description: "Toggle favorite" },
  openSettings: { combo: "Ctrl+,", description: "Open settings" },
} as const;

export type ShortcutId = keyof typeof SHORTCUTS;
export type Shortcut = (typeof SHORTCUTS)[ShortcutId];

export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /mac/i.test(navigator.platform || navigator.userAgent);
}

/**
 * True when the keyboard event matches the shortcut's combo exactly.
 * Extra modifiers (Alt/Shift/Cmd on Windows) never match, so OS menu
 * accelerators (e.g. Alt+F) are never intercepted.
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: Shortcut,
): boolean {
  const parts = shortcut.combo.split("+");
  const key = parts[parts.length - 1].toLowerCase();
  const wantsModifier = parts.length > 1;

  if (event.altKey) return false;
  if (event.shiftKey) return false;

  const primaryModifier = event.ctrlKey || (isMac() && event.metaKey);
  if (primaryModifier !== wantsModifier) return false;

  return event.key.toLowerCase() === key;
}

/**
 * True when the event originated from a text-editing element. Shortcuts
 * that could disturb typing are skipped for these targets.
 */
export function isEditableTarget(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}
