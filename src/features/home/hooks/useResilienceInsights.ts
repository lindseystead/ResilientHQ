/**
 * useResilienceInsights Hook
 *
 * Loads recent structured check-ins and converts them into a concise weekly
 * pattern summary for the home dashboard.
 */

import {
  buildResilienceInsights,
  getRecentResilienceCheckIns,
  type ResilienceCheckInEntry,
  type ResilienceInsightsSummary,
} from '@/src/domains/wellbeing';
import { useAuth, useErrorHandler } from '@/src/shared/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UseResilienceInsightsReturn {
  insights: ResilienceInsightsSummary;
  entries: ResilienceCheckInEntry[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useResilienceInsights = (): UseResilienceInsightsReturn => {
  const { user } = useAuth();
  const handleError = useErrorHandler();
  const [entries, setEntries] = useState<ResilienceCheckInEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadInsights = useCallback(async (): Promise<void> => {
    if (!user) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const recentEntries = await getRecentResilienceCheckIns(user, 7);
      setEntries(recentEntries);
    } catch (error) {
      handleError(error, { context: 'Loading resilience insights', showAlert: false });
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, user]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  const insights = useMemo(() => buildResilienceInsights(entries), [entries]);

  return {
    insights,
    entries,
    isLoading,
    refresh: loadInsights,
  };
};
