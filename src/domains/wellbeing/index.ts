/**
 * Wellbeing Domain Facade
 *
 * Shared access point for mood and journal data that are used across
 * multiple features. Pure progress helpers live here so resilience metrics
 * stay consistent anywhere we surface them.
 */

import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import type { MoodLog } from './moods';

export type { JournalEntry } from './journal';
export type { MoodLog } from './moods';
export type { ResilienceCheckInDraft, ResilienceCheckInEntry } from './checkIns';

export {
  deleteJournalEntry,
  getUserJournalEntries,
  saveJournalEntry,
  updateJournalEntry,
} from './journal';

export { getUserMoodLogs, saveMoodLog } from './moods';
export {
  getLatestResilienceCheckIn,
  getRecentResilienceCheckIns,
  hasCompletedResilienceCheckInToday,
  saveResilienceCheckIn,
} from './checkIns';
export type {
  BuildDailyResilienceCheckInOptions,
  DailyResilienceCheckIn,
  ResilienceActionType,
  ResilienceCheckInSignal,
  ResilienceSignalStatus,
} from './checkIn';
export { buildDailyResilienceCheckIn } from './checkIn';
export type {
  ResilienceInsightMetric,
  ResilienceInsightsSummary,
  ResilienceInsightsTrend,
} from './insights';
export { buildResilienceInsights } from './insights';
export type {
  AdaptiveReminderPlan,
  BuildAdaptiveReminderPlanOptions,
  ReminderKind,
  ReminderPreview,
} from './reminders';
export { buildAdaptiveReminderPlan } from './reminders';
export type {
  AdaptiveResiliencePlan,
  AdaptiveResiliencePlanFeedback,
  BuildAdaptiveResiliencePlanOptions,
  ResiliencePlanTone,
} from './plan';
export {
  buildAdaptiveResiliencePlan,
  getAdaptiveResiliencePlanStepOrder,
  personalizeAdaptiveResiliencePlan,
} from './plan';
export type {
  AdaptiveResiliencePlanHighlight,
  AdaptiveResiliencePlanProgress,
  AdaptiveResilienceStepHelpfulness,
} from './planProgress';
export {
  createAdaptiveResiliencePlanSignature,
  getAdaptiveResiliencePlanFeedbackForUser,
  getAdaptiveResiliencePlanHighlight,
  getAdaptiveResiliencePlanProgress,
  getAdaptiveResiliencePlanWeekKey,
  getAdaptiveResiliencePlanWeekStart,
  getAdaptiveResilienceStepHelpfulnessLabel,
  rateAdaptiveResiliencePlanStep,
  resetAdaptiveResiliencePlanProgress,
  toggleAdaptiveResiliencePlanStep,
} from './planProgress';
export type {
  InterventionEvent,
  InterventionOutcomeInsight,
  InterventionSignalSnapshot,
  InterventionSource,
  InterventionType,
  LogInterventionEventInput,
} from './interventions';
export {
  buildTopInterventionOutcome,
  createInterventionSignalSnapshot,
  getInterventionEvents,
  getTopInterventionOutcomeForUser,
  logInterventionEvent,
} from './interventions';
export type {
  EncouragementItem,
  EnergyCheckItem,
  ResilienceContentDeck,
  ResiliencePlan,
  ResilienceResource,
  WellnessTip,
} from './resilience';
export { buildResiliencePlan, getResilienceContentDeck, shuffleAndTake } from './resilience';
export type { UseWellbeingAffirmationReturn } from './useAffirmation';
export { useWellbeingAffirmation } from './useAffirmation';

const toDayKey = (value: unknown): string => {
  const date = normalizeTimestamp(value);

  return [
    date.getFullYear(),
    `${date.getMonth() + 1}`.padStart(2, '0'),
    `${date.getDate()}`.padStart(2, '0'),
  ].join('-');
};

const parseDayKey = (dayKey: string): Date => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const calculateActivityStreak = (dates: Date[]): number => {
  if (dates.length === 0) {
    return 0;
  }

  const uniqueDays = [...new Set(dates.map((date) => toDayKey(date)))].sort().reverse();

  if (uniqueDays.length === 0) {
    return 0;
  }

  const today = toDayKey(new Date());
  const yesterday = toDayKey(Date.now() - 86400000);

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) {
    return 0;
  }

  let streak = 1;

  for (let index = 1; index < uniqueDays.length; index += 1) {
    const previousDay = parseDayKey(uniqueDays[index - 1]);
    const currentDay = parseDayKey(uniqueDays[index]);
    const differenceInDays = Math.round((previousDay.getTime() - currentDay.getTime()) / 86400000);

    if (differenceInDays !== 1) {
      break;
    }

    streak += 1;
  }

  return streak;
};

export const buildWeeklyMoodProgress = (moodLogs: MoodLog[], days: number = 7): number[] => {
  const now = new Date();
  const progress: number[] = [];

  for (let dayOffset = days - 1; dayOffset >= 0; dayOffset -= 1) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - dayOffset);
    const targetKey = toDayKey(targetDate);

    const logsForDay = moodLogs.filter((log) => toDayKey(log.timestamp) === targetKey);

    if (logsForDay.length === 0) {
      progress.push(0);
      continue;
    }

    const averageMood =
      logsForDay.reduce((total, log) => total + log.moodValue, 0) / logsForDay.length;

    progress.push(Math.round((averageMood / 5) * 100));
  }

  return progress;
};
