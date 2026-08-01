/**
 * Format UZS price: 35000 -> '35,000 soʻm'
 */
export function formatUZS(amount: number): string {
  return `${amount.toLocaleString('en-US')} so\u02BBm`;
}

/**
 * Format order number: 10241 -> 'PLT-10241'
 */
export function formatOrderNumber(num: number): string {
  return `PLT-${String(num).padStart(5, '0')}`;
}

/**
 * Format relative time: '2 min ago', '1h ago'
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
}

/**
 * Format Tashkent time
 */
export function formatTashkentTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Tashkent',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format date short: 'Aug 1, 2026'
 */
export function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Tashkent',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
