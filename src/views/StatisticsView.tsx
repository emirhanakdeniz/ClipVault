import { useEffect, useState } from "react";
import type { UsageStatistics } from "../types";
import { getUsageStatistics } from "../lib/api";
import { relativeTime } from "../lib/time";

interface StatisticsViewProps {
  onSelectSnippet?: (id: string) => void;
}

export default function StatisticsView({
  onSelectSnippet,
}: StatisticsViewProps) {
  const [stats, setStats] = useState<UsageStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = () => {
    setLoading(true);
    getUsageStatistics()
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err) => {
        setError(String(err));
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="stats-view stats-view--loading">
        <span className="stats-view__spinner">Loading usage metrics…</span>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="stats-view">
        <div className="error-banner" role="alert">
          Failed to load statistics: {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const codeCount = stats.typeCounts["code"] ?? 0;
  const textCount = stats.typeCounts["text"] ?? 0;
  const linkCount = stats.typeCounts["link"] ?? 0;
  const totalTypeCount = stats.totalSnippets || 1;

  const manualCount = stats.sourceCounts["manual"] ?? 0;
  const clipboardCount = stats.sourceCounts["clipboard"] ?? 0;
  const totalSourceCount = stats.totalSnippets || 1;

  return (
    <div className="stats-view" aria-label="Usage Statistics">
      <header className="stats-view__header">
        <div>
          <h2 className="stats-view__title">Usage Statistics</h2>
          <p className="stats-view__subtitle">
            🔒 100% Local Analytics — Zero telemetry, zero external network requests
          </p>
        </div>
        <button
          type="button"
          className="stats-view__refresh"
          onClick={loadStats}
          title="Refresh statistics"
        >
          ⟳ Refresh
        </button>
      </header>

      <section className="stats-grid">
        <div className="stats-card">
          <span className="stats-card__label">Total Snippets</span>
          <span className="stats-card__value">{stats.totalSnippets}</span>
          <span className="stats-card__meta">
            {stats.activeSnippets} active · {stats.archivedSnippets} archived
          </span>
        </div>

        <div className="stats-card stats-card--highlight">
          <span className="stats-card__label">Total Copy Actions</span>
          <span className="stats-card__value">{stats.totalCopies}</span>
          <span className="stats-card__meta">
            Lifetime clipboard copies
          </span>
        </div>

        <div className="stats-card">
          <span className="stats-card__label">Favorites &amp; Pinned</span>
          <span className="stats-card__value">
            ★ {stats.favoriteSnippets}
          </span>
          <span className="stats-card__meta">
            📌 {stats.pinnedSnippets} pinned to top
          </span>
        </div>

        <div className="stats-card">
          <span className="stats-card__label">Sensitive &amp; Tags</span>
          <span className="stats-card__value">
            🔒 {stats.sensitiveSnippets}
          </span>
          <span className="stats-card__meta">
            🏷️ {stats.totalTags} unique tags
          </span>
        </div>
      </section>

      <div className="stats-breakdowns">
        <section className="stats-panel">
          <h3 className="stats-panel__title">Type Distribution</h3>
          <div className="stats-bars">
            <div className="stats-bar-row">
              <div className="stats-bar-row__header">
                <span className="card__type card__type--code">code</span>
                <span className="stats-bar-row__count">{codeCount}</span>
              </div>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill stats-bar-fill--code"
                  style={{
                    width: `${Math.round((codeCount / totalTypeCount) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="stats-bar-row">
              <div className="stats-bar-row__header">
                <span className="card__type card__type--text">text</span>
                <span className="stats-bar-row__count">{textCount}</span>
              </div>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill stats-bar-fill--text"
                  style={{
                    width: `${Math.round((textCount / totalTypeCount) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="stats-bar-row">
              <div className="stats-bar-row__header">
                <span className="card__type card__type--link">link</span>
                <span className="stats-bar-row__count">{linkCount}</span>
              </div>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill stats-bar-fill--link"
                  style={{
                    width: `${Math.round((linkCount / totalTypeCount) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="stats-panel">
          <h3 className="stats-panel__title">Source Breakdown</h3>
          <div className="stats-bars">
            <div className="stats-bar-row">
              <div className="stats-bar-row__header">
                <span className="stats-pill stats-pill--manual">Manual Entry</span>
                <span className="stats-bar-row__count">{manualCount}</span>
              </div>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill stats-bar-fill--manual"
                  style={{
                    width: `${Math.round((manualCount / totalSourceCount) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="stats-bar-row">
              <div className="stats-bar-row__header">
                <span className="stats-pill stats-pill--clipboard">
                  Clipboard Auto-Capture
                </span>
                <span className="stats-bar-row__count">{clipboardCount}</span>
              </div>
              <div className="stats-bar-track">
                <div
                  className="stats-bar-fill stats-bar-fill--clipboard"
                  style={{
                    width: `${Math.round(
                      (clipboardCount / totalSourceCount) * 100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="stats-panel stats-panel--top">
        <h3 className="stats-panel__title">Most Frequently Copied Snippets</h3>
        {stats.topCopied.length === 0 ? (
          <p className="stats-panel__empty">
            No snippet copies recorded yet. Copy snippets with the{" "}
            <strong>Copy</strong> button or <code>Ctrl+C</code> to track usage
            rankings here.
          </p>
        ) : (
          <ul className="stats-leaderboard">
            {stats.topCopied.map((item, index) => (
              <li
                key={item.id}
                className="stats-leaderboard__item"
                onClick={() => onSelectSnippet?.(item.id)}
                title="Click to view/edit this snippet"
              >
                <span className="stats-leaderboard__rank">#{index + 1}</span>
                <div className="stats-leaderboard__info">
                  <div className="stats-leaderboard__title-row">
                    {item.sensitive && (
                      <span
                        className="card__sensitive-badge"
                        title="Sensitive snippet"
                      >
                        🔒
                      </span>
                    )}
                    {item.favorite && (
                      <span className="stats-leaderboard__star">★</span>
                    )}
                    <span className="stats-leaderboard__title">
                      {item.title}
                    </span>
                  </div>
                  <div className="stats-leaderboard__meta">
                    <span className={`card__type card__type--${item.type}`}>
                      {item.type}
                    </span>
                    <span className="stats-leaderboard__time">
                      {relativeTime(item.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="stats-leaderboard__count-badge">
                  {item.copyCount} {item.copyCount === 1 ? "copy" : "copies"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
