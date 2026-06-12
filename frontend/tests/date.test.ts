import { describe, expect, it } from 'vitest';
import { formatDate, toDateInputValue, isOverdue } from '@/lib/date';

describe('date helpers', () => {
  describe('formatDate', () => {
    it('returns an em-dash placeholder for null/undefined', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('')).toBe('—');
    });

    it('returns a placeholder for unparseable input', () => {
      expect(formatDate('not a date')).toBe('—');
    });

    it('formats a valid ISO string', () => {
      // Don't lock in locale exactly; just ensure the year is included.
      expect(formatDate('2025-06-15T00:00:00Z')).toMatch(/2025/);
    });
  });

  describe('toDateInputValue', () => {
    it('returns an empty string for null/undefined', () => {
      expect(toDateInputValue(null)).toBe('');
      expect(toDateInputValue(undefined)).toBe('');
    });

    it('returns YYYY-MM-DD for a valid date', () => {
      expect(toDateInputValue('2025-06-15T10:00:00Z')).toBe('2025-06-15');
    });
  });

  describe('isOverdue', () => {
    it('is false when no due date is set', () => {
      expect(isOverdue(null, 'PENDING')).toBe(false);
    });

    it('is false when the task is already completed', () => {
      expect(isOverdue('2000-01-01T00:00:00Z', 'COMPLETED')).toBe(false);
    });

    it('is true when the due date is in the past and the task is not completed', () => {
      expect(isOverdue('2000-01-01T00:00:00Z', 'PENDING')).toBe(true);
    });

    it('is false when the due date is in the future', () => {
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      expect(isOverdue(future, 'PENDING')).toBe(false);
    });
  });
});
