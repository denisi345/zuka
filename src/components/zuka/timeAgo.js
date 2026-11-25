export function formatTimeAgo(dateInput, fallbackLabel = '') {
  if (!dateInput) return fallbackLabel || 'Just now';
  const time = new Date(dateInput).getTime();
  if (Number.isNaN(time)) return fallbackLabel || 'Just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
