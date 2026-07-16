/**
 * Wellbeing Journal Service
 *
 * Domain-owned Firestore service for saving and retrieving journal entries.
 */

import { db } from '@/src/config/firebase.config';
import {
  isRetryableOfflineError,
  wrapOfflineQueueSecureStorageFailure,
} from '@/src/services/offline/errors';
import { CacheService } from '@/src/services/offline/cache';
import { OFFLINE_QUEUE_ACTIONS } from '@/src/services/offline/queueActions';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { logger } from '@/src/shared/utils/debug';
import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  FieldValue,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

export interface JournalEntry {
  id?: string;
  userId: string;
  date: string;
  mood: number;
  prompt: string;
  entry: string;
  timestamp: Date | FieldValue;
}

export interface SaveJournalEntryOptions {
  allowOfflineQueue?: boolean;
}

export const saveJournalEntry = async (
  user: User,
  mood: number,
  prompt: string,
  entry: string,
  options: SaveJournalEntryOptions = {},
): Promise<string> => {
  const { allowOfflineQueue = true } = options;

  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  if (!user) {
    throw new Error('User must be authenticated to save journal entries');
  }

  try {
    const journalEntry: Omit<JournalEntry, 'id'> = {
      userId: user.uid,
      date: new Date().toISOString().split('T')[0],
      mood,
      prompt,
      entry,
      timestamp: serverTimestamp(),
    };

    const userJournalRef = collection(db, 'journals', user.uid, 'entries');
    const docRef = await addDoc(userJournalRef, journalEntry);
    return docRef.id;
  } catch (error: unknown) {
    if (allowOfflineQueue && isRetryableOfflineError(error)) {
      try {
        const queueId = await CacheService.addToQueue(OFFLINE_QUEUE_ACTIONS.SAVE_JOURNAL_ENTRY, {
          userId: user.uid,
          mood,
          prompt,
          entry,
        });
        logger.warn('Queued journal entry for later sync', { userId: user.uid, queueId });
        return queueId;
      } catch (queueError: unknown) {
        const secureFail = wrapOfflineQueueSecureStorageFailure(queueError, error);
        if (secureFail) {
          logger.warn('Journal entry not queued: secure offline storage', {
            userId: user.uid,
            reason: secureFail.reason,
            payloadByteLength: secureFail.payloadByteLength,
          });
          throw secureFail;
        }
        logger.error('Failed to queue journal entry after write failure', queueError, {
          userId: user.uid,
        });
      }
    }

    logger.error('Error saving journal entry', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save journal entry');
  }
};

export const updateJournalEntry = async (
  user: User,
  entryId: string,
  mood: number,
  prompt: string,
  entry: string,
): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  if (!user) {
    throw new Error('User must be authenticated to update journal entries');
  }

  try {
    const entryRef = doc(db, 'journals', user.uid, 'entries', entryId);
    await updateDoc(entryRef, {
      mood,
      prompt,
      entry,
      timestamp: serverTimestamp(),
    });
  } catch (error: unknown) {
    logger.error('Error updating journal entry', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update journal entry');
  }
};

export const deleteJournalEntry = async (user: User, entryId: string): Promise<void> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  if (!user) {
    throw new Error('User must be authenticated to delete journal entries');
  }

  try {
    const entryRef = doc(db, 'journals', user.uid, 'entries', entryId);
    await deleteDoc(entryRef);
  } catch (error: unknown) {
    logger.error('Error deleting journal entry', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to delete journal entry');
  }
};

export const getUserJournalEntries = async (
  user: User,
  limitCount: number = 50,
): Promise<JournalEntry[]> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  if (!user) {
    throw new Error('User must be authenticated to retrieve journal entries');
  }

  try {
    const userJournalRef = collection(db, 'journals', user.uid, 'entries');
    const journalQuery = query(userJournalRef, orderBy('timestamp', 'desc'), limit(limitCount));

    const querySnapshot = await getDocs(journalQuery);
    const entries: JournalEntry[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      entries.push({
        id: docSnapshot.id,
        userId: data.userId,
        date: data.date,
        mood: data.mood,
        prompt: data.prompt,
        entry: data.entry,
        timestamp: normalizeTimestamp(data.timestamp),
      });
    });

    return entries;
  } catch (error: unknown) {
    logger.error('Error fetching journal entries', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch journal entries');
  }
};
