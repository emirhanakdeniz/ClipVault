export default function SnippetsView() {
  return (
    <div className="view">
      <h1 className="view__title">Snippets</h1>
      <div className="empty-state">
        <span className="empty-state__icon">&#128203;</span>
        <span className="empty-state__text">No snippets yet</span>
      </div>
    </div>
  );
}
