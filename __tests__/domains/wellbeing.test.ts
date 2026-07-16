/**
 * Wellbeing Domain Tests
 */

import { buildWeeklyMoodProgress, calculateActivityStreak } from '@/src/domains/wellbeing';
import type { MoodLog } from '@/src/domains/wellbeing';

const buildMoodLog = (dayOffset: number, moodValue: number): MoodLog => {
  const timestamp = new Date();
  timestamp.setHours(12, 0, 0, 0);
  timestamp.setDate(timestamp.getDate() - dayOffset);

  return {
    userId: 'test-user',
    moodValue,
    moodEmoji: '🙂',
    moodLabel: 'Okay',
    timestamp,
  };
};

describe('wellbeing domain', () => {
  describe('calculateActivityStreak', () => {
    it('returns zero when there are no dates', () => {
      expect(calculateActivityStreak([])).toBe(0);
    });

    it('counts consecutive activity days from today backwards', () => {
      const today = new Date();
      const yesterday = new Date();
      const twoDaysAgo = new Date();

      yesterday.setDate(yesterday.getDate() - 1);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      expect(calculateActivityStreak([twoDaysAgo, yesterday, today])).toBe(3);
    });

    it('returns zero when the latest activity is older than yesterday', () => {
      const threeDaysAgo = new Date();
      const fourDaysAgo = new Date();

      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      expect(calculateActivityStreak([fourDaysAgo, threeDaysAgo])).toBe(0);
    });
  });

  describe('buildWeeklyMoodProgress', () => {
    it('returns a 7-day array with averaged mood percentages', () => {
      const moodLogs: MoodLog[] = [buildMoodLog(0, 5), buildMoodLog(0, 3), buildMoodLog(2, 2)];

      const progress = buildWeeklyMoodProgress(moodLogs);

      expect(progress).toHaveLength(7);
      expect(progress[6]).toBe(80);
      expect(progress[4]).toBe(40);
      expect(progress[5]).toBe(0);
    });

    it('supports custom day ranges', () => {
      const progress = buildWeeklyMoodProgress([buildMoodLog(0, 4)], 3);

      expect(progress).toEqual([0, 0, 80]);
    });
  });
});
