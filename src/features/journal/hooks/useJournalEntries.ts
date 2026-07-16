/**
 * useJournalEntries Hook
 *
 * Centralized hook for managing journal entries data including fetching,
 * filtering, and CRUD operations.
 */

import {
  createInterventionSignalSnapshot,
  getLatestResilienceCheckIn,
  getUserMoodLogs,
  logInterventionEvent,
  type MoodLog,
} from '@/src/domains/wellbeing';
import { useAuth, useErrorHandler } from '@/src/shared/hooks';
import {
  deleteJournalEntry as deleteJournalEntryService,
  getUserJournalEntries,
  JournalEntry,
  saveJournalEntry as saveJournalEntryService,
  updateJournalEntry as updateJournalEntryService,
} from '@/src/features/journal/services/journal';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UseJournalEntriesReturn {
  entries: JournalEntry[];
  moodLogs: MoodLog[];
  isLoading: boolean;
  filteredEntries: JournalEntry[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterMood: number | null;
  setFilterMood: (mood: number | null) => void;
  saveEntry: (entry: { mood: number; prompt: string; entry: string }) => Promise<void>;
  updateEntry: (
    entryId: string,
    entry: { mood: number; prompt: string; entry: string },
  ) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useJournalEntries = (): UseJournalEntriesReturn => {
  const { user } = useAuth();
  const handleError = useErrorHandler();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMood, setFilterMood] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [fetchedEntries, fetchedMoodLogs] = await Promise.all([
        getUserJournalEntries(user, 100),
        getUserMoodLogs(user, 30),
      ]);
      setEntries(fetchedEntries);
      setMoodLogs(fetchedMoodLogs);
    } catch (error) {
      handleError(error, { context: 'Fetching journal data', showAlert: false });
    } finally {
      setIsLoading(false);
    }
  }, [user, handleError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          entry.entry.toLowerCase().includes(query) || entry.prompt.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (filterMood !== null && entry.mood !== filterMood) {
        return false;
      }

      return true;
    });
  }, [entries, searchQuery, filterMood]);

  const saveJournalEntry = useCallback(
    async (entry: { mood: number; prompt: string; entry: string }) => {
      if (!user) return;
      try {
        const latestCheckIn = await getLatestResilienceCheckIn(user).catch(() => null);
        await saveJournalEntryService(user, entry.mood, entry.prompt, entry.entry);
        try {
          await logInterventionEvent(user.uid, {
            type: 'journal',
            source: 'journal',
            label: 'Write a brief journal reflection',
            preSignals: createInterventionSignalSnapshot(latestCheckIn),
          });
        } catch {
          // Do not block a successful save on outcome telemetry storage.
        }
        await fetchData();
      } catch (error) {
        handleError(error, { context: 'Saving journal entry' });
        throw error;
      }
    },
    [user, fetchData, handleError],
  );

  const updateJournalEntry = useCallback(
    async (entryId: string, entry: { mood: number; prompt: string; entry: string }) => {
      if (!user) return;
      try {
        await updateJournalEntryService(user, entryId, entry.mood, entry.prompt, entry.entry);
        await fetchData();
      } catch (error) {
        handleError(error, { context: 'Updating journal entry' });
        throw error;
      }
    },
    [user, fetchData, handleError],
  );

  const deleteJournalEntryHandler = useCallback(
    async (entryId: string) => {
      if (!user) return;
      try {
        await deleteJournalEntryService(user, entryId);
        await fetchData();
      } catch (error) {
        handleError(error, { context: 'Deleting journal entry' });
        throw error;
      }
    },
    [user, fetchData, handleError],
  );

  return {
    entries,
    moodLogs,
    isLoading,
    filteredEntries,
    searchQuery,
    setSearchQuery,
    filterMood,
    setFilterMood,
    saveEntry: saveJournalEntry,
    updateEntry: updateJournalEntry,
    deleteEntry: deleteJournalEntryHandler,
    refresh: fetchData,
  };
};
