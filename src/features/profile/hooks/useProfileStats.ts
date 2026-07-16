/**
 * useProfileStats Hook
 *
 * Centralized hook for managing profile statistics including
 * mood logs count, journal entries count, streak calculation,
 * and weekly progress.
 */

import { getChatHistory } from '@/src/domains/ai';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import {
  buildWeeklyMoodProgress,
  calculateActivityStreak,
  getUserJournalEntries,
  getUserMoodLogs,
} from '@/src/domains/wellbeing';
import { useAuth, useErrorHandler } from '@/src/shared/hooks';
import { logger } from '@/src/shared/utils/debug';
import { useCallback, useEffect, useState } from 'react';

export interface UseProfileStatsReturn {
  moodLogsCount: number;
  journalEntriesCount: number;
  streakDays: number;
  aiConversationsCount: number;
  weeklyProgress: number[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useProfileStats = (): UseProfileStatsReturn => {
  const { user } = useAuth();
  const handleError = useErrorHandler();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [moodLogsCount, setMoodLogsCount] = useState(0);
  const [journalEntriesCount, setJournalEntriesCount] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [aiConversationsCount, setAiConversationsCount] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState<number[]>([]);

  const loadStats = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [moodLogs, journalEntries, chatHistory] = await Promise.all([
        getUserMoodLogs(user, 100),
        getUserJournalEntries(user, 100),
        getChatHistory(user, 50),
      ]);

      setMoodLogsCount(moodLogs.length);
      setJournalEntriesCount(journalEntries.length);
      setAiConversationsCount(chatHistory.length);

      // Calculate streak (simplified)
      const moodDates = moodLogs.map((log) => normalizeTimestamp(log.timestamp));
      const streak = calculateActivityStreak(moodDates);
      setStreakDays(streak);
      setWeeklyProgress(buildWeeklyMoodProgress(moodLogs));
    } catch (error) {
      logger.error('Error loading stats', error);
      handleError(error, { context: 'Loading profile stats', showAlert: false });
    } finally {
      setIsLoading(false);
    }
  }, [user, handleError]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    moodLogsCount,
    journalEntriesCount,
    streakDays,
    aiConversationsCount,
    weeklyProgress,
    isLoading,
    refresh: loadStats,
  };
};
