import { describe, it, expect } from 'vitest';
import { formatUZS, formatOrderNumber, formatRelativeTime } from '@/lib/format';

describe('Format Utilities', () => {
  it('formats UZS sums with thousands separators', () => {
    expect(formatUZS(1000)).toContain('1,000');
    expect(formatUZS(1000)).toContain('soʻm');
    expect(formatUZS(35000)).toContain('35,000');
    expect(formatUZS(4250000)).toContain('4,250,000');
  });

  it('formats order numbers cleanly with PLT prefix', () => {
    expect(formatOrderNumber(10245)).toBe('PLT-10245');
    expect(formatOrderNumber(7)).toBe('PLT-00007');
  });

  it('formats relative timestamps', () => {
    const justNow = new Date();
    expect(formatRelativeTime(justNow)).toBe('just now');

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinsAgo)).toBe('5m ago');

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
  });
});
