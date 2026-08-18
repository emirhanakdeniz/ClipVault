import { IconSearch } from "./Icons";

interface SearchBarProps {
  query: string;
  onChange: (query: string) => void;
}

export default function SearchBar({ query, onChange }: SearchBarProps) {
  return (
    <div className="searchbar">
      <span className="searchbar__prompt" aria-hidden="true">
        <IconSearch size={14} />
      </span>
      <input
        className="searchbar__input"
        type="text"
        placeholder="Search snippets…"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Search snippets"
      />
      {query.length > 0 ? (
        <button
          className="searchbar__clear"
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          clear
        </button>
      ) : (
        <kbd className="searchbar__kbd">Ctrl K</kbd>
      )}
    </div>
  );
}

