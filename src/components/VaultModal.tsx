import { useState, type FormEvent, useEffect, useRef } from "react";

export type VaultModalMode = "setup" | "unlock" | "manage";

interface VaultModalProps {
  mode: VaultModalMode;
  onClose: () => void;
  onSetup: (passphrase: string) => Promise<void>;
  onUnlock: (passphrase: string) => Promise<void>;
  onChangePassphrase: (
    oldPassphrase: string,
    newPassphrase: string,
  ) => Promise<void>;
  onDisable: (passphrase: string) => Promise<void>;
}

export default function VaultModal({
  mode,
  onClose,
  onSetup,
  onUnlock,
  onChangePassphrase,
  onDisable,
}: VaultModalProps) {
  const [passphrase, setPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [oldPassphrase, setOldPassphrase] = useState("");
  const [manageTab, setManageTab] = useState<"change" | "disable">("change");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode, manageTab]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === "setup") {
        if (passphrase.length < 4) {
          setError("Passphrase must be at least 4 characters long.");
          setBusy(false);
          return;
        }
        if (passphrase !== confirmPassphrase) {
          setError("Passphrases do not match.");
          setBusy(false);
          return;
        }
        await onSetup(passphrase);
        onClose();
      } else if (mode === "unlock") {
        if (!passphrase) {
          setError("Please enter your passphrase.");
          setBusy(false);
          return;
        }
        await onUnlock(passphrase);
        onClose();
      } else if (mode === "manage") {
        if (manageTab === "change") {
          if (!oldPassphrase) {
            setError("Please enter your current passphrase.");
            setBusy(false);
            return;
          }
          if (passphrase.length < 4) {
            setError("New passphrase must be at least 4 characters long.");
            setBusy(false);
            return;
          }
          if (passphrase !== confirmPassphrase) {
            setError("New passphrases do not match.");
            setBusy(false);
            return;
          }
          await onChangePassphrase(oldPassphrase, passphrase);
          onClose();
        } else {
          if (!oldPassphrase) {
            setError("Please enter your current passphrase to confirm.");
            setBusy(false);
            return;
          }
          await onDisable(oldPassphrase);
          onClose();
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="vault-modal-backdrop" onClick={onClose}>
      <div
        className="vault-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-modal-title"
      >
        <header className="vault-modal__header">
          <h2 id="vault-modal-title" className="vault-modal__title">
            {mode === "setup" && "🔒 Set Up Vault Encryption"}
            {mode === "unlock" && "🔓 Unlock Sensitive Snippets"}
            {mode === "manage" && "⚙ Manage Vault Security"}
          </h2>
          <button
            type="button"
            className="vault-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </header>

        {mode === "manage" && (
          <div className="vault-modal__tabs">
            <button
              type="button"
              className={`vault-modal__tab ${manageTab === "change" ? "vault-modal__tab--active" : ""}`}
              onClick={() => {
                setManageTab("change");
                setError(null);
              }}
            >
              Change Passphrase
            </button>
            <button
              type="button"
              className={`vault-modal__tab ${manageTab === "disable" ? "vault-modal__tab--active" : ""}`}
              onClick={() => {
                setManageTab("disable");
                setError(null);
              }}
            >
              Disable Encryption
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="vault-modal__form">
          {mode === "setup" && (
            <p className="vault-modal__description">
              Choose a master passphrase. Sensitive snippets will be encrypted
              using <strong>AES-256-GCM</strong> with an Argon2id-derived key.
              The passphrase is never stored on disk.
            </p>
          )}

          {mode === "unlock" && (
            <p className="vault-modal__description">
              Enter your master passphrase to decrypt and view sensitive snippets
              for this session.
            </p>
          )}

          {mode === "manage" && manageTab === "disable" && (
            <p className="vault-modal__description vault-modal__description--warn">
              Disabling encryption will decrypt all sensitive snippets back to
              unencrypted plaintext in the database.
            </p>
          )}

          {error && (
            <div className="vault-modal__error" role="alert">
              {error}
            </div>
          )}

          {mode === "setup" && (
            <>
              <div className="vault-modal__field">
                <label htmlFor="setup-passphrase">Master Passphrase</label>
                <input
                  id="setup-passphrase"
                  ref={inputRef}
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter a strong passphrase"
                  disabled={busy}
                  required
                />
              </div>
              <div className="vault-modal__field">
                <label htmlFor="setup-confirm">Confirm Passphrase</label>
                <input
                  id="setup-confirm"
                  type="password"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Re-enter passphrase"
                  disabled={busy}
                  required
                />
              </div>
            </>
          )}

          {mode === "unlock" && (
            <div className="vault-modal__field">
              <label htmlFor="unlock-passphrase">Master Passphrase</label>
              <input
                id="unlock-passphrase"
                ref={inputRef}
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter your passphrase"
                disabled={busy}
                required
              />
            </div>
          )}

          {mode === "manage" && manageTab === "change" && (
            <>
              <div className="vault-modal__field">
                <label htmlFor="change-old">Current Passphrase</label>
                <input
                  id="change-old"
                  ref={inputRef}
                  type="password"
                  value={oldPassphrase}
                  onChange={(e) => setOldPassphrase(e.target.value)}
                  placeholder="Enter current passphrase"
                  disabled={busy}
                  required
                />
              </div>
              <div className="vault-modal__field">
                <label htmlFor="change-new">New Passphrase</label>
                <input
                  id="change-new"
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter new passphrase"
                  disabled={busy}
                  required
                />
              </div>
              <div className="vault-modal__field">
                <label htmlFor="change-confirm">Confirm New Passphrase</label>
                <input
                  id="change-confirm"
                  type="password"
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Re-enter new passphrase"
                  disabled={busy}
                  required
                />
              </div>
            </>
          )}

          {mode === "manage" && manageTab === "disable" && (
            <div className="vault-modal__field">
              <label htmlFor="disable-passphrase">Current Passphrase</label>
              <input
                id="disable-passphrase"
                ref={inputRef}
                type="password"
                value={oldPassphrase}
                onChange={(e) => setOldPassphrase(e.target.value)}
                placeholder="Enter current passphrase to confirm"
                disabled={busy}
                required
              />
            </div>
          )}

          <div className="vault-modal__actions">
            <button
              type="button"
              className="vault-modal__btn vault-modal__btn--cancel"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="vault-modal__btn vault-modal__btn--submit"
              disabled={busy}
            >
              {busy
                ? "Processing…"
                : mode === "setup"
                  ? "Enable Encryption"
                  : mode === "unlock"
                    ? "Unlock"
                    : manageTab === "change"
                      ? "Update Passphrase"
                      : "Disable Encryption"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
