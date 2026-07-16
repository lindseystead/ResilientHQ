/**
 * Adaptive Reminder Planner
 *
 * Builds trauma-informed reminder copy so notification delivery can stay gentle,
 * contextual, and free of streak-shame language.
 */

import type { NotificationSettings } from '@/src/types/settings';
import type { ResilienceCheckInEntry } from './checkIns';
import type { MoodLog } from './moods';

export type ReminderKind = 'moodCheckIn' | 'journal' | 'weeklyReport';

export interface ReminderPreview {
  id: ReminderKind;
  label: string;
  enabled: boolean;
  title: string;
  body: string;
  deliveryWindow: string;
}

export interface AdaptiveReminderPlan {
  summary: string;
  primaryReminder: ReminderPreview;
  reminders: ReminderPreview[];
}

export interface BuildAdaptiveReminderPlanOptions {
  latestMood: MoodLog | null;
  latestCheckIn: ResilienceCheckInEntry | null;
  settings: NotificationSettings;
  traumaSafeMode: boolean;
  mostHelpfulStepLabel?: string | null;
  strongestHelpfulnessLabel?: string | null;
}

const DEFAULT_REMINDER: ReminderPreview = {
  id: 'moodCheckIn',
  label: 'Check-In Reminder',
  enabled: false,
  title: 'Notifications are off',
  body: 'You can turn reminders back on any time. When you do, they will stay gentle and optional.',
  deliveryWindow: 'No reminders scheduled',
};

const buildMoodReminder = (
  latestMood: MoodLog | null,
  latestCheckIn: ResilienceCheckInEntry | null,
  enabled: boolean,
  traumaSafeMode: boolean,
  mostHelpfulStepLabel: string | null,
): ReminderPreview => {
  const isTenderDay =
    (latestMood?.moodValue ?? 3) <= 2 ||
    (latestCheckIn ? latestCheckIn.safetyLevel <= 2 || latestCheckIn.stressLevel >= 4 : false);

  if (isTenderDay) {
    return {
      id: 'moodCheckIn',
      label: 'Check-In Reminder',
      enabled,
      title: traumaSafeMode
        ? 'A gentle check-in can wait for you'
        : 'Pause for one honest check-in',
      body: traumaSafeMode
        ? mostHelpfulStepLabel
          ? `When you have room later, start with what helped before: ${mostHelpfulStepLabel}. One honest signal is enough.`
          : 'When you have room later, name how your system feels. One honest signal is enough.'
        : mostHelpfulStepLabel
          ? `Later today, take ten quiet seconds to notice your mood, then start with: ${mostHelpfulStepLabel}.`
          : 'Later today, take ten quiet seconds to notice your mood before the day gets louder.',
      deliveryWindow: 'Late morning, after the first part of the day settles',
    };
  }

  if (latestCheckIn) {
    return {
      id: 'moodCheckIn',
      label: 'Check-In Reminder',
      enabled,
      title: traumaSafeMode ? 'Keep your rhythm steady' : 'Stay connected to your baseline',
      body: traumaSafeMode
        ? mostHelpfulStepLabel
          ? `A short check-in later can help you notice strain before it builds. If you need support, start with ${mostHelpfulStepLabel}.`
          : 'A short check-in later can help you notice strain before it builds.'
        : mostHelpfulStepLabel
          ? `A quick mood check later can help you catch stress early. If strain is building, try ${mostHelpfulStepLabel}.`
          : 'A quick mood check later can help you catch stress early and keep your rhythm steady.',
      deliveryWindow: 'Midday, before energy starts to dip',
    };
  }

  return {
    id: 'moodCheckIn',
    label: 'Check-In Reminder',
    enabled,
    title: traumaSafeMode
      ? 'Start small, when you are ready'
      : 'A quick check-in helps the rest of the app support you',
    body: traumaSafeMode
      ? mostHelpfulStepLabel
        ? `There is no streak to protect. When you have a moment, one small check-in is enough. You can start with ${mostHelpfulStepLabel}.`
        : 'There is no streak to protect. When you have a moment, one small check-in is enough.'
      : mostHelpfulStepLabel
        ? `A single mood signal is enough to personalize your day. When you need support, start with ${mostHelpfulStepLabel}.`
        : 'A single mood signal is enough to personalize your day and shape the right next step.',
    deliveryWindow: 'Late morning, when the day is easier to read',
  };
};

