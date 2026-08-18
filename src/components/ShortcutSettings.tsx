import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_GLOBAL_SHORTCUT,
  validateGlobalCombo,
  type QuickCaptureShortcutSetting,
} from "../lib/settings";
import type { GlobalShortcutStatus } from "../hooks/useGlobalQuickCapture";

interface ShortcutSettingsProps {
  setting: QuickCaptureShortcutSetting;
  status: GlobalShortcutStatus;
  message: string | null;
  onChange: (next: QuickCaptureShortcutSetting) => void;
}

const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"]);

/**
 * Sidebar panel for the optional system-wide Quick Capture shortcut.
 * "Change" starts a one-shot recording mode; the next key press becomes the
 * new combo unless it fails validation, in which case the reason is shown.
 */
export default function ShortcutSettings({
  setting,
  status,
  message,
  onChange,
}: ShortcutSettingsProps) {
  const [recording, setRecording] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const recordRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!recording) return;
    function onKeyDown(raw: KeyboardEvent) {
      if (raw.key === "Escape") {
        setRecording(false);
        setNotice(null);
        return;
      }
      if (MODIFIER_KEYS.has(raw.key)) return;
      raw.preventDefault();
      const mods: string[] = [];
      if (raw.ctrlKey) mods.push("Ctrl");
      if (raw.altKey) mods.push("Alt");
      if (raw.shiftKey) mods.push("Shift");
      if (raw.metaKey) mods.push("Meta");
      const key = raw.key.length === 1 ? raw.key.toUpperCase() : raw.key;
      const combo = [...mods, key].join("+");
      const error = validateGlobalCombo(combo);
      setRecording(false);
      if (error) {
        setNotice(error);
        return;
      }
      setNotice(null);
      onChange({ enabled: true, combo });
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [recording, onChange]);

  // Clear the validation notice when the user starts another attempt.
  function startRecording() {
    setNotice(null);
    setRecording(true);
    recordRef.current?.blur();
  }

  const statusText =
    status === "loading"
      ? "Loading…"
      : status === "active"
        ? `Active — ${setting.combo}`
        : status === "conflict"
          ? "Shortcut in use by another app"
          : status === "error"
            ? "Registration failed — feature off"
            : setting.enabled
              ? "Enabled"
              : "Disabled";

  return (
    <section className="shortcut-settings" aria-label="Global shortcut">
      <div className="shortcut-settings__row">
        <label className="shortcut-settings__label">
          <input
            type="checkbox"
            checked={setting.enabled && status === "active"}
            disabled={status === "loading"}
            onChange={(event) =>
              onChange({ ...setting, enabled: event.target.checked })
            }
          />
          Global Quick Capture
        </label>
        <button
          ref={recordRef}
          className="shortcut-settings__record"
          type="button"
          onClick={startRecording}
          disabled={status === "loading" || recording}
        >
          {recording ? "Press keys…" : "Change"}
        </button>
      </div>
      <span
        className={`shortcut-settings__status${
          status === "active" ? " shortcut-settings__status--ok" : ""
        }${status === "conflict" || status === "error" ? " shortcut-settings__status--bad" : ""}`}
        role="status"
      >
        {statusText}
      </span>
      {setting.combo !== DEFAULT_GLOBAL_SHORTCUT.combo && (
        <button
          className="shortcut-settings__reset"
          type="button"
          onClick={() =>
            onChange({ ...setting, combo: DEFAULT_GLOBAL_SHORTCUT.combo })
          }
        >
          Reset to {DEFAULT_GLOBAL_SHORTCUT.combo}
        </button>
      )}
      {(notice ?? message) && (
        <span className="shortcut-settings__notice" role="alert">
          {notice ?? message}
        </span>
      )}
    </section>
  );
}
