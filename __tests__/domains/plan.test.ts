/**
 * Adaptive resilience plan domain tests
 */

import {
  buildAdaptiveResiliencePlan,
  getAdaptiveResiliencePlanStepOrder,
  personalizeAdaptiveResiliencePlan,
  type ResilienceCheckInEntry,
} from '@/src/domains/wellbeing';
import type { MoodLog } from '@/src/domains/wellbeing';

const createMood = (moodValue: number): MoodLog => ({
  id: `mood-${moodValue}`,
  userId: 'user-1',
  moodValue,
  moodEmoji: '🙂',
  moodLabel: 'Test',
  timestamp: new Date('2026-02-28T10:00:00.000Z'),
});

const createEntry = (overrides: Partial<ResilienceCheckInEntry> = {}): ResilienceCheckInEntry => ({
  id: 'check-in',
  userId: 'user-1',
  moodValue: 3,
  sleepQuality: 3,
  energyLevel: 3,
  stressLevel: 3,
  bodyTension: 3,
  connectionLevel: 3,
  safetyLevel: 3,
  reflection: '',
  createdAt: new Date('2026-02-28T12:00:00.000Z'),
  ...overrides,
});

describe('adaptive resilience plan', () => {
  it('returns a starter plan when there is no check-in history yet', () => {
    const plan = buildAdaptiveResiliencePlan({
      latestMood: null,
      recentEntries: [],
      hasCompletedCheckInToday: false,
    });

    expect(plan.tone).toBe('baseline');
    expect(plan.primaryActionType).toBe('logMood');
    expect(plan.steps).toHaveLength(3);
  });

  it('creates a recovery-first plan when recent check-ins show elevated strain', () => {
    const entries = [
      createEntry({
        moodValue: 2,
        sleepQuality: 2,
        energyLevel: 2,
        stressLevel: 5,
        bodyTension: 4,
        connectionLevel: 2,
        safetyLevel: 2,
      }),
      createEntry({
        id: 'check-in-2',
        moodValue: 2,
        sleepQuality: 2,
        energyLevel: 1,
        stressLevel: 5,
        bodyTension: 5,
        connectionLevel: 2,
        safetyLevel: 2,
      }),
    ];

    const plan = buildAdaptiveResiliencePlan({
      latestMood: createMood(2),
      latestCheckIn: entries[0],
      recentEntries: entries,
      hasCompletedCheckInToday: true,
    });

    expect(plan.tone).toBe('support');
    expect(plan.primaryActionType).toBe('chat');
    expect(plan.whatToAvoid).toContain('problem-solving');
  });

  it('creates a capacity-building plan when recent entries are strong and steady', () => {
    const entries = [
      createEntry({
        moodValue: 5,
        sleepQuality: 5,
        energyLevel: 5,
        stressLevel: 2,
        bodyTension: 2,
        connectionLevel: 4,
        safetyLevel: 4,
      }),
      createEntry({
        id: 'check-in-2',
        moodValue: 4,
        sleepQuality: 5,
        energyLevel: 4,
        stressLevel: 2,
        bodyTension: 2,
        connectionLevel: 4,
        safetyLevel: 4,
      }),
      createEntry({
        id: 'check-in-3',
        moodValue: 4,
        sleepQuality: 4,
        energyLevel: 4,
        stressLevel: 2,
        bodyTension: 2,
        connectionLevel: 4,
        safetyLevel: 5,
      }),
    ];

    const plan = buildAdaptiveResiliencePlan({
      latestMood: createMood(4),
      latestCheckIn: entries[0],
      recentEntries: entries,
      hasCompletedCheckInToday: true,
    });

    expect(plan.tone).toBe('growth');
    expect(plan.primaryActionType).toBe('chat');
    expect(plan.chatPrompts[0]).toContain('protect');
  });

  it('prioritizes the most helpful step without changing the plan structure', () => {
    const plan = buildAdaptiveResiliencePlan({
      latestMood: null,
      recentEntries: [],
      hasCompletedCheckInToday: false,
    });

    const personalizedPlan = personalizeAdaptiveResiliencePlan(plan, {
      stepIndex: 1,
      stepLabel: plan.steps[1],
      helpfulnessLabel: 'Helped a lot',
    });

    expect(personalizedPlan.steps).toEqual(plan.steps);
    expect(personalizedPlan.focus).toContain(plan.steps[1]);
    expect(personalizedPlan.chatPrompts[0]).toContain(plan.steps[1]);
    expect(personalizedPlan.whatHelpedLately).toContain('Helped a lot');
  });

  it('reorders the displayed steps without changing the underlying step list', () => {
    const plan = buildAdaptiveResiliencePlan({
      latestMood: null,
      recentEntries: [],
      hasCompletedCheckInToday: false,
    });
    const originalSteps = [...plan.steps];

    const stepOrder = getAdaptiveResiliencePlanStepOrder(plan, {
      stepIndex: 2,
      stepLabel: plan.steps[2],
      helpfulnessLabel: 'Showed the strongest next check-in improvement',
    });

    expect(stepOrder).toEqual([2, 0, 1]);
    expect(plan.steps).toEqual(originalSteps);
  });
});
