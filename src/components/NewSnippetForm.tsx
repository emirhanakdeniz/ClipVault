import { useState } from "react";
import type { FormEvent } from "react";
import type { SnippetType } from "../types";

interface NewSnippetFormProps {
  onCreate: (input: {
    title: string;
    content: string;
    type: SnippetType;
    tags: string[];
    sensitive?: boolean;
  }) => void;
  onCancel: () => void;
  notice?: string | null;
  onDismissNotice?: () => void;
}

const TYPE_OPTIONS: { value: SnippetType; label: string }[] = [
  { value: "code", label: "Code" },
  { value: "text", label: "Text" },
  { value: "link", label: "Link" },
];

export default function NewSnippetForm({
  onCreate,
  onCancel,
  notice = null,
  onDismissNotice,
}: NewSnippetFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<SnippetType>("text");
  const [tagsInput, setTagsInput] = useState("");
  const [sensitive, setSensitive] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;
    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim().replace(/^#/, ""))
      .filter(Boolean);
    onCreate({
      title: title.trim() || "Untitled snippet",
      content: trimmedContent,
      type,
      tags: [...new Set(tags)],
      sensitive,
    });
  }

  return (
    <form className="newsnippet" onSubmit={handleSubmit}>
      {notice && (
        <p className="newsnippet__notice" role="status">
          {notice}
        </p>
      )}
      <input
        className="newsnippet__input"
        type="text"
        placeholder="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        aria-label="Snippet title"
      />
      <textarea
        className="newsnippet__textarea"
        placeholder="Snippet content"
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          // Editing the content invalidates the duplicate warning.
          if (notice) onDismissNotice?.();
        }}
        aria-label="Snippet content"
        rows={3}
        autoFocus
      />
      <input
        className="newsnippet__input"
        type="text"
        placeholder="Tags (comma-separated)"
        value={tagsInput}
        onChange={(event) => setTagsInput(event.target.value)}
        aria-label="Snippet tags"
      />
      <div className="newsnippet__row">
        <select
          className="newsnippet__select"
          value={type}
          onChange={(event) => setType(event.target.value as SnippetType)}
          aria-label="Snippet type"
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label className="newsnippet__sensitive-label">
          <input
            type="checkbox"
            checked={sensitive}
            onChange={(e) => setSensitive(e.target.checked)}
          />
          <span>🔒 Sensitive</span>
        </label>
        <div className="newsnippet__actions">
          <button className="newsnippet__cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="newsnippet__submit"
            type="submit"
            disabled={!content.trim()}
          >
            Save snippet
          </button>
        </div>
      </div>
    </form>
  );
}
