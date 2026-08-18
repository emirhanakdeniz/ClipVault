import type { EncryptionStatus } from "../types";

interface VaultSettingsProps {
  status: EncryptionStatus;
  onOpenModal: (mode: "setup" | "unlock" | "manage") => void;
  onLock: () => void;
}

/**
 * Sidebar panel showing current encryption status and quick actions.
 */
export default function VaultSettings({
  status,
  onOpenModal,
  onLock,
}: VaultSettingsProps) {
  return (
    <section className="vault-settings" aria-label="Snippet encryption settings">
      <div className="vault-settings__header">
        <span className="vault-settings__title">Snippet Encryption</span>
        <span
          className={`vault-settings__badge ${
            !status.configured
              ? "vault-settings__badge--off"
              : status.unlocked
                ? "vault-settings__badge--unlocked"
                : "vault-settings__badge--locked"
          }`}
        >
          {!status.configured
            ? "Off"
            : status.unlocked
              ? "Unlocked 🔓"
              : "Locked 🔒"}
        </span>
      </div>

      <div className="vault-settings__actions">
        {!status.configured ? (
          <button
            type="button"
            className="vault-settings__btn vault-settings__btn--primary"
            onClick={() => onOpenModal("setup")}
            title="Set a master passphrase to encrypt sensitive snippets with AES-256-GCM"
          >
            🔒 Set Up Encryption
          </button>
        ) : status.unlocked ? (
          <>
            <button
              type="button"
              className="vault-settings__btn"
              onClick={onLock}
              title="Lock sensitive snippets (clears encryption key from memory)"
            >
              🔒 Lock
            </button>
            <button
              type="button"
              className="vault-settings__btn"
              onClick={() => onOpenModal("manage")}
              title="Change passphrase or disable encryption"
            >
              ⚙ Manage
            </button>
          </>
        ) : (
          <button
            type="button"
            className="vault-settings__btn vault-settings__btn--primary"
            onClick={() => onOpenModal("unlock")}
            title="Unlock vault to view and edit sensitive snippets"
          >
            🔓 Unlock Vault
          </button>
        )}
      </div>

      <span className="vault-settings__hint" role="note">
        {!status.configured
          ? "Protect sensitive snippet contents with zero-knowledge AES-256-GCM."
          : status.unlocked
            ? "Sensitive snippets are decrypted in memory for this session."
            : "Sensitive snippets are encrypted on disk. Unlock to reveal."}
      </span>
    </section>
  );
}