const buildJournalReminder = (
  latestMood: MoodLog | null,
  latestCheckIn: ResilienceCheckInEntry | null,
  enabled: boolean,
  traumaSafeMode: boolean,
  mostHelpfulStepLabel: string | null,
): ReminderPreview => {
  const isTenderDay =
    (latestMood?.moodValue ?? 3) <= 2 ||
    (latestCheckIn ? latestCheckIn.energyLevel <= 2 || latestCheckIn.bodyTension >= 4 : false);

  if (isTenderDay) {
    return {
      id: 'journal',
      label: 'Journal Reminder',
      enabled,
      title: 'One sentence is enough',
      body: traumaSafeMode
        ? mostHelpfulStepLabel
          ? `If writing feels possible later, capture one true sentence after trying ${mostHelpfulStepLabel}. You do not need a full entry.`
          : 'If writing feels possible later, capture one true sentence. You do not need a full entry.'
        : mostHelpfulStepLabel
          ? `A short reflection later can lower pressure. Start with ${mostHelpfulStepLabel}, then write one sentence.`
          : 'A short reflection later can lower pressure. One sentence still counts as care.',
      deliveryWindow: 'Early evening, when there is more room to slow down',
    };
  }

  return {
    id: 'journal',
    label: 'Journal Reminder',
    enabled,
    title: traumaSafeMode ? 'Save what helped today' : 'Capture what is working',
    body: traumaSafeMode
      ? mostHelpfulStepLabel
        ? `A brief note later can help you remember what made today feel steadier, especially ${mostHelpfulStepLabel}.`
        : 'A brief note later can help you remember what made today feel steadier.'
      : mostHelpfulStepLabel
        ? `A quick reflection later helps you reuse what worked. Start with ${mostHelpfulStepLabel}.`
        : 'A quick reflection later helps you reuse what worked and spot patterns that matter.',
    deliveryWindow: 'Early evening, before the day closes out',
  };
};

const buildWeeklyReminder = (
  enabled: boolean,
  traumaSafeMode: boolean,
  mostHelpfulStepLabel: string | null,
  strongestHelpfulnessLabel: string | null,
): ReminderPreview => ({
  id: 'weeklyReport',
  label: 'Weekly Reflection',
  enabled,
  title: traumaSafeMode
    ? 'Your weekly reflection is ready'
    : 'Your weekly resilience summary is ready',
  body: traumaSafeMode
    ? mostHelpfulStepLabel && strongestHelpfulnessLabel
      ? `It will highlight patterns gently, including what helped most: ${strongestHelpfulnessLabel} on ${mostHelpfulStepLabel}.`
      : 'It will highlight patterns gently, without judgment, and help you choose one useful next step.'
    : mostHelpfulStepLabel && strongestHelpfulnessLabel
      ? `It will highlight what supported you, including that ${mostHelpfulStepLabel} ${strongestHelpfulnessLabel.toLowerCase()}, and one next move for the week ahead.`
      : 'It will highlight what supported you, where strain showed up, and one next move for the week ahead.',
  deliveryWindow: 'Sunday evening, before the next week begins',
});

const pickPrimaryReminder = (reminders: ReminderPreview[]): ReminderPreview => {
  const enabledReminder = reminders.find((reminder) => reminder.enabled);
  return enabledReminder ?? DEFAULT_REMINDER;
};

export const buildAdaptiveReminderPlan = ({
  latestMood,
  latestCheckIn,
  settings,
  traumaSafeMode,
  mostHelpfulStepLabel = null,
  strongestHelpfulnessLabel = null,
}: BuildAdaptiveReminderPlanOptions): AdaptiveReminderPlan => {
  const reminders: ReminderPreview[] = [
    buildMoodReminder(
      latestMood,
      latestCheckIn,
      settings.enabled && settings.moodCheckInReminders,
      traumaSafeMode,
      mostHelpfulStepLabel,
    ),
    buildJournalReminder(
      latestMood,
      latestCheckIn,
      settings.enabled && settings.journalingReminders,
      traumaSafeMode,
      mostHelpfulStepLabel,
    ),
    buildWeeklyReminder(
      settings.enabled && settings.weeklyReports,
      traumaSafeMode,
      mostHelpfulStepLabel,
      strongestHelpfulnessLabel,
    ),
  ];

  const primaryReminder = settings.enabled ? pickPrimaryReminder(reminders) : DEFAULT_REMINDER;

  return {
    summary: settings.enabled
      ? traumaSafeMode
        ? mostHelpfulStepLabel
          ? `Reminders stay calm, optional, and can point you back to what helped most: ${mostHelpfulStepLabel}.`
          : 'Reminders stay calm, optional, and free of pressure.'
        : mostHelpfulStepLabel
          ? `Reminders are tuned to current stress, energy, and the support that has worked best: ${mostHelpfulStepLabel}.`
          : 'Reminders are tuned to current stress, energy, and recovery signals.'
      : 'Notifications are currently disabled.',
    primaryReminder,
    reminders,
  };
};
