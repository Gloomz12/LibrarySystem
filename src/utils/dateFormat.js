/**
 * Centralized date formatting utilities.
 * All dates displayed in the app go through these functions.
 */

/**
 * Format a date string or Date object as "Jan 15, 2025"
 */
export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Format a date as "Jan 15, 2025 · 10:30 AM"
 */
export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Format a MySQL DATE string "YYYY-MM-DD" as "Jan 15, 2025"
 * Avoids timezone shift by parsing as local date.
 */
export function formatSqlDate(value) {
  if (!value) return '—';
  // MySQL DATE comes as "2025-01-15" — parse as local to avoid UTC shift
  const parts = String(value).split('T')[0].split('-');
  if (parts.length !== 3) return value;
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  if (isNaN(d)) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Returns a live clock string: "Thursday, May 28, 2026 · 10:30:45 AM"
 * Call inside a useEffect with setInterval(1000).
 */
export function getLiveClock() {
  const now = new Date();
  const day  = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  return `${day} · ${time}`;
}
