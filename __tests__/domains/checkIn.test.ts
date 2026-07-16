/**
 * Daily resilience check-in domain tests
 */

import { buildDailyResilienceCheckIn } from '@/src/domains/wellbeing';
import type { MoodLog } from '@/src/domains/wellbeing';

const createMood = (moodValue: number): MoodLog => ({
  id: `mood-${moodValue}`,
  userId: 'user-1',
  moodValue,
  moodEmoji: '🙂',
  moodLabel: 'Test',
  timestamp: new Date('2026-02-28T10:00:00.000Z'),
});

describe('daily resilience check-in', () => {
  it('starts with a mood log when there is no recent mood signal', () => {
    const checkIn = buildDailyResilienceCheckIn({
      latestMood: null,
      moodLogsToday: 0,
      journalEntriesToday: 0,
    });

    expect(checkIn.primaryActionType).toBe('logMood');
    expect(checkIn.title).toBe('Start Your Daily Reset');
    expect(checkIn.signals).toHaveLength(3);
  });

  it('routes low-mood days toward grounding support after a mood has been logged', () => {
    const checkIn = buildDailyResilienceCheckIn({
      latestMood: createMood(1),
      moodLogsToday: 1,
      journalEntriesToday: 0,
    });

    expect(checkIn.primaryActionType).toBe('chat');
    expect(checkIn.primaryActionLabel).toContain('grounding');
    expect(checkIn.recoveryFocus).toContain('Lower demand');
  });

  it('uses journaling on steadier days when progress has not been captured yet', () => {
    const checkIn = buildDailyResilienceCheckIn({
      latestMood: createMood(4),
      moodLogsToday: 1,
      journalEntriesToday: 0,
    });

    expect(checkIn.primaryActionType).toBe('journal');
    expect(checkIn.primaryActionLabel).toContain('Record');
    expect(checkIn.signals.every((signal) => signal.status === 'strong')).toBe(true);
  });
});
