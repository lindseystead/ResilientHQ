/**
 * Resilience Domain Tests
 */

import {
  buildResiliencePlan,
  getResilienceContentDeck,
  shuffleAndTake,
} from '@/src/domains/wellbeing';
import type { MoodLog } from '@/src/domains/wellbeing';

const createMoodLog = (moodValue: number): MoodLog => ({
  userId: 'test-user',
  moodValue,
  moodEmoji: '🙂',
  moodLabel: 'Test',
  timestamp: new Date(),
});

describe('resilience domain', () => {
  describe('shuffleAndTake', () => {
    it('returns the requested number of items', () => {
      const result = shuffleAndTake([1, 2, 3, 4], 2, () => 0);

      expect(result).toHaveLength(2);
    });

    it('does not mutate the original input', () => {
      const values = [1, 2, 3, 4];

      shuffleAndTake(values, 3, () => 0.5);

      expect(values).toEqual([1, 2, 3, 4]);
    });
  });

  describe('getResilienceContentDeck', () => {
    it('returns a bounded content set for the advice screen', () => {
      const deck = getResilienceContentDeck(() => 0);

      expect(deck.tips).toHaveLength(4);
      expect(deck.groundingIdeas).toHaveLength(5);
      expect(deck.energyCheck.length).toBeGreaterThan(0);
      expect(deck.encouragement).toHaveLength(3);
      expect(deck.resources.length).toBeGreaterThan(0);
    });
  });

  describe('buildResiliencePlan', () => {
    it('returns a baseline plan when no mood is available', () => {
      const plan = buildResiliencePlan(null);

      expect(plan.tone).toBe('baseline');
      expect(plan.steps).toHaveLength(3);
    });

    it('returns a support plan for very low moods', () => {
      const plan = buildResiliencePlan(createMoodLog(1));

      expect(plan.tone).toBe('support');
      expect(plan.supportNote).toContain('local emergency services');
    });

    it('returns a growth plan for higher moods', () => {
      const plan = buildResiliencePlan(createMoodLog(4));

      expect(plan.tone).toBe('growth');
      expect(plan.title).toBe('Bank This Good Day');
    });
  });
});
