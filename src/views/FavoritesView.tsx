export default function FavoritesView() {
  return (
    <div className="view">
      <h1 className="view__title">Favorites</h1>
      <div className="empty-state">
        <span className="empty-state__icon">&#11088;</span>
        <span className="empty-state__text">No favorites yet</span>
      </div>
    </div>
  );
}
