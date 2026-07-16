/**
 * useMoodLogs Hook
 *
 * Centralized hook for managing mood logs data including fetching,
 * date mapping, and average mood calculation.
 */

import { useAuth, useErrorHandler } from '@/src/shared/hooks';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { getUserMoodLogs, MoodLog } from '@/src/domains/wellbeing/moods';
import { format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';

export interface UseMoodLogsReturn {
  moodLogs: MoodLog[];
  moodLogMap: Record<string, number>;
  averageMood: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useMoodLogs = (limitCount: number = 100): UseMoodLogsReturn => {
  const { user } = useAuth();
  const handleError = useErrorHandler();
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [moodLogMap, setMoodLogMap] = useState<Record<string, number>>({});
  const [averageMood, setAverageMood] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMoodLogs = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const logs = await getUserMoodLogs(user, limitCount);
      setMoodLogs(logs);

      // Convert to date map for calendar
      const dateMap: Record<string, number> = {};
      logs.forEach((log) => {
        const timestampDate = normalizeTimestamp(log.timestamp);
        const date = format(timestampDate, 'yyyy-MM-dd');
        dateMap[date] = log.moodValue;
      });
      setMoodLogMap(dateMap);

      // Calculate average mood
      if (logs.length > 0) {
        const totalMood = logs.reduce((sum, log) => sum + log.moodValue, 0);
        const avg = totalMood / logs.length;
        setAverageMood(avg);
      } else {
        setAverageMood(0);
      }
    } catch (error) {
      handleError(error, { context: 'Fetching mood logs', showAlert: false });
    } finally {
      setIsLoading(false);
    }
  }, [user, handleError, limitCount]);

  useEffect(() => {
    fetchMoodLogs();
  }, [fetchMoodLogs]);

  return {
    moodLogs,
    moodLogMap,
    averageMood,
    isLoading,
    refresh: fetchMoodLogs,
  };
};
