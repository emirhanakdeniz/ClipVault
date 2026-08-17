export type ViewId = "snippets" | "favorites";

interface SidebarProps {
  activeView: ViewId;
  onSelect: (view: ViewId) => void;
}

const NAV_ITEMS: { id: ViewId; label: string }[] = [
  { id: "snippets", label: "Snippets" },
  { id: "favorites", label: "Favorites" },
];

export default function Sidebar({ activeView, onSelect }: SidebarProps) {
  return (
    <nav className="sidebar">
      <div className="sidebar__brand">ClipVault</div>
      <div className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              item.id === activeView
                ? "sidebar__item sidebar__item--active"
                : "sidebar__item"
            }
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
