/**
 * Domain handling when Firestore is retryable-offline but SecureStore rejects the offline queue.
 */

import { addComment } from '@/src/domains/community/comments';
import { createPost } from '@/src/domains/community/posts';
import { saveJournalEntry } from '@/src/domains/wellbeing/journal';
import { saveMoodLog } from '@/src/domains/wellbeing/moods';
import { CacheService } from '@/src/services/offline/cache';
import {
  OFFLINE_QUEUE_SECURE_STORAGE_CODE,
  OfflineQueueSecureStorageError,
} from '@/src/services/offline/errors';
import { CommunityError } from '@/src/domains/community/types';
import type { User } from 'firebase/auth';

jest.mock('@/src/config/firebase.config', () => ({
  db: {},
}));

const mockAddDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: 1, nanoseconds: 0 })),
  where: jest.fn(),
  writeBatch: jest.fn(),
  runTransaction: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  startAfter: jest.fn(),
  updateDoc: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('@/src/services/offline/cache', () => ({
  CacheService: {
    addToQueue: jest.fn(),
  },
}));

jest.mock('@/src/domains/community/moderation', () => ({
  moderateCommunityContent: (content: string) => ({
    allowed: true,
    normalizedContent: content,
  }),
}));

jest.mock('@/src/domains/community/shared', () => ({
  DEFAULT_PAGE_SIZE: 20,
  getCommunityDb: jest.fn(() => ({})),
  getUserProfile: jest.fn(() => ({ authorName: 'Test', authorAvatar: 'a' })),
  mapPost: jest.fn(),
  mapComment: jest.fn(),
  retry: (fn: () => Promise<unknown>) => fn(),
}));

const user = { uid: 'user-1', email: 't@t.co', displayName: 'T' } as User;

describe('offline enqueue + secure storage (domain)', () => {
  const addToQueue = CacheService.addToQueue as jest.MockedFunction<typeof CacheService.addToQueue>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAddDoc.mockRejectedValue({ code: 'firestore/unavailable', message: 'offline' });
  });

  it('saveJournalEntry throws OfflineQueueSecureStorageError with Firestore error as cause', async () => {
    addToQueue.mockRejectedValue(new OfflineQueueSecureStorageError('unavailable', 12));

    let err: unknown;
    try {
      await saveJournalEntry(user, 3, 'prompt', 'entry');
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(OfflineQueueSecureStorageError);
    expect((err as OfflineQueueSecureStorageError).reason).toBe('unavailable');
    expect((err as Error & { cause?: unknown }).cause).toMatchObject({
      code: 'firestore/unavailable',
    });
  });

  it('saveMoodLog throws OfflineQueueSecureStorageError with cause when secure queue fails', async () => {
    addToQueue.mockRejectedValue(new OfflineQueueSecureStorageError('too_large', 9000));

    try {
      await saveMoodLog(user, 4, '🙂', 'Okay');
    } catch (e) {
      expect(e).toBeInstanceOf(OfflineQueueSecureStorageError);
      expect((e as OfflineQueueSecureStorageError).reason).toBe('too_large');
      expect((e as Error & { cause?: unknown }).cause).toMatchObject({
        code: 'firestore/unavailable',
      });
    }
  });

  it('createPost throws CommunityError with OFFLINE_QUEUE_SECURE_STORAGE_CODE', async () => {
    addToQueue.mockRejectedValue(new OfflineQueueSecureStorageError('write_failed', 4));

    try {
      await createPost(user, 'Support', 'Hello');
    } catch (e) {
      expect(e).toBeInstanceOf(CommunityError);
      expect((e as CommunityError).code).toBe(OFFLINE_QUEUE_SECURE_STORAGE_CODE);
      expect((e as CommunityError).retryable).toBe(true);
    }
  });

  it('addComment throws CommunityError with OFFLINE_QUEUE_SECURE_STORAGE_CODE', async () => {
    addToQueue.mockRejectedValue(new OfflineQueueSecureStorageError('unavailable', 1));

    try {
      await addComment(user, 'post-1', 'Thanks');
    } catch (e) {
      expect(e).toBeInstanceOf(CommunityError);
      expect((e as CommunityError).code).toBe(OFFLINE_QUEUE_SECURE_STORAGE_CODE);
    }
  });
});
