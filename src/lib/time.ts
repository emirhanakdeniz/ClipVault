const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function relativeTime(timestamp: number): string {
  const elapsed = Date.now() - timestamp;
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  const days = Math.floor(elapsed / DAY);
  if (days < 30) return days === 1 ? "1d ago" : `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
