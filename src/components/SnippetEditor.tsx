import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Snippet } from "../types";

interface SnippetEditorProps {
  snippet: Snippet;
  onSave: (id: string, title: string, content: string) => Promise<Snippet>;
  onClose?: () => void;
}

type SaveState = "idle" | "dirty" | "saving" | "saved";

/** Debounce window before an edited draft is persisted automatically. */
const AUTOSAVE_DELAY_MS = 800;
/** How long the "Saved" indicator stays visible before fading back to idle. */
const SAVED_HINT_MS = 2000;

const STATE_LABELS: Record<SaveState, string> = {
  idle: "",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved ✓",
};

/**
 * Inline editor for the selected snippet. Autosaves a debounced draft; a
 * draft identical to the last saved snapshot never triggers a database
 * write. Unsaved edits survive the editor losing focus — the draft lives
 * in local state and is only reset when a different snippet is mounted
 * (the parent keys this component by snippet id).
 */
export default function SnippetEditor({
  snippet,
  onSave,
  onClose,
}: SnippetEditorProps) {
  const [title, setTitle] = useState(snippet.title);
  const [content, setContent] = useState(snippet.content);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Last snapshot known to be persisted. Autosave compares against this,
  // so unchanged drafts never hit the database.
  const savedRef = useRef({ title: snippet.title, content: snippet.content });
  const savedHintTimer = useRef<number | undefined>(undefined);

  const isDirty =
    title !== savedRef.current.title || content !== savedRef.current.content;

  // Re-derive the indicator whenever the draft changes; the debounce below
  // performs the actual save.
  useEffect(() => {
    if (saveState === "saving") return;
    if (isDirty) {
      // New edits cancel any lingering "Saved ✓" hint.
      window.clearTimeout(savedHintTimer.current);
      setSaveState("dirty");
    } else if (saveState !== "saved") {
      setSaveState("idle");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  useEffect(() => {
    return () => window.clearTimeout(savedHintTimer.current);
  }, []);

  function markSaved() {
    setSaveState("saved");
    window.clearTimeout(savedHintTimer.current);
    savedHintTimer.current = window.setTimeout(
      () => setSaveState("idle"),
      SAVED_HINT_MS,
    );
  }

  async function save(nextTitle: string, nextContent: string) {
    // Skip empty content (same rule as the new-snippet form) and skip
    // unchanged drafts so no unnecessary database write is issued.
    if (!nextContent.trim()) return;
    if (
      nextTitle === savedRef.current.title &&
      nextContent === savedRef.current.content
    ) {
      return;
    }
    setSaveState("saving");
    try {
      await onSave(snippet.id, nextTitle, nextContent);
      savedRef.current = { title: nextTitle, content: nextContent };
      markSaved();
    } catch {
      // Keep the draft and mark it dirty so autosave retries on the
      // next edit; the parent surfaces the error banner.
      setSaveState("dirty");
    }
  }

  // Debounced autosave for dirty drafts.
  useEffect(() => {
    if (!isDirty) return;
    const timer = window.setTimeout(() => {
      void save(title, content);
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  // Flush pending edits when the editor unmounts (e.g. the user selects a
  // different snippet) so no unsaved change is lost.
  const draftRef = useRef({ title, content });
  draftRef.current = { title, content };
  useEffect(() => {
    const draft = draftRef.current;
    return () => {
      if (
        draft.content.trim() &&
        (draft.title !== savedRef.current.title ||
          draft.content !== savedRef.current.content)
      ) {
        void onSave(snippet.id, draft.title, draft.content);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snippet.id]);

  function handleTitleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // Enter in the title moves to the content field instead of submitting.
    if (event.key === "Enter") {
      event.preventDefault();
      document
        .querySelector<HTMLTextAreaElement>(".snippeteditor__textarea")
        ?.focus();
    }
  }

  function handleContentKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Ctrl/Cmd+Enter saves immediately; Escape returns to the title field.
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void save(draftRef.current.title, draftRef.current.content);
    } else if (event.key === "Escape") {
      event.preventDefault();
      document
        .querySelector<HTMLInputElement>(".snippeteditor__input")
        ?.focus();
    }
  }

  return (
    <form
      className="snippeteditor"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="snippeteditor__heading">
        <span className="snippeteditor__heading-label">Edit snippet</span>
        {snippet.sensitive && (
          <span
            className="snippeteditor__sensitive"
            title="This snippet is marked sensitive — its content is hidden in previews until revealed"
          >
            🔒 Sensitive
          </span>
        )}
        <span
          className={`snippeteditor__status${
            saveState === "saved" ? " snippeteditor__status--saved" : ""
          }${saveState === "dirty" ? " snippeteditor__status--dirty" : ""}`}
          role="status"
        >
          {STATE_LABELS[saveState]}
        </span>
        {onClose && (
          <button
            type="button"
            className="snippeteditor__close"
            onClick={onClose}
            aria-label="Close editor"
          >
            ×
          </button>
        )}
      </div>
      <input
        className="snippeteditor__input"
        type="text"
        placeholder="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={handleTitleKeyDown}
        aria-label="Snippet title"
        autoFocus
      />
      <textarea
        className="snippeteditor__textarea"
        placeholder="Snippet content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleContentKeyDown}
        aria-label="Snippet content"
        rows={5}
      />
    </form>
  );
}

