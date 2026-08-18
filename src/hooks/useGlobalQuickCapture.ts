import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { register, unregister } from "@tauri-apps/plugin-global-shortcut";
import {
  DEFAULT_GLOBAL_SHORTCUT,
  loadQuickCaptureShortcut,
  saveQuickCaptureShortcut,
  toAccelerator,
  type QuickCaptureShortcutSetting,
} from "../lib/settings";

export type GlobalShortcutStatus =
  | "loading"
  | "active"
  | "inactive"
  | "conflict"
  | "error";

/**
 * Owns the system-wide Quick Capture shortcut lifecycle:
 *
 * - Loads the persisted setting on mount and (re)registers it.
 * - Registration failures (combo taken by another app, plugin unavailable)
 *   disable the feature and surface a message — the app keeps working.
 * - Updates unregister the old accelerator first, then register the new one
 *   and persist only on success, so a conflicting combo is never saved.
 */
export default function useGlobalQuickCapture(onTrigger: () => void) {
  const [setting, setSetting] =
    useState<QuickCaptureShortcutSetting>(DEFAULT_GLOBAL_SHORTCUT);
  const [status, setStatus] = useState<GlobalShortcutStatus>("loading");
  const [message, setMessage] = useState<string | null>(null);

  const onTriggerRef = useRef(onTrigger);
  onTriggerRef.current = onTrigger;
  const registeredRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const handleShortcut = useCallback(async () => {
    // Bring the window forward from any state (tray/minimized/background),
    // then hand focus to the Quick Capture input.
    try {
      const win = getCurrentWindow();
      await win.show();
      await win.unminimize();
      await win.setFocus();
    } catch {
      // Window ops failing (e.g. unsupported platform) should not block
      // focusing the input when the app is already focused.
    }
    onTriggerRef.current();
  }, []);

  const unregisterCurrent = useCallback(async () => {
    const accel = registeredRef.current;
    if (!accel) return;
    registeredRef.current = null;
    try {
      await unregister(accel);
    } catch {
      // Already gone — nothing to recover.
    }
  }, []);

  const applySetting = useCallback(
    async (next: QuickCaptureShortcutSetting) => {
      await unregisterCurrent();
      if (!next.enabled) {
        setSetting(next);
        setStatus("inactive");
        setMessage(null);
        await saveQuickCaptureShortcut(next);
        return;
      }
      const accel = toAccelerator(next.combo);
      try {
        await register(accel, handleShortcut);
        registeredRef.current = accel;
        setSetting(next);
        setStatus("active");
        setMessage(null);
        await saveQuickCaptureShortcut(next);
      } catch (reason) {
        // Rejected by the OS (combo owned by another app) or by the plugin.
        // Keep the feature off and never persist a broken registration.
        registeredRef.current = null;
        setSetting({ ...next, enabled: false });
        const text = String(reason);
        setStatus(/already|in use|registered|conflict/i.test(text) ? "conflict" : "error");
        setMessage(text.replace(/^"|"$/g, ""));
      }
    },
    [handleShortcut, unregisterCurrent],
  );

  useEffect(() => {
    // StrictMode mounts effects twice in dev; the guard keeps a single
    // bootstrap. No unmount cleanup is needed: App never unmounts and the
    // OS releases hotkeys when the process exits.
    if (initializedRef.current) return;
    initializedRef.current = true;
    loadQuickCaptureShortcut()
      .then((loaded) => applySetting(loaded))
      .catch(() => {
        // Settings store unreadable: feature simply stays off.
        setStatus("inactive");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    setting,
    status,
    message,
    /** Disable or reconfigure the shortcut. Disabling always succeeds. */
    update: applySetting,
  };
}
