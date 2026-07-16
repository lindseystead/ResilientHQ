/**
 * useTodayCounts Hook
 *
 * Centralized hook for fetching today's mood logs and journal entries count.
 * Used by HomeScreen to display highlights.
 */

import { useErrorHandler } from '@/src/shared/hooks/useErrorHandler';
import { useAuth } from '@/src/providers/AuthProvider';
import {
  getTodayJournalEntriesCount,
  getTodayMoodLogsCount,
} from '@/src/shared/utils/dates/todayCounts';
import { useCallback, useEffect, useState } from 'react';

export interface UseTodayCountsReturn {
  moodLogsCount: number;
  journalEntriesCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useTodayCounts = (): UseTodayCountsReturn => {
  const { user } = useAuth();
  const handleError = useErrorHandler();
  const [moodLogsCount, setMoodLogsCount] = useState<number>(0);
  const [journalEntriesCount, setJournalEntriesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTodayCounts = useCallback(async (): Promise<void> => {
    if (!user) {
      setMoodLogsCount(0);
      setJournalEntriesCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [moodCount, journalCount] = await Promise.all([
        getTodayMoodLogsCount(user),
        getTodayJournalEntriesCount(user),
      ]);
      setMoodLogsCount(moodCount);
      setJournalEntriesCount(journalCount);
    } catch (error) {
      handleError(error, { context: 'Fetching today counts', showAlert: false });
      setMoodLogsCount(0);
      setJournalEntriesCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, user]);

  useEffect(() => {
    void fetchTodayCounts();
  }, [fetchTodayCounts]);

  return { moodLogsCount, journalEntriesCount, isLoading, refresh: fetchTodayCounts };
};
