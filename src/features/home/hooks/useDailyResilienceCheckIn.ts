/**
 * useDailyResilienceCheckIn Hook
 *
 * Loads the latest mood signal and derives a concise daily resilience check-in
 * for the home dashboard.
 */

import {
  buildDailyResilienceCheckIn,
  getLatestResilienceCheckIn,
  getUserMoodLogs,
  hasCompletedResilienceCheckInToday,
  type DailyResilienceCheckIn,
  type ResilienceCheckInEntry,
  type MoodLog,
} from '@/src/domains/wellbeing';
import { useAuth, useErrorHandler } from '@/src/shared/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UseDailyResilienceCheckInReturn {
  checkIn: DailyResilienceCheckIn;
  latestMood: MoodLog | null;
  latestCheckIn: ResilienceCheckInEntry | null;
  hasCompletedCheckInToday: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useDailyResilienceCheckIn = (
  moodLogsToday: number,
  journalEntriesToday: number,
): UseDailyResilienceCheckInReturn => {
  const { user } = useAuth();
  const handleError = useErrorHandler();
  const [latestMood, setLatestMood] = useState<MoodLog | null>(null);
  const [latestCheckIn, setLatestCheckIn] = useState<ResilienceCheckInEntry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadCheckInContext = useCallback(async (): Promise<void> => {
    if (!user) {
      setLatestMood(null);
      setLatestCheckIn(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [moodLogs, checkInEntry] = await Promise.all([
        getUserMoodLogs(user, 1),
        getLatestResilienceCheckIn(user),
      ]);
      setLatestMood(moodLogs[0] ?? null);
      setLatestCheckIn(checkInEntry);
    } catch (error) {
      handleError(error, { context: 'Loading daily resilience check-in', showAlert: false });
      setLatestMood(null);
      setLatestCheckIn(null);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, user]);

  useEffect(() => {
    void loadCheckInContext();
  }, [loadCheckInContext]);

  const hasCompletedCheckInToday = useMemo(
    () => hasCompletedResilienceCheckInToday(latestCheckIn),
    [latestCheckIn],
  );

  const checkIn = useMemo(
    () =>
      buildDailyResilienceCheckIn({
        latestMood,
        moodLogsToday,
        journalEntriesToday,
        hasCompletedCheckInToday,
      }),
    [hasCompletedCheckInToday, journalEntriesToday, latestMood, moodLogsToday],
  );

  return {
    checkIn,
    latestMood,
    latestCheckIn,
    hasCompletedCheckInToday,
    isLoading,
    refresh: loadCheckInContext,
  };
};
