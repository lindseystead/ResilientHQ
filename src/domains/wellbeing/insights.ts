/**
 * Wellbeing Insights Domain
 *
 * Turns recent resilience check-ins into a concise weekly pattern summary that
 * can guide users toward the next best support action.
 */

import type { ResilienceActionType } from './checkIn';
import type { ResilienceCheckInEntry } from './checkIns';

export type ResilienceInsightsTrend = 'improving' | 'steady' | 'needsSupport';

export interface ResilienceInsightMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  trend: ResilienceInsightsTrend;
}

export interface ResilienceInsightsSummary {
  title: string;
  summary: string;
  trend: ResilienceInsightsTrend;
  averageStability: number;
  strongestArea: string;
  growthArea: string;
  primaryActionType: ResilienceActionType;
  primaryActionLabel: string;
  metrics: ResilienceInsightMetric[];
}

interface AreaDefinition {
  id: string;
  label: string;
  detail: string;
  getScore: (entries: ResilienceCheckInEntry[]) => number;
}

const DEFAULT_INSIGHTS: ResilienceInsightsSummary = {
  title: 'Weekly resilience patterns',
  summary:
    'Complete a few daily check-ins and this section will start showing what helps you stay steady.',
  trend: 'steady',
  averageStability: 0,
  strongestArea: 'Building your rhythm',
  growthArea: 'Daily consistency',
  primaryActionType: 'logMood',
  primaryActionLabel: 'Complete today’s check-in',
  metrics: [
    {
      id: 'rest',
      label: 'Recovery foundation',
      value: 'Start today',
      detail: 'A few days of check-ins will reveal how sleep and energy shift your baseline.',
      trend: 'steady',
    },
    {
      id: 'regulation',
      label: 'Nervous system load',
      value: 'Start today',
      detail: 'Stress and body tension trends will show where regulation support matters most.',
      trend: 'steady',
    },
    {
      id: 'support',
      label: 'Safety and support',
      value: 'Start today',
      detail: 'Connection and safety patterns help the app suggest gentler next steps.',
      trend: 'steady',
    },
  ],
};

const clampScore = (value: number): number => Math.max(1, Math.min(5, value));

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
};

const getEntryStabilityScore = (entry: ResilienceCheckInEntry): number =>
  average([
    entry.moodValue,
    entry.sleepQuality,
    entry.energyLevel,
    6 - entry.stressLevel,
    6 - entry.bodyTension,
    entry.connectionLevel,
    entry.safetyLevel,
  ]);

const AREA_DEFINITIONS: AreaDefinition[] = [
  {
    id: 'rest',
    label: 'Recovery foundation',
    detail: 'Sleep and usable energy are shaping how much capacity you have right now.',
    getScore: (entries) =>
      average(entries.map((entry) => average([entry.sleepQuality, entry.energyLevel]))),
  },
  {
    id: 'regulation',
    label: 'Nervous system load',
    detail:
      'Stress, tension, and mood show how much regulation support your system may need this week.',
    getScore: (entries) =>
      average(
        entries.map((entry) =>
          average([entry.moodValue, 6 - entry.stressLevel, 6 - entry.bodyTension]),
        ),
      ),
  },
  {
    id: 'support',
    label: 'Safety and support',
    detail: 'Connection and felt safety are strong signals for how much steadiness you can borrow.',
    getScore: (entries) =>
      average(entries.map((entry) => average([entry.connectionLevel, entry.safetyLevel]))),
  },
];

const getTrendFromDelta = (delta: number, currentAverage: number): ResilienceInsightsTrend => {
  if (delta >= 0.35) {
    return 'improving';
  }

  if (delta <= -0.35 || currentAverage <= 2.6) {
    return 'needsSupport';
  }

  return 'steady';
};

const getTrendSummary = (trend: ResilienceInsightsTrend): string => {
  switch (trend) {
    case 'improving':
      return 'Your recent check-ins show more steadiness than earlier in the week. Keep the structure that is helping.';
    case 'needsSupport':
      return 'Your recent check-ins suggest more strain right now. A smaller plan and quicker regulation will help.';
    case 'steady':
    default:
      return 'Your recent check-ins are relatively steady. Small repeatable support is the right move.';
  }
};

const getPrimaryActionForArea = (
  areaId: string,
): Pick<ResilienceInsightsSummary, 'primaryActionType' | 'primaryActionLabel'> => {
  switch (areaId) {
    case 'rest':
      return {
        primaryActionType: 'advice',
        primaryActionLabel: 'Build a lighter recovery plan',
      };
    case 'support':
      return {
        primaryActionType: 'journal',
        primaryActionLabel: 'Name what would feel safer today',
      };
    case 'regulation':
    default:
      return {
        primaryActionType: 'chat',
        primaryActionLabel: 'Start guided grounding support',
      };
  }
};

export const buildResilienceInsights = (
  entries: ResilienceCheckInEntry[],
): ResilienceInsightsSummary => {
  if (entries.length === 0) {
    return DEFAULT_INSIGHTS;
  }

  const currentWindow = entries.slice(0, 3);
  const priorWindow = entries.slice(3, 7);
  const currentAverage = average(currentWindow.map(getEntryStabilityScore));
  const priorAverage =
    priorWindow.length > 0 ? average(priorWindow.map(getEntryStabilityScore)) : currentAverage;
  const trend = getTrendFromDelta(currentAverage - priorAverage, currentAverage);

  const scoredAreas = AREA_DEFINITIONS.map((area) => ({
    ...area,
    score: clampScore(area.getScore(entries)),
  })).sort((left, right) => right.score - left.score);

  const strongestArea = scoredAreas[0];
  const growthArea = scoredAreas[scoredAreas.length - 1];
  const primaryAction = getPrimaryActionForArea(growthArea.id);

  return {
    title: 'Weekly resilience patterns',
    summary: getTrendSummary(trend),
    trend,
    averageStability: Math.round((currentAverage / 5) * 100),
    strongestArea: strongestArea.label,
    growthArea: growthArea.label,
    primaryActionType: primaryAction.primaryActionType,
    primaryActionLabel: primaryAction.primaryActionLabel,
    metrics: scoredAreas.map((area) => ({
      id: area.id,
      label: area.label,
      value: `${area.score.toFixed(1)}/5`,
      detail: area.detail,
      trend,
    })),
  };
};
