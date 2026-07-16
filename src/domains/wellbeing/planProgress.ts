/**
 * Adaptive Resilience Plan Progress
 *
 * Persists weekly plan completion so the 7-day plan is actionable instead of
 * purely informational. Progress resets when the week or the plan signature changes.
 */

import { UserPreferencesStorage } from '@/src/shared/utils/storage/userPreferences';
import type { AdaptiveResiliencePlan, AdaptiveResiliencePlanFeedback } from './plan';

export type AdaptiveResilienceStepHelpfulness = 1 | 2 | 3;

export interface AdaptiveResiliencePlanProgress {
  weekKey: string;
  planSignature: string;
  completedStepIndexes: number[];
  helpfulnessByStep: Record<string, AdaptiveResilienceStepHelpfulness>;
  updatedAt: string;
}

export interface AdaptiveResiliencePlanHighlight {
  stepIndex: number;
  stepLabel: string;
  helpfulness: AdaptiveResilienceStepHelpfulness;
  helpfulnessLabel: string;
}

const PLAN_PROGRESS_KEY_PREFIX = 'wellbeing.planProgress';

const normalizeStepIndexes = (indexes: number[]): number[] =>
  [...new Set(indexes.filter((value) => Number.isInteger(value) && value >= 0))].sort(
    (left, right) => left - right,
  );

const isValidHelpfulnessValue = (value: unknown): value is AdaptiveResilienceStepHelpfulness =>
  value === 1 || value === 2 || value === 3;

const normalizeHelpfulnessByStep = (
  helpfulnessByStep: unknown,
): Record<string, AdaptiveResilienceStepHelpfulness> => {
  if (!helpfulnessByStep || typeof helpfulnessByStep !== 'object') {
    return {};
  }

  return Object.entries(helpfulnessByStep as Record<string, unknown>).reduce<
    Record<string, AdaptiveResilienceStepHelpfulness>
  >((result, [key, value]) => {
    if (Number.isInteger(Number(key)) && Number(key) >= 0 && isValidHelpfulnessValue(value)) {
      result[key] = value;
    }

    return result;
  }, {});
};

export const getAdaptiveResiliencePlanWeekStart = (now: Date = new Date()): Date => {
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const day = weekStart.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  return weekStart;
};

export const getAdaptiveResiliencePlanWeekKey = (now: Date = new Date()): string => {
  const weekStart = getAdaptiveResiliencePlanWeekStart(now);

  return [
    weekStart.getFullYear(),
    `${weekStart.getMonth() + 1}`.padStart(2, '0'),
    `${weekStart.getDate()}`.padStart(2, '0'),
  ].join('-');
};

export const createAdaptiveResiliencePlanSignature = (plan: AdaptiveResiliencePlan): string =>
  `${plan.tone}:${plan.title}:${plan.steps.join('|')}`;

export const getAdaptiveResilienceStepHelpfulnessLabel = (
  helpfulness: AdaptiveResilienceStepHelpfulness,
): string => {
  switch (helpfulness) {
    case 3:
      return 'Helped a lot';
    case 2:
      return 'Helped some';
    case 1:
    default:
      return 'Helped a little';
  }
};

export const getAdaptiveResiliencePlanHighlight = (
  plan: AdaptiveResiliencePlan,
  helpfulnessByStep: Record<string, AdaptiveResilienceStepHelpfulness>,
): AdaptiveResiliencePlanHighlight | null => {
  const ratedSteps = Object.entries(helpfulnessByStep)
    .map(([key, value]) => ({
      stepIndex: Number(key),
      helpfulness: value,
    }))
    .filter(
      (entry) =>
        Number.isInteger(entry.stepIndex) &&
        entry.stepIndex >= 0 &&
        entry.stepIndex < plan.steps.length &&
        isValidHelpfulnessValue(entry.helpfulness),
    )
    .sort((left, right) => {
      if (right.helpfulness !== left.helpfulness) {
        return right.helpfulness - left.helpfulness;
      }

      return left.stepIndex - right.stepIndex;
    });

  const strongestStep = ratedSteps[0];

  if (!strongestStep) {
    return null;
  }

  return {
    stepIndex: strongestStep.stepIndex,
    stepLabel: plan.steps[strongestStep.stepIndex],
    helpfulness: strongestStep.helpfulness,
    helpfulnessLabel: getAdaptiveResilienceStepHelpfulnessLabel(strongestStep.helpfulness),
  };
};

