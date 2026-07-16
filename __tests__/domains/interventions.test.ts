/**
 * Wellbeing intervention outcome tests
 */

import {
  buildTopInterventionOutcome,
  createInterventionSignalSnapshot,
  type InterventionEvent,
  type ResilienceCheckInEntry,
} from '@/src/domains/wellbeing';

const createCheckIn = (
  createdAt: string,
  overrides: Partial<ResilienceCheckInEntry> = {},
): ResilienceCheckInEntry => ({
  id: `check-in-${createdAt}`,
  userId: 'user-1',
  moodValue: 3,
  sleepQuality: 3,
  energyLevel: 3,
  stressLevel: 3,
  bodyTension: 3,
  connectionLevel: 3,
  safetyLevel: 3,
  reflection: '',
  createdAt: new Date(createdAt),
  ...overrides,
});

describe('wellbeing intervention outcomes', () => {
  it('creates a signal snapshot from the latest structured check-in', () => {
    const snapshot = createInterventionSignalSnapshot(
      createCheckIn('2026-03-01T09:00:00.000Z', {
        stressLevel: 5,
        safetyLevel: 2,
        energyLevel: 1,
        bodyTension: 4,
      }),
    );

    expect(snapshot).toEqual({
      stressLevel: 5,
      safetyLevel: 2,
      energyLevel: 1,
      bodyTension: 4,
    });
  });

  it('picks the intervention with the strongest positive next-check-in change', () => {
    const events: InterventionEvent[] = [
      {
        id: 'event-2',
        type: 'journal',
        source: 'journal',
        label: 'Write a brief journal reflection',
        preSignals: {
          stressLevel: 4,
          safetyLevel: 3,
          energyLevel: 2,
          bodyTension: 4,
        },
        loggedAt: '2026-03-01T11:00:00.000Z',
      },
      {
        id: 'event-3',
        type: 'breathing',
        source: 'chat',
        label: 'Start guided breathing reset',
        preSignals: {
          stressLevel: 4,
          safetyLevel: 3,
          energyLevel: 3,
          bodyTension: 4,
        },
        loggedAt: '2026-03-01T13:00:00.000Z',
      },
      {
        id: 'event-1',
        type: 'breathing',
        source: 'chat',
        label: 'Start guided breathing reset',
        preSignals: {
          stressLevel: 5,
          safetyLevel: 2,
          energyLevel: 2,
          bodyTension: 5,
        },
        loggedAt: '2026-03-01T09:00:00.000Z',
      },
    ];

    const recentCheckIns: ResilienceCheckInEntry[] = [
      createCheckIn('2026-03-01T14:00:00.000Z', {
        stressLevel: 3,
        safetyLevel: 4,
        energyLevel: 4,
        bodyTension: 3,
      }),
      createCheckIn('2026-03-01T12:00:00.000Z', {
        stressLevel: 4,
        safetyLevel: 3,
        energyLevel: 2,
        bodyTension: 4,
      }),
      createCheckIn('2026-03-01T10:00:00.000Z', {
        stressLevel: 3,
        safetyLevel: 4,
        energyLevel: 4,
        bodyTension: 3,
      }),
    ];

    const outcome = buildTopInterventionOutcome(events, recentCheckIns);

    expect(outcome).toMatchObject({
      label: 'Start guided breathing reset',
      averageScore: 6,
      eventCount: 2,
    });
    expect(outcome?.summary).toContain('strongest next check-in improvement');
  });
});
