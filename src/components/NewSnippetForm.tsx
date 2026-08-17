import { useState } from "react";
import type { FormEvent } from "react";
import type { SnippetType } from "../types";

interface NewSnippetFormProps {
  onCreate: (input: { title: string; content: string; type: SnippetType }) => void;
  onCancel: () => void;
}

const TYPE_OPTIONS: { value: SnippetType; label: string }[] = [
  { value: "code", label: "Code" },
  { value: "text", label: "Text" },
  { value: "link", label: "Link" },
];

export default function NewSnippetForm({ onCreate, onCancel }: NewSnippetFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<SnippetType>("text");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;
    onCreate({
      title: title.trim() || "Untitled snippet",
      content: trimmedContent,
      type,
    });
  }

  return (
    <form className="newsnippet" onSubmit={handleSubmit}>
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
        onChange={(event) => setContent(event.target.value)}
        aria-label="Snippet content"
        rows={3}
        autoFocus
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