export const getAdaptiveResiliencePlanFeedbackForUser = async (
  userId: string,
  plan: AdaptiveResiliencePlan,
  now: Date = new Date(),
): Promise<AdaptiveResiliencePlanFeedback | null> => {
  const planSignature = createAdaptiveResiliencePlanSignature(plan);
  const progress = await getAdaptiveResiliencePlanProgress(userId, planSignature, now);
  const highlight = getAdaptiveResiliencePlanHighlight(plan, progress.helpfulnessByStep);

  if (!highlight) {
    return null;
  }

  return {
    stepIndex: highlight.stepIndex,
    stepLabel: highlight.stepLabel,
    helpfulnessLabel: highlight.helpfulnessLabel,
  };
};

const getPreferenceKey = (userId: string): string => `${PLAN_PROGRESS_KEY_PREFIX}.${userId}`;

const createEmptyProgress = (
  weekKey: string,
  planSignature: string,
): AdaptiveResiliencePlanProgress => ({
  weekKey,
  planSignature,
  completedStepIndexes: [],
  helpfulnessByStep: {},
  updatedAt: new Date().toISOString(),
});

export const getAdaptiveResiliencePlanProgress = async (
  userId: string,
  planSignature: string,
  now: Date = new Date(),
): Promise<AdaptiveResiliencePlanProgress> => {
  const weekKey = getAdaptiveResiliencePlanWeekKey(now);
  const stored = await UserPreferencesStorage.getPreference<AdaptiveResiliencePlanProgress>(
    getPreferenceKey(userId),
  );

  if (
    !stored ||
    stored.weekKey !== weekKey ||
    stored.planSignature !== planSignature ||
    !Array.isArray(stored.completedStepIndexes)
  ) {
    return createEmptyProgress(weekKey, planSignature);
  }

  return {
    weekKey,
    planSignature,
    completedStepIndexes: normalizeStepIndexes(stored.completedStepIndexes),
    helpfulnessByStep: normalizeHelpfulnessByStep(stored.helpfulnessByStep),
    updatedAt: typeof stored.updatedAt === 'string' ? stored.updatedAt : new Date().toISOString(),
  };
};

const saveAdaptiveResiliencePlanProgress = async (
  userId: string,
  progress: AdaptiveResiliencePlanProgress,
): Promise<AdaptiveResiliencePlanProgress> => {
  const didSave = await UserPreferencesStorage.setPreference(getPreferenceKey(userId), progress);

  if (!didSave) {
    throw new Error('Failed to save resilience plan progress');
  }

  return progress;
};

export const toggleAdaptiveResiliencePlanStep = async (
  userId: string,
  planSignature: string,
  stepIndex: number,
  now: Date = new Date(),
): Promise<AdaptiveResiliencePlanProgress> => {
  if (!Number.isInteger(stepIndex) || stepIndex < 0) {
    throw new Error('Invalid step index');
  }

  const current = await getAdaptiveResiliencePlanProgress(userId, planSignature, now);
  const isCompleted = current.completedStepIndexes.includes(stepIndex);
  const nextHelpfulnessByStep = { ...current.helpfulnessByStep };
  const completedStepIndexes = isCompleted
    ? current.completedStepIndexes.filter((value) => value !== stepIndex)
    : normalizeStepIndexes([...current.completedStepIndexes, stepIndex]);

  if (isCompleted) {
    delete nextHelpfulnessByStep[String(stepIndex)];
  }

  return saveAdaptiveResiliencePlanProgress(userId, {
    ...current,
    completedStepIndexes,
    helpfulnessByStep: nextHelpfulnessByStep,
    updatedAt: new Date().toISOString(),
  });
};

export const rateAdaptiveResiliencePlanStep = async (
  userId: string,
  planSignature: string,
  stepIndex: number,
  helpfulness: AdaptiveResilienceStepHelpfulness,
  now: Date = new Date(),
): Promise<AdaptiveResiliencePlanProgress> => {
  if (!Number.isInteger(stepIndex) || stepIndex < 0) {
    throw new Error('Invalid step index');
  }

  if (!isValidHelpfulnessValue(helpfulness)) {
    throw new Error('Invalid helpfulness value');
  }

  const current = await getAdaptiveResiliencePlanProgress(userId, planSignature, now);
  const completedStepIndexes = current.completedStepIndexes.includes(stepIndex)
    ? current.completedStepIndexes
    : normalizeStepIndexes([...current.completedStepIndexes, stepIndex]);

  return saveAdaptiveResiliencePlanProgress(userId, {
    ...current,
    completedStepIndexes,
    helpfulnessByStep: {
      ...current.helpfulnessByStep,
      [String(stepIndex)]: helpfulness,
    },
    updatedAt: new Date().toISOString(),
  });
};

export const resetAdaptiveResiliencePlanProgress = async (
  userId: string,
  planSignature: string,
  now: Date = new Date(),
): Promise<AdaptiveResiliencePlanProgress> => {
  return saveAdaptiveResiliencePlanProgress(
    userId,
    createEmptyProgress(getAdaptiveResiliencePlanWeekKey(now), planSignature),
  );
};
