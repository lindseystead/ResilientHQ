/**
 * Wellbeing Check-In Service
 *
 * Persists structured daily resilience check-ins so the app can remember more
 * than a single mood rating.
 */

import { db } from '@/src/config/firebase.config';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { logger } from '@/src/shared/utils/debug';
import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  limit,
  orderBy,
  query,
  serverTimestamp,
  type FieldValue,
  getDocs,
} from 'firebase/firestore';

export interface ResilienceCheckInDraft {
  moodValue: number;
  sleepQuality: number;
  energyLevel: number;
  stressLevel: number;
  bodyTension: number;
  connectionLevel: number;
  safetyLevel: number;
  reflection?: string;
}

export interface ResilienceCheckInEntry extends ResilienceCheckInDraft {
  id?: string;
  userId: string;
  createdAt: Date | FieldValue;
}

const isSameLocalDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const mapCheckInEntry = (id: string, data: Record<string, unknown>): ResilienceCheckInEntry => ({
  id,
  userId: String(data.userId ?? ''),
  moodValue: Number(data.moodValue ?? 0),
  sleepQuality: Number(data.sleepQuality ?? 0),
  energyLevel: Number(data.energyLevel ?? 0),
  stressLevel: Number(data.stressLevel ?? 0),
  bodyTension: Number(data.bodyTension ?? 0),
  connectionLevel: Number(data.connectionLevel ?? 0),
  safetyLevel: Number(data.safetyLevel ?? 0),
  reflection: typeof data.reflection === 'string' ? data.reflection : undefined,
  createdAt: normalizeTimestamp(data.createdAt),
});

export const saveResilienceCheckIn = async (
  user: User,
  draft: ResilienceCheckInDraft,
): Promise<string> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  if (!user) {
    throw new Error('User must be authenticated to save a resilience check-in');
  }

  try {
    const payload: Record<string, unknown> = {
      userId: user.uid,
      moodValue: draft.moodValue,
      sleepQuality: draft.sleepQuality,
      energyLevel: draft.energyLevel,
      stressLevel: draft.stressLevel,
      bodyTension: draft.bodyTension,
      connectionLevel: draft.connectionLevel,
      safetyLevel: draft.safetyLevel,
      createdAt: serverTimestamp(),
    };

    if (draft.reflection && draft.reflection.trim().length > 0) {
      payload.reflection = draft.reflection.trim();
    }

    const checkInsRef = collection(db, 'resilienceCheckIns', user.uid, 'entries');
    const docRef = await addDoc(checkInsRef, payload);
    return docRef.id;
  } catch (error: unknown) {
    logger.error('Error saving resilience check-in', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to save resilience check-in');
  }
};

export const getLatestResilienceCheckIn = async (
  user: User,
): Promise<ResilienceCheckInEntry | null> => {
  const recentCheckIns = await getRecentResilienceCheckIns(user, 1);
  return recentCheckIns[0] ?? null;
};

export const getRecentResilienceCheckIns = async (
  user: User,
  limitCount: number = 7,
): Promise<ResilienceCheckInEntry[]> => {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  if (!user) {
    throw new Error('User must be authenticated to load resilience check-ins');
  }

  try {
    const checkInsRef = collection(db, 'resilienceCheckIns', user.uid, 'entries');
    const latestQuery = query(checkInsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(latestQuery);
    return snapshot.docs.map((entry) =>
      mapCheckInEntry(entry.id, entry.data() as Record<string, unknown>),
    );
  } catch (error: unknown) {
    logger.error('Error loading resilience check-ins', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to load resilience check-ins');
  }
};

export const hasCompletedResilienceCheckInToday = (
  latestCheckIn: ResilienceCheckInEntry | null,
  now: Date = new Date(),
): boolean => {
  if (!latestCheckIn || !(latestCheckIn.createdAt instanceof Date)) {
    return false;
  }

  return isSameLocalDay(latestCheckIn.createdAt, now);
};
