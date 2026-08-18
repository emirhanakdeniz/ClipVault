import {
  CLIPBOARD_LIMIT_CHOICES,
  type ClipboardHistorySetting,
} from "../lib/settings";

interface ClipboardHistorySettingsProps {
  setting: ClipboardHistorySetting;
  onChange: (next: ClipboardHistorySetting) => void;
}

/**
 * Sidebar panel for automatic clipboard capture: an on/off toggle plus a
 * limit selector. When the limit is exceeded the oldest auto-captured
 * entries are removed; manual, favorite, and pinned snippets are always
 * kept (enforced in the backend prune query).
 */
export default function ClipboardHistorySettings({
  setting,
  onChange,
}: ClipboardHistorySettingsProps) {
  return (
    <section className="clip-history" aria-label="Clipboard history">
      <label className="clip-history__label">
        <input
          type="checkbox"
          checked={setting.enabled}
          onChange={(event) =>
            onChange({ ...setting, enabled: event.target.checked })
          }
        />
        Clipboard history
      </label>
      <label className="clip-history__limit">
        Keep last
        <select
          className="clip-history__select"
          value={setting.limit}
          disabled={!setting.enabled}
          onChange={(event) =>
            onChange({ ...setting, limit: Number(event.target.value) })
          }
        >
          {CLIPBOARD_LIMIT_CHOICES.map((choice) => (
            <option key={choice} value={choice}>
              {choice}
            </option>
          ))}
        </select>
        entries
      </label>
      <span className="clip-history__hint" role="note">
        {setting.enabled
          ? "Oldest captured entries are removed at the limit. Manual, favorite, and pinned snippets are never removed."
          : "Turn on to capture copied text automatically."}
      </span>
    </section>
  );
}
