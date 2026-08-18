import { useEffect, useRef } from "react";
import { IconKeyboard } from "./Icons";
import { isMac } from "../lib/shortcuts";

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsHelpModal({
  isOpen,
  onClose,
}: ShortcutsHelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const modKey = isMac() ? "Cmd" : "Ctrl";

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-help-title"
    >
      <div
        ref={modalRef}
        className="shortcuts-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shortcuts-modal__header">
          <div className="shortcuts-modal__title-row">
            <span className="shortcuts-modal__icon">
              <IconKeyboard size={18} />
            </span>
            <h3 id="shortcuts-help-title" className="shortcuts-modal__title">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            type="button"
            className="shortcuts-modal__close"
            onClick={onClose}
            aria-label="Close shortcuts guide"
          >
            ×
          </button>
        </header>

        <div className="shortcuts-modal__content">
          <div className="shortcuts-modal__group">
            <span className="shortcuts-modal__group-title">Search &amp; Navigation</span>
            <div className="shortcuts-modal__item">
              <span>Focus search bar</span>
              <div>
                <kbd>{modKey}</kbd> + <kbd>K</kbd>
              </div>
            </div>
            <div className="shortcuts-modal__item">
              <span>Focus quick capture</span>
              <div>
                <kbd>{modKey}</kbd> + <kbd>I</kbd>
              </div>
            </div>
            <div className="shortcuts-modal__item">
              <span>New snippet dialog</span>
              <div>
                <kbd>{modKey}</kbd> + <kbd>N</kbd>
              </div>
            </div>
            <div className="shortcuts-modal__item">
              <span>Navigate snippets</span>
              <div>
                <kbd>↑</kbd> / <kbd>↓</kbd>
              </div>
            </div>
            <div className="shortcuts-modal__item">
              <span>Jump to Settings</span>
              <div>
                <kbd>{modKey}</kbd> + <kbd>,</kbd>
              </div>
            </div>
          </div>

          <div className="shortcuts-modal__group">
            <span className="shortcuts-modal__group-title">Snippet Actions</span>
            <div className="shortcuts-modal__item">
              <span>Copy selected snippet</span>
              <div>
                <kbd>{modKey}</kbd> + <kbd>C</kbd>
              </div>
            </div>
            <div className="shortcuts-modal__item">
              <span>Open in full editor</span>
              <div>
                <kbd>Enter</kbd>
              </div>
            </div>
            <div className="shortcuts-modal__item">
              <span>Toggle favorite</span>
              <div>
                <kbd>{modKey}</kbd> + <kbd>D</kbd> or <kbd>F</kbd>
              </div>
            </div>
            <div className="shortcuts-modal__item">
              <span>Pin / Unpin to top</span>
              <div>
                <kbd>P</kbd>
              </div>
            </div>
            <div className="shortcuts-modal__item">
              <span>Archive selected</span>
              <div>
                <kbd>Del</kbd> / <kbd>Backspace</kbd>
              </div>
            </div>
            <div className="shortcuts-modal__item">
              <span>Clear selection / Close</span>
              <div>
                <kbd>Esc</kbd>
              </div>
            </div>
          </div>
        </div>

        <footer className="shortcuts-modal__footer">
          <span>Press <kbd>?</kbd> or <kbd>F1</kbd> anywhere to toggle this guide</span>
        </footer>
      </div>
    </div>
  );
}
