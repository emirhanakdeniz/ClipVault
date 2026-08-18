import { invoke } from "@tauri-apps/api/core";
import { SHORTCUTS, isMac } from "./shortcuts";

/**
 * Persistence and conversion helpers for the global Quick Capture shortcut.
 *
 * The setting is stored as JSON in the generic `settings` table so no schema
 * change is needed if more preferences appear later. Combos use the same
 * "Ctrl+Alt+V" style as the in-app shortcut registry.
 */

const SETTING_KEY = "quickCaptureGlobalShortcut";

export interface QuickCaptureShortcutSetting {
  enabled: boolean;
  /** Frontend-style combo, e.g. "Ctrl+Alt+V". */
  combo: string;
}

/** Optional feature: disabled by default with a suggested combo that avoids
 *  the clipboard (Ctrl+C/V) and the built-in in-app shortcuts. */
export const DEFAULT_GLOBAL_SHORTCUT: QuickCaptureShortcutSetting = {
  enabled: false,
  combo: "Ctrl+Alt+V",
};

export async function loadQuickCaptureShortcut(): Promise<QuickCaptureShortcutSetting> {
  try {
    const raw = await invoke<string | null>("get_setting", { key: SETTING_KEY });
    if (!raw) return DEFAULT_GLOBAL_SHORTCUT;
    const parsed = JSON.parse(raw) as Partial<QuickCaptureShortcutSetting>;
    if (typeof parsed.enabled !== "boolean" || typeof parsed.combo !== "string") {
      return DEFAULT_GLOBAL_SHORTCUT;
    }
    return { enabled: parsed.enabled, combo: parsed.combo };
  } catch {
    // Unreadable settings must never block startup; fall back to defaults.
    return DEFAULT_GLOBAL_SHORTCUT;
  }
}

export async function saveQuickCaptureShortcut(
  setting: QuickCaptureShortcutSetting,
): Promise<void> {
  await invoke("set_setting", {
    key: SETTING_KEY,
    value: JSON.stringify(setting),
  });
}

/**
 * Converts a frontend-style combo into a Tauri accelerator string. "Ctrl"
 * becomes the platform primary modifier (Command on macOS) so the same combo
 * setting works across platforms.
 */
export function toAccelerator(combo: string): string {
  const parts = combo.split("+");
  const key = parts.pop() ?? "";
  const mods = parts.map((mod) => {
    switch (mod) {
      case "Ctrl":
        return isMac() ? "CommandOrControl" : "Control";
      case "Alt":
        return "Alt";
      case "Shift":
        return "Shift";
      case "Meta":
        return "Super";
      default:
        return mod;
    }
  });
  return [...mods, key.toUpperCase()].join("+");
}

/**
 * Validates a candidate global combo. Returns an error message, or null when
 * the combo is acceptable. Rejects modifier-less keys (too easy to trigger
 * system-wide), Win-key combos, and collisions with the built-in app
 * shortcuts.
 */
export function validateGlobalCombo(combo: string): string | null {
  const parts = combo.split("+");
  const key = parts[parts.length - 1];
  const mods = parts.slice(0, -1);

  if (mods.length === 0) {
    return "Add a modifier such as Ctrl or Alt.";
  }
  if (mods.includes("Meta")) {
    return "Avoid the Windows/OS key — it conflicts with the OS.";
  }
  if (!mods.includes("Ctrl") && !mods.includes("Alt")) {
    return "Use Ctrl or Alt as the main modifier.";
  }
  const builtin = Object.values(SHORTCUTS).find((s) => s.combo === combo);
  if (builtin) {
    return `${combo} is already used in-app: ${builtin.description}.`;
  }
  if (key.length !== 1 && !/^(F\d{1,2})$/.test(key)) {
    return "Use a letter, number, or F-key as the final key.";
  }
  return null;
}
