import {
  buildAdaptiveReminderPlan,
  type MoodLog,
  type ResilienceCheckInEntry,
} from '@/src/domains/wellbeing';
import type { NotificationSettings } from '@/src/types/settings';

const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  moodCheckInReminders: true,
  journalingReminders: true,
  weeklyReports: true,
  communityActivity: true,
};

const createMood = (overrides: Partial<MoodLog> = {}): MoodLog => ({
  id: 'mood-1',
  userId: 'user-1',
  moodValue: 3,
  moodEmoji: '😐',
  moodLabel: 'Steady',
  timestamp: new Date('2026-02-28T12:00:00.000Z'),
  ...overrides,
});

const createCheckIn = (
  overrides: Partial<ResilienceCheckInEntry> = {},
): ResilienceCheckInEntry => ({
  id: 'check-in-1',
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

describe('adaptive reminder plan', () => {
  it('returns a calm disabled state when notifications are turned off', () => {
    const plan = buildAdaptiveReminderPlan({
      latestMood: null,
      latestCheckIn: null,
      settings: {
        ...defaultNotificationSettings,
        enabled: false,
      },
      traumaSafeMode: true,
    });

    expect(plan.primaryReminder.enabled).toBe(false);
    expect(plan.primaryReminder.title).toBe('Notifications are off');
    expect(plan.summary).toContain('disabled');
  });

  it('uses gentler copy on tender days when trauma-safe mode is enabled', () => {
    const plan = buildAdaptiveReminderPlan({
      latestMood: createMood({ moodValue: 1, moodEmoji: '😞', moodLabel: 'Low' }),
      latestCheckIn: createCheckIn({ safetyLevel: 2, stressLevel: 5, energyLevel: 2 }),
      settings: defaultNotificationSettings,
      traumaSafeMode: true,
    });

    expect(plan.primaryReminder.id).toBe('moodCheckIn');
    expect(plan.primaryReminder.title).toContain('gentle');
    expect(plan.reminders.find((reminder) => reminder.id === 'journal')?.title).toBe(
      'One sentence is enough',
    );
  });

  it('avoids streak-shame and keeps recovery-oriented copy on steadier days', () => {
    const plan = buildAdaptiveReminderPlan({
      latestMood: createMood({ moodValue: 4, moodEmoji: '🙂', moodLabel: 'Good' }),
      latestCheckIn: createCheckIn({ energyLevel: 4, safetyLevel: 4, bodyTension: 2 }),
      settings: defaultNotificationSettings,
      traumaSafeMode: false,
    });

    expect(plan.primaryReminder.title).not.toContain('streak');
    expect(plan.primaryReminder.body).toContain('stress');
    expect(plan.reminders).toHaveLength(3);
  });

  it('reinforces the most helpful intervention when feedback is available', () => {
    const plan = buildAdaptiveReminderPlan({
      latestMood: createMood({ moodValue: 3 }),
      latestCheckIn: createCheckIn({ energyLevel: 3, safetyLevel: 3, bodyTension: 2 }),
      settings: defaultNotificationSettings,
      traumaSafeMode: false,
      mostHelpfulStepLabel: 'Take a short grounding reset',
      strongestHelpfulnessLabel: 'Helped a lot',
    });

    expect(plan.summary).toContain('Take a short grounding reset');
    expect(plan.primaryReminder.body).toContain('Take a short grounding reset');
    expect(plan.reminders.find((reminder) => reminder.id === 'weeklyReport')?.body).toContain(
      'helped a lot',
    );
  });
});
