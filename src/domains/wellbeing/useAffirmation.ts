/**
 * Wellbeing Affirmation Hook
 *
 * Shared affirmation logic with curated local content.
 *
 * This intentionally avoids direct third-party API calls from the client.
 */

import { TEXT } from '@/src/config/text';
import { useCallback, useEffect, useState } from 'react';

export interface UseWellbeingAffirmationReturn {
  affirmation: string;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const getLocalAffirmation = (exclude?: string): string => {
  const affirmations = TEXT.affirmations;
  if (affirmations.length === 0) {
    return 'I can take one grounded step right now.';
  }

  if (affirmations.length === 1) {
    return affirmations[0];
  }

  const next = affirmations[Math.floor(Math.random() * affirmations.length)];
  if (next !== exclude) {
    return next;
  }

  const fallbackIndex = (affirmations.indexOf(next) + 1) % affirmations.length;
  return affirmations[fallbackIndex];
};

export const useWellbeingAffirmation = (): UseWellbeingAffirmationReturn => {
  const [affirmation, setAffirmation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAffirmation = useCallback(async () => {
    setIsLoading(true);
    setAffirmation((previous) => getLocalAffirmation(previous));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchAffirmation();
  }, [fetchAffirmation]);

  return {
    affirmation,
    isLoading,
    refresh: fetchAffirmation,
  };
};
