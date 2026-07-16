import { buildResilienceInsights, type ResilienceCheckInEntry } from '@/src/domains/wellbeing';

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

describe('resilience insights', () => {
  it('returns a starter state when there is no check-in history yet', () => {
    const insights = buildResilienceInsights([]);

    expect(insights.primaryActionType).toBe('logMood');
    expect(insights.averageStability).toBe(0);
    expect(insights.metrics).toHaveLength(3);
  });

  it('routes toward regulation support when recent entries are trending down', () => {
    const entries = [
      createEntry({
        moodValue: 2,
        sleepQuality: 2,
        energyLevel: 2,
        stressLevel: 5,
        bodyTension: 5,
        connectionLevel: 2,
        safetyLevel: 2,
      }),
      createEntry({
        id: 'recent-2',
        moodValue: 2,
        sleepQuality: 2,
        energyLevel: 1,
        stressLevel: 5,
        bodyTension: 5,
        connectionLevel: 2,
        safetyLevel: 2,
      }),
      createEntry({
        id: 'recent-3',
        moodValue: 2,
        sleepQuality: 2,
        energyLevel: 2,
        stressLevel: 4,
        bodyTension: 5,
        connectionLevel: 2,
        safetyLevel: 2,
      }),
      createEntry({
        id: 'older-1',
        moodValue: 5,
        sleepQuality: 5,
        energyLevel: 5,
        stressLevel: 1,
        bodyTension: 1,
        connectionLevel: 5,
        safetyLevel: 5,
      }),
      createEntry({
        id: 'older-2',
        moodValue: 4,
        sleepQuality: 4,
        energyLevel: 4,
        stressLevel: 2,
        bodyTension: 2,
        connectionLevel: 4,
        safetyLevel: 4,
      }),
    ];

    const insights = buildResilienceInsights(entries);

    expect(insights.trend).toBe('needsSupport');
    expect(insights.primaryActionType).toBe('chat');
    expect(insights.growthArea).toBe('Nervous system load');
  });

  it('recognizes stronger recovery patterns and suggests a lighter plan', () => {
    const entries = [
      createEntry({
        moodValue: 4,
        sleepQuality: 5,
        energyLevel: 5,
        stressLevel: 2,
        bodyTension: 2,
        connectionLevel: 4,
        safetyLevel: 4,
      }),
      createEntry({
        id: 'recent-2',
        moodValue: 4,
        sleepQuality: 5,
        energyLevel: 4,
        stressLevel: 2,
        bodyTension: 2,
        connectionLevel: 4,
        safetyLevel: 4,
      }),
      createEntry({
        id: 'older-1',
        moodValue: 3,
        sleepQuality: 2,
        energyLevel: 2,
        stressLevel: 3,
        bodyTension: 3,
        connectionLevel: 3,
        safetyLevel: 3,
      }),
      createEntry({
        id: 'older-2',
        moodValue: 3,
        sleepQuality: 2,
        energyLevel: 2,
        stressLevel: 4,
        bodyTension: 3,
        connectionLevel: 3,
        safetyLevel: 3,
      }),
    ];

    const insights = buildResilienceInsights(entries);

    expect(insights.trend).toBe('improving');
    expect(insights.growthArea).toBe('Recovery foundation');
    expect(insights.primaryActionType).toBe('advice');
  });
});
