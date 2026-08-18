import type { ViewId } from "../types";
import type { DateRange, SnippetFilters } from "../lib/search";
import { hasFilters } from "../lib/search";
import { IconHeart, IconBookmark, IconArchive } from "./Icons";

interface FilterBarProps {
  view: ViewId;
  filters: SnippetFilters;
  tags: string[];
  onChange: (filters: SnippetFilters) => void;
}

const DATE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
];

/**
 * Smart search filters. All chips/selects combine with the search text via
 * AND inside getVisibleSnippets — this bar only owns filter state.
 */
export default function FilterBar({
  view,
  filters,
  tags,
  onChange,
}: FilterBarProps) {
  const active = hasFilters(filters);

  function toggle(key: "favorite" | "pinned" | "includeArchived") {
    onChange({ ...filters, [key]: !filters[key] });
  }

  return (
    <div className="filterbar" role="group" aria-label="Search filters">
      <button
        type="button"
        className={
          filters.favorite
            ? "filterbar__chip filterbar__chip--active"
            : "filterbar__chip"
        }
        onClick={() => toggle("favorite")}
        aria-pressed={filters.favorite === true}
      >
        <IconHeart size={12} filled={filters.favorite === true} />
        <span>Favorites</span>
      </button>
      <button
        type="button"
        className={
          filters.pinned
            ? "filterbar__chip filterbar__chip--active"
            : "filterbar__chip"
        }
        onClick={() => toggle("pinned")}
        aria-pressed={filters.pinned === true}
      >
        <IconBookmark size={12} filled={filters.pinned === true} />
        <span>Pinned</span>
      </button>
      {view !== "archive" && (
        <button
          type="button"
          className={
            filters.includeArchived
              ? "filterbar__chip filterbar__chip--active"
              : "filterbar__chip"
          }
          onClick={() => toggle("includeArchived")}
          aria-pressed={filters.includeArchived === true}
        >
          <IconArchive size={12} />
          <span>Archived</span>
        </button>
      )}
      {tags.length > 0 && (
        <select
          className="filterbar__select"
          value={filters.tag ?? ""}
          onChange={(event) =>
            onChange({ ...filters, tag: event.target.value || null })
          }
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>
      )}
      <select
        className="filterbar__select"
        value={filters.dateRange ?? "all"}
        onChange={(event) =>
          onChange({
            ...filters,
            dateRange: event.target.value as DateRange,
          })
        }
        aria-label="Filter by date"
      >
        {DATE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {active && (
        <button
          type="button"
          className="filterbar__clear"
          onClick={() => onChange({})}
        >
          clear
        </button>
      )}
    </div>
  );
}