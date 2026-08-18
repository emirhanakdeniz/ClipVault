import type { ThemeMode } from "../types";
import {
  IconSun,
  IconMoon,
  IconSystem,
  IconKeyboard,
  IconLock,
  IconLockOpen,
  IconCopy,
  IconArchive,
  IconSettings,
} from "../components/Icons";
import ShortcutSettings from "../components/ShortcutSettings";
import ClipboardHistorySettings from "../components/ClipboardHistorySettings";
import type { VaultModalMode } from "../components/VaultModal";
import type {
  QuickCaptureShortcutSetting,
  ClipboardHistorySetting,
} from "../lib/settings";
import type { GlobalShortcutStatus } from "../hooks/useGlobalQuickCapture";
import type { UseAutostartResult } from "../hooks/useAutostart";

interface SettingsViewProps {
  theme: ThemeMode;
  resolvedTheme: "dark" | "light";
  onSetTheme: (theme: ThemeMode) => void;
  vaultStatus: { configured: boolean; unlocked: boolean };
  onOpenVaultModal: (mode: VaultModalMode) => void;
  onLockVault: () => void;
  onExport: () => void;
  onImport: () => void;
  globalQuickCapture: {
    setting: QuickCaptureShortcutSetting;
    status: GlobalShortcutStatus;
    message: string | null;
    update: (next: QuickCaptureShortcutSetting) => Promise<void>;
  };
  clipboardHistory: {
    setting: ClipboardHistorySetting;
    update: (next: ClipboardHistorySetting) => Promise<void>;
  };
  autostart: UseAutostartResult;
}

