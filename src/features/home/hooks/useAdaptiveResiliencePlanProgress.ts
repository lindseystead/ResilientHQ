/**
 * useAdaptiveResiliencePlanProgress Hook
 *
 * Loads and updates weekly completion state for the adaptive resilience plan.
 */

import {
  createAdaptiveResiliencePlanSignature,
  getAdaptiveResiliencePlanHighlight,
  getAdaptiveResiliencePlanProgress,
  getAdaptiveResiliencePlanWeekKey,
  rateAdaptiveResiliencePlanStep,
  resetAdaptiveResiliencePlanProgress,
  toggleAdaptiveResiliencePlanStep,
  type AdaptiveResiliencePlan,
  type AdaptiveResilienceStepHelpfulness,
} from '@/src/domains/wellbeing';
import { useAuth, useErrorHandler } from '@/src/shared/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UseAdaptiveResiliencePlanProgressReturn {
  completedStepIndexes: number[];
  helpfulnessByStep: Record<string, AdaptiveResilienceStepHelpfulness>;
  completedCount: number;
  completionPercent: number;
  isLoading: boolean;
  weekKey: string;
  mostHelpfulStepIndex: number | null;
  mostHelpfulStepLabel: string | null;
  strongestHelpfulnessLabel: string | null;
  toggleStep: (index: number) => Promise<boolean>;
  rateStep: (index: number, helpfulness: AdaptiveResilienceStepHelpfulness) => Promise<boolean>;
  reset: () => Promise<boolean>;
}

export const useAdaptiveResiliencePlanProgress = (
  plan: AdaptiveResiliencePlan,
): UseAdaptiveResiliencePlanProgressReturn => {
  const { user } = useAuth();
  const handleError = useErrorHandler();
  const [completedStepIndexes, setCompletedStepIndexes] = useState<number[]>([]);
  const [helpfulnessByStep, setHelpfulnessByStep] = useState<
    Record<string, AdaptiveResilienceStepHelpfulness>
  >({});
  const [weekKey, setWeekKey] = useState<string>(() => getAdaptiveResiliencePlanWeekKey());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const planSignature = useMemo(() => createAdaptiveResiliencePlanSignature(plan), [plan]);
  const totalSteps = plan.steps.length;

  const loadProgress = useCallback(async (): Promise<void> => {
    if (!user) {
      setCompletedStepIndexes([]);
      setHelpfulnessByStep({});
      setWeekKey(getAdaptiveResiliencePlanWeekKey());
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const progress = await getAdaptiveResiliencePlanProgress(user.uid, planSignature);
      setCompletedStepIndexes(progress.completedStepIndexes);
      setHelpfulnessByStep(progress.helpfulnessByStep);
      setWeekKey(progress.weekKey);
    } catch (error) {
      handleError(error, {
        context: 'Loading resilience plan progress',
        showAlert: false,
      });
      setCompletedStepIndexes([]);
      setHelpfulnessByStep({});
      setWeekKey(getAdaptiveResiliencePlanWeekKey());
    } finally {
      setIsLoading(false);
    }
  }, [handleError, planSignature, user]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const toggleStep = useCallback(
    async (index: number): Promise<boolean> => {
      if (!user) {
        return false;
      }

      try {
        const progress = await toggleAdaptiveResiliencePlanStep(user.uid, planSignature, index);
        setCompletedStepIndexes(progress.completedStepIndexes);
        setHelpfulnessByStep(progress.helpfulnessByStep);
        setWeekKey(progress.weekKey);
        return true;
      } catch (error) {
        handleError(error, {
          context: 'Updating resilience plan progress',
          showAlert: false,
        });
        return false;
      }
    },
    [handleError, planSignature, user],
  );

  const rateStep = useCallback(
    async (index: number, helpfulness: AdaptiveResilienceStepHelpfulness): Promise<boolean> => {
      if (!user) {
        return false;
      }

      try {
        const progress = await rateAdaptiveResiliencePlanStep(
          user.uid,
          planSignature,
          index,
          helpfulness,
        );
        setCompletedStepIndexes(progress.completedStepIndexes);
        setHelpfulnessByStep(progress.helpfulnessByStep);
        setWeekKey(progress.weekKey);
        return true;
      } catch (error) {
        handleError(error, {
          context: 'Saving resilience step feedback',
          showAlert: false,
        });
        return false;
      }
    },
    [handleError, planSignature, user],
  );

  const reset = useCallback(async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const progress = await resetAdaptiveResiliencePlanProgress(user.uid, planSignature);
      setCompletedStepIndexes(progress.completedStepIndexes);
      setHelpfulnessByStep(progress.helpfulnessByStep);
      setWeekKey(progress.weekKey);
      return true;
    } catch (error) {
      handleError(error, {
        context: 'Resetting resilience plan progress',
        showAlert: false,
      });
      return false;
    }
  }, [handleError, planSignature, user]);

  const completedCount = completedStepIndexes.length;
  const completionPercent =
    totalSteps === 0 ? 0 : Math.round((completedCount / Math.max(totalSteps, 1)) * 100);
  const highlight = useMemo(
    () => getAdaptiveResiliencePlanHighlight(plan, helpfulnessByStep),
    [helpfulnessByStep, plan],
  );

  return {
    completedStepIndexes,
    helpfulnessByStep,
    completedCount,
    completionPercent,
    isLoading,
    weekKey,
    mostHelpfulStepIndex: highlight?.stepIndex ?? null,
    mostHelpfulStepLabel: highlight?.stepLabel ?? null,
    strongestHelpfulnessLabel: highlight?.helpfulnessLabel ?? null,
    toggleStep,
    rateStep,
    reset,
  };
};
