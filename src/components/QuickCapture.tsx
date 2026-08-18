import { useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

interface QuickCaptureProps {
  onCreate: (input: {
    title: string;
    content: string;
    type: "text";
    tags: string[];
  }) => Promise<boolean> | boolean | void;
  notice?: string | null;
  onDismissNotice?: () => void;
}

/**
 * Always-visible single-row capture bar for saving a snippet without
 * opening the full editor. Optimized for keyboard use: Enter saves,
 * Esc clears, and the content field is refocused after each save so
 * successive captures need no mouse.
 */
export default function QuickCapture({
  onCreate,
  notice = null,
  onDismissNotice,
}: QuickCaptureProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const contentRef = useRef<HTMLInputElement>(null);

  function clearForm() {
    setTitle("");
    setContent("");
    setSaved(false);
    onDismissNotice?.();
    contentRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;
    const ok = await onCreate({
      title: title.trim() || "Untitled snippet",
      content: trimmedContent,
      type: "text",
      tags: [],
    });
    // Only clear on a successful save; duplicates and errors keep the
    // input so the user can adjust or copy it away.
    if (ok !== false) {
      clearForm();
      showSavedFeedback();
    } else {
      contentRef.current?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      clearForm();
    }
  }

  function showSavedFeedback() {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  }

  return (
    <form className="quickcapture" onSubmit={handleSubmit}>
      <input
        className="quickcapture__input quickcapture__title"
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Quick capture title (optional)"
      />
      <input
        ref={contentRef}
        className="quickcapture__input quickcapture__content"
        type="text"
        placeholder="Quick capture…"
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          // Editing the content invalidates the duplicate warning.
          if (notice) onDismissNotice?.();
        }}
        onKeyDown={handleKeyDown}
        aria-label="Quick capture content"
      />
      {notice ? (
        <span className="quickcapture__notice" role="status">
          {notice}
        </span>
      ) : (
        <span className="quickcapture__status" role="status">
          {saved ? "Saved" : ""}
        </span>
      )}
      <button
        className="quickcapture__save"
        type="submit"
        disabled={!content.trim()}
      >
        Save
      </button>
    </form>
  );
}
