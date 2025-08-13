import { nextDueFrom, shouldIncrementStreak } from '../lib/recurrence';

describe('recurrence helpers', () => {
  test('daily moves due by 1 day', () => {
    expect(nextDueFrom('2025-08-10', 'daily', '2025-08-10')).toBe('2025-08-11');
  });
  test('weekly moves due by 7 days', () => {
    expect(nextDueFrom('2025-08-10', 'weekly', '2025-08-10')).toBe('2025-08-17');
  });
  test('monthly respects month length', () => {
    expect(nextDueFrom('2025-01-31', 'monthly', '2025-01-31')).toBe('2025-02-28');
  });
  test('streak increments when completed on or before due', () => {
    expect(shouldIncrementStreak('2025-08-10', '2025-08-10')).toBe(true);
    expect(shouldIncrementStreak('2025-08-09', '2025-08-10')).toBe(true);
  });
  test('streak does not increment when completed after due', () => {
    expect(shouldIncrementStreak('2025-08-11', '2025-08-10')).toBe(false);
  });
  test('streak increments when no due set', () => {
    expect(shouldIncrementStreak('2025-08-10', null)).toBe(true);
  });
});
