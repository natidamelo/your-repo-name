/**
 * Utility functions for reliable local date handling across the app.
 */

/**
 * Returns today's local date in 'YYYY-MM-DD' format.
 * Uses getFullYear(), getMonth(), and getDate() so it ALWAYS reflects
 * the user's local timezone (never shifts by UTC offset).
 */
export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object or 'YYYY-MM-DD' string to 'YYYY-MM-DD'.
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