export default function SettingsView({
  theme,
  resolvedTheme,
  onSetTheme,
  vaultStatus,
  onOpenVaultModal,
  onLockVault,
  onExport,
  onImport,
  globalQuickCapture,
  clipboardHistory,
  autostart,
}: SettingsViewProps) {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? "Cmd" : "Ctrl";

  return (
    <div className="settings-view" aria-label="Settings and Preferences">
      <header className="settings-view__header">
        <div>
          <h2 className="settings-view__title">Settings</h2>
          <p className="settings-view__subtitle">
            Configure appearance, shortcuts, clipboard capture, and security
          </p>
        </div>
      </header>

      {/* 1. Appearance & Theme */}
      <section className="settings-card">
        <div className="settings-card__header">
          <span className="settings-card__icon">
            {resolvedTheme === "dark" ? (
              <IconMoon size={18} />
            ) : (
              <IconSun size={18} />
            )}
          </span>
          <div>
            <h3 className="settings-card__title">Appearance &amp; Theme</h3>
            <p className="settings-card__description">
              Choose your visual theme mode. Currently active:{" "}
              <strong>
                {resolvedTheme === "dark" ? "Dark Mode" : "Light Mode"}
              </strong>
            </p>
          </div>
        </div>

        <div className="theme-selector" role="radiogroup" aria-label="Theme mode">
          <button
            type="button"
            className={`theme-selector__btn ${
              theme === "dark" ? "theme-selector__btn--active" : ""
            }`}
            onClick={() => onSetTheme("dark")}
            role="radio"
            aria-checked={theme === "dark"}
          >
            <IconMoon size={16} />
            <span>Dark</span>
          </button>

          <button
            type="button"
            className={`theme-selector__btn ${
              theme === "light" ? "theme-selector__btn--active" : ""
            }`}
            onClick={() => onSetTheme("light")}
            role="radio"
            aria-checked={theme === "light"}
          >
            <IconSun size={16} />
            <span>Light</span>
          </button>

          <button
            type="button"
            className={`theme-selector__btn ${
              theme === "system" ? "theme-selector__btn--active" : ""
            }`}
            onClick={() => onSetTheme("system")}
            role="radio"
            aria-checked={theme === "system"}
          >
            <IconSystem size={16} />
            <span>System Default</span>
          </button>
        </div>
      </section>

      {/* 2. Keyboard Shortcuts Cheat Sheet */}
      <section className="settings-card">
        <div className="settings-card__header">
          <span className="settings-card__icon">
            <IconKeyboard size={18} />
          </span>
          <div>
            <h3 className="settings-card__title">Keyboard Shortcuts Guide</h3>
            <p className="settings-card__description">
              ClipVault is designed for high-efficiency, keyboard-driven navigation
            </p>
          </div>
        </div>

        <div className="shortcuts-table">
          <div className="shortcuts-table__row">
            <div className="shortcuts-table__label">
              <strong>Search &amp; Navigation</strong>
            </div>
          </div>
          <div className="shortcuts-table__row">
            <span className="shortcuts-table__action">Focus search bar</span>
            <div className="shortcuts-table__keys">
              <kbd>{modKey}</kbd> + <kbd>K</kbd>
            </div>
          </div>
          <div className="shortcuts-table__row">
            <span className="shortcuts-table__action">Focus quick capture</span>
            <div className="shortcuts-table__keys">
              <kbd>{modKey}</kbd> + <kbd>I</kbd>
            </div>
          </div>
          <div className="shortcuts-table__row">
            <span className="shortcuts-table__action">Open new snippet dialog</span>
            <div className="shortcuts-table__keys">
              <kbd>{modKey}</kbd> + <kbd>N</kbd>
            </div>
          </div>
          <div className="shortcuts-table__row">
            <span className="shortcuts-table__action">Navigate snippets</span>
            <div className="shortcuts-table__keys">
              <kbd>↑</kbd> / <kbd>↓</kbd>
            </div>
          </div>

          <div className="shortcuts-table__row shortcuts-table__row--divider">
            <div className="shortcuts-table__label">
              <strong>Snippet Actions</strong>
            </div>
          </div>
          <div className="shortcuts-table__row">
            <span className="shortcuts-table__action">
              Copy selected snippet content
            </span>
            <div className="shortcuts-table__keys">
              <kbd>{modKey}</kbd> + <kbd>C</kbd>
            </div>
          </div>
          <div className="shortcuts-table__row">
            <span className="shortcuts-table__action">
              Toggle favorite on selected snippet
            </span>
            <div className="shortcuts-table__keys">
              <kbd>{modKey}</kbd> + <kbd>D</kbd>
            </div>
          </div>
          <div className="shortcuts-table__row">
            <span className="shortcuts-table__action">
              Open snippet in full editor
            </span>
            <div className="shortcuts-table__keys">
              <kbd>Enter</kbd> or <kbd>Click</kbd>
            </div>
          </div>
          <div className="shortcuts-table__row">
            <span className="shortcuts-table__action">
              Close editor or cancel input
            </span>
            <div className="shortcuts-table__keys">
              <kbd>Escape</kbd>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Global Quick Capture Shortcut */}
      <section className="settings-card">
        <div className="settings-card__header">
          <span className="settings-card__icon">
            <IconKeyboard size={18} />
          </span>
          <div>
            <h3 className="settings-card__title">Global Quick Capture</h3>
            <p className="settings-card__description">
              System-wide hotkey to summon and focus Quick Capture from any app
            </p>
          </div>
        </div>

        <ShortcutSettings
          setting={globalQuickCapture.setting}
          status={globalQuickCapture.status}
          message={globalQuickCapture.message}
          onChange={globalQuickCapture.update}
        />
      </section>

      {/* 4. Clipboard History Settings */}
      <section className="settings-card">
        <div className="settings-card__header">
          <span className="settings-card__icon">
            <IconCopy size={18} />
          </span>
          <div>
            <h3 className="settings-card__title">Clipboard History</h3>
            <p className="settings-card__description">
              Automatically capture copied text and manage retention limits
            </p>
          </div>
        </div>

        <ClipboardHistorySettings
          setting={clipboardHistory.setting}
          onChange={clipboardHistory.update}
        />
      </section>

      {/* 5. Security & Vault Encryption */}
      <section className="settings-card">
        <div className="settings-card__header">
          <span className="settings-card__icon">
            {vaultStatus.unlocked ? (
              <IconLockOpen size={18} />
            ) : (
              <IconLock size={18} />
            )}
          </span>
          <div>
            <h3 className="settings-card__title">Vault &amp; Encryption</h3>
            <p className="settings-card__description">
              Zero-knowledge AES-256-GCM authenticated encryption for sensitive
              snippets
            </p>
          </div>
        </div>

        <div className="vault-panel">
          <div className="vault-panel__status-row">
            <span>Vault Status:</span>
            {!vaultStatus.configured ? (
              <span className="badge badge--unconfigured">Not configured</span>
            ) : vaultStatus.unlocked ? (
              <span className="badge badge--unlocked">🔓 Unlocked</span>
            ) : (
              <span className="badge badge--locked">🔒 Locked</span>
            )}
          </div>

          <div className="vault-panel__actions">
            {!vaultStatus.configured ? (
              <button
                type="button"
                className="settings-btn settings-btn--primary"
                onClick={() => onOpenVaultModal("setup")}
              >
                Set up Passphrase
              </button>
            ) : vaultStatus.unlocked ? (
              <>
                <button
                  type="button"
                  className="settings-btn"
                  onClick={onLockVault}
                >
                  Lock Vault
                </button>
                <button
                  type="button"
                  className="settings-btn"
                  onClick={() => onOpenVaultModal("manage")}
                >
                  Manage Vault &amp; Passphrase
                </button>
              </>
            ) : (
              <button
                type="button"
                className="settings-btn settings-btn--primary"
                onClick={() => onOpenVaultModal("unlock")}
              >
                Unlock Vault
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 6. System & Startup */}
      <section className="settings-card">
        <div className="settings-card__header">
          <span className="settings-card__icon">
            <IconSettings size={18} />
          </span>
          <div>
            <h3 className="settings-card__title">System &amp; Startup</h3>
            <p className="settings-card__description">
              Control Windows startup behavior and background execution
            </p>
          </div>
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-info">
            <span className="settings-toggle-title">
              Start with Windows
            </span>
            <span className="settings-toggle-description">
              Automatically launch ClipVault minimized in the background on startup so your clipboard and shortcuts are immediately ready. Default: Off.
            </span>
            <span className="settings-toggle-badge">
              ⚡ Near-zero background footprint: 0% idle CPU and lightweight memory usage.
            </span>
          </div>
          <label className="switch-toggle" aria-label="Toggle Start with Windows">
            <input
              type="checkbox"
              checked={autostart.enabled}
              disabled={autostart.loading}
              onChange={(e) => void autostart.toggle(e.target.checked)}
            />
            <span className="switch-toggle__slider" />
          </label>
        </div>

        {autostart.error && (
          <div className="error-banner" role="alert">
            {autostart.error}
          </div>
        )}
      </section>

      {/* 7. Data & Backups */}
      <section className="settings-card">
        <div className="settings-card__header">
          <span className="settings-card__icon">
            <IconArchive size={18} />
          </span>
          <div>
            <h3 className="settings-card__title">Data &amp; Backups</h3>
            <p className="settings-card__description">
              Export and import your snippets in portable, versioned JSON format
            </p>
          </div>
        </div>

        <div className="settings-card__actions-row">
          <button
            type="button"
            className="settings-btn"
            onClick={onExport}
            title="Export all snippets to a JSON backup"
          >
            Export Backup (.json)
          </button>
          <button
            type="button"
            className="settings-btn"
            onClick={onImport}
            title="Import snippets from a JSON backup"
          >
            Import Backup (.json)
          </button>
        </div>
      </section>

      {/* 7. About ClipVault */}
      <section className="settings-card settings-card--about">
        <div className="settings-about">
          <img
            src="/app-icon.png"
            alt="ClipVault Logo"
            className="settings-about__logo"
            width="48"
            height="48"
          />
          <div className="settings-about__info">
            <h3 className="settings-about__title">ClipVault</h3>
            <span className="settings-about__version">v0.1.0</span>
            <p className="settings-about__text">
              A lightweight, privacy-focused snippet and clipboard manager
              built with Tauri v2, React, TypeScript, and Rust SQLite.
            </p>
            <span className="settings-about__privacy">
              🔒 100% Local &amp; Private — Zero telemetry, zero external cloud dependencies.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
