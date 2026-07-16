/**
 * Wellbeing Mood Service
 *
 * Domain-owned Firestore service for saving and retrieving user mood logs.
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
  FieldValue,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

export interface MoodLog {
  id?: string;
  userId: string;
  moodValue: number;
  moodEmoji: string;
  moodLabel: string;
  timestamp: Date | FieldValue;
  notes?: string;
}

export interface SaveMoodLogOptions {
  allowOfflineQueue?: boolean;
}

export const saveMoodLog = async (
  user: User,
  moodValue: number,
  moodEmoji: string,
  moodLabel: string,
  notes?: string,
  options: SaveMoodLogOptions = {},
): Promise<string> => {
  const { allowOfflineQueue = true } = options;

  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  if (!user) {
    throw new Error('User must be authenticated to save mood logs');
  }

  try {
    const normalizedNotes =
      notes && typeof notes === 'string' && notes.trim().length > 0 ? notes.trim() : undefined;

    const moodLog: Record<string, unknown> = {
      userId: user.uid,
      moodValue,
      moodEmoji,
      moodLabel,
      timestamp: serverTimestamp(),
    };

    if (normalizedNotes) {
      moodLog.notes = normalizedNotes;
    }

    const userMoodsRef = collection(db, 'moods', user.uid, 'logs');
    const docRef = await addDoc(userMoodsRef, moodLog);
    return docRef.id;
  } catch (error: unknown) {
    if (allowOfflineQueue && isRetryableOfflineError(error)) {
      try {
        const queueId = await CacheService.addToQueue(OFFLINE_QUEUE_ACTIONS.SAVE_MOOD_LOG, {
          userId: user.uid,
          moodValue,
          moodEmoji,
          moodLabel,
          notes: notes?.trim() || undefined,
        });
        logger.warn('Queued mood log for later sync', { userId: user.uid, queueId });
        return queueId;
      } catch (queueError: unknown) {
        const secureFail = wrapOfflineQueueSecureStorageFailure(queueError, error);
        if (secureFail) {
          logger.warn('Mood log not queued: secure offline storage', {
            userId: user.uid,
            reason: secureFail.reason,
            payloadByteLength: secureFail.payloadByteLength,
          });
          throw secureFail;
        }
        logger.error('Failed to queue mood log after write failure', queueError, {
          userId: user.uid,
        });
      }
    }

    logger.error('Error saving mood log', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save mood log');
  }
};

export const getUserMoodLogs = async (user: User, limitCount: number = 30): Promise<MoodLog[]> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  if (!user) {
    throw new Error('User must be authenticated to retrieve mood logs');
  }

  try {
    const userMoodsRef = collection(db, 'moods', user.uid, 'logs');
    const moodQuery = query(userMoodsRef, orderBy('timestamp', 'desc'), limit(limitCount));

    const querySnapshot = await getDocs(moodQuery);
    const moodLogs: MoodLog[] = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      moodLogs.push({
        id: docSnapshot.id,
        userId: data.userId,
        moodValue: data.moodValue,
        moodEmoji: data.moodEmoji,
        moodLabel: data.moodLabel,
        timestamp: normalizeTimestamp(data.timestamp),
        notes: data.notes,
      });
    });

    return moodLogs;
  } catch (error: unknown) {
    logger.error('Error fetching mood logs', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch mood logs');
  }
};
