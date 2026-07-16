/**
 * useAdaptiveReminderPlan Hook
 *
 * Loads the latest wellbeing signals so Settings can preview reminder language
 * that matches the user's recent state.
 */

import {
  buildAdaptiveReminderPlan,
  buildAdaptiveResiliencePlan,
  getAdaptiveResiliencePlanFeedbackForUser,
  getLatestResilienceCheckIn,
  getRecentResilienceCheckIns,
  getTopInterventionOutcomeForUser,
  getUserMoodLogs,
  hasCompletedResilienceCheckInToday,
  type AdaptiveReminderPlan,
  type AdaptiveResiliencePlanFeedback,
  type InterventionOutcomeInsight,
  type MoodLog,
  type ResilienceCheckInEntry,
} from '@/src/domains/wellbeing';
import { useTraumaSafeMode } from '@/src/providers/TraumaSafeModeProvider';
import { useAuth, useErrorHandler } from '@/src/shared/hooks';
import type { NotificationSettings } from '@/src/types/settings';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UseAdaptiveReminderPlanReturn {
  plan: AdaptiveReminderPlan;
  latestMood: MoodLog | null;
  latestCheckIn: ResilienceCheckInEntry | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const fallbackNotifications: NotificationSettings = {
  enabled: false,
  moodCheckInReminders: false,
  journalingReminders: false,
  weeklyReports: false,
  communityActivity: false,
};

export const useAdaptiveReminderPlan = (
  notificationSettings: NotificationSettings | null,
): UseAdaptiveReminderPlanReturn => {
  const { user } = useAuth();
  const { traumaSafeMode } = useTraumaSafeMode();
  const handleError = useErrorHandler();
  const [latestMood, setLatestMood] = useState<MoodLog | null>(null);
  const [latestCheckIn, setLatestCheckIn] = useState<ResilienceCheckInEntry | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<ResilienceCheckInEntry[]>([]);
  const [planFeedback, setPlanFeedback] = useState<AdaptiveResiliencePlanFeedback | null>(null);
  const [topInterventionOutcome, setTopInterventionOutcome] =
    useState<InterventionOutcomeInsight | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadReminderContext = useCallback(async (): Promise<void> => {
    if (!user) {
      setLatestMood(null);
      setLatestCheckIn(null);
      setRecentCheckIns([]);
      setPlanFeedback(null);
      setTopInterventionOutcome(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [moods, checkIn, checkIns] = await Promise.all([
        getUserMoodLogs(user, 1),
        getLatestResilienceCheckIn(user),
        getRecentResilienceCheckIns(user, 7),
      ]);

      setLatestMood(moods[0] ?? null);
      setLatestCheckIn(checkIn);
      setRecentCheckIns(checkIns);
    } catch (error) {
      handleError(error, { context: 'Loading reminder preview', showAlert: false });
      setLatestMood(null);
      setLatestCheckIn(null);
      setRecentCheckIns([]);
      setPlanFeedback(null);
      setTopInterventionOutcome(null);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, user]);

  useEffect(() => {
    void loadReminderContext();
  }, [loadReminderContext]);

  const hasCompletedCheckInToday = useMemo(
    () => hasCompletedResilienceCheckInToday(latestCheckIn),
    [latestCheckIn],
  );
  const baseResiliencePlan = useMemo(
    () =>
      buildAdaptiveResiliencePlan({
        latestMood,
        latestCheckIn,
        recentEntries: recentCheckIns,
        hasCompletedCheckInToday,
      }),
    [hasCompletedCheckInToday, latestCheckIn, latestMood, recentCheckIns],
  );

  useEffect(() => {
    const loadPlanFeedback = async () => {
      if (!user) {
        setPlanFeedback(null);
        return;
      }

      try {
        const feedback = await getAdaptiveResiliencePlanFeedbackForUser(
          user.uid,
          baseResiliencePlan,
        );
        setPlanFeedback(feedback);
      } catch {
        setPlanFeedback(null);
      }
    };

    void loadPlanFeedback();
  }, [baseResiliencePlan, user]);
  useEffect(() => {
    const loadTopInterventionOutcome = async () => {
      if (!user) {
        setTopInterventionOutcome(null);
        return;
      }

      try {
        const outcome = await getTopInterventionOutcomeForUser(user.uid, recentCheckIns);
        setTopInterventionOutcome(outcome);
      } catch {
        setTopInterventionOutcome(null);
      }
    };

    void loadTopInterventionOutcome();
  }, [recentCheckIns, user]);

  const plan = useMemo(
    () =>
      buildAdaptiveReminderPlan({
        latestMood,
        latestCheckIn,
        settings: notificationSettings ?? fallbackNotifications,
        traumaSafeMode,
        mostHelpfulStepLabel: topInterventionOutcome?.label ?? planFeedback?.stepLabel ?? null,
        strongestHelpfulnessLabel:
          topInterventionOutcome?.summary ?? planFeedback?.helpfulnessLabel ?? null,
      }),
    [
      latestCheckIn,
      latestMood,
      notificationSettings,
      planFeedback,
      topInterventionOutcome,
      traumaSafeMode,
    ],
  );

  return {
    plan,
    latestMood,
    latestCheckIn,
    isLoading,
    refresh: loadReminderContext,
  };
};
