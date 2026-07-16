/**
 * Community Post Services
 *
 * Post creation, feed subscriptions, pagination, editing, deletion, and moderation.
 */

import type { User } from 'firebase/auth';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { COMMUNITY } from '@/src/config/constants';
import { CacheService } from '@/src/services/offline/cache';
import {
  isRetryableOfflineError,
  OFFLINE_QUEUE_SECURE_STORAGE_CODE,
  wrapOfflineQueueSecureStorageFailure,
} from '@/src/services/offline/errors';
import { OFFLINE_QUEUE_ACTIONS } from '@/src/services/offline/queueActions';
import { logger } from '@/src/shared/utils/debug';
import { moderateCommunityContent } from './moderation';
import { CommunityError, type PaginatedResult, type Post, type Unsubscribe } from './types';
import { DEFAULT_PAGE_SIZE, getCommunityDb, getUserProfile, mapPost, retry } from './shared';

const MAX_FLAG_REPORTS_BEFORE_HIDE = COMMUNITY.maxFlagReportsBeforeHide;

export interface CreatePostOptions {
  allowOfflineQueue?: boolean;
}

export const createPost = async (
  user: User,
  category: string,
  content: string,
  options: CreatePostOptions = {},
): Promise<string> => {
  const { allowOfflineQueue = true } = options;

  if (!user) {
    throw new CommunityError('Must be logged in', 'UNAUTHENTICATED');
  }
  const moderation = moderateCommunityContent(content, 'post');
  if (!moderation.allowed) {
    throw new CommunityError(
      moderation.userMessage || 'Post content cannot be published.',
      moderation.code || 'CONTENT_SAFETY_BLOCKED',
    );
  }

  try {
    return await retry(async () => {
      const communityDb = getCommunityDb();
      const { authorName, authorAvatar } = getUserProfile(user);

      const post = {
        authorId: user.uid,
        authorName,
        authorAvatar,
        category: category.trim(),
        content: moderation.normalizedContent,
        createdAt: serverTimestamp(),
        flagCount: 0,
        isHidden: false,
      };

      const ref = await addDoc(collection(communityDb, 'posts'), post);
      return ref.id;
    });
  } catch (error: unknown) {
    if (allowOfflineQueue && isRetryableOfflineError(error)) {
      try {
        const queueId = await CacheService.addToQueue(OFFLINE_QUEUE_ACTIONS.CREATE_COMMUNITY_POST, {
          userId: user.uid,
          category: category.trim(),
          content: moderation.normalizedContent,
        });
        logger.warn('Queued community post for later sync', { userId: user.uid, queueId });
        return queueId;
      } catch (queueError: unknown) {
        const secureFail = wrapOfflineQueueSecureStorageFailure(queueError, error);
        if (secureFail) {
          logger.warn('Community post not queued: secure offline storage', {
            userId: user.uid,
            reason: secureFail.reason,
          });
          throw new CommunityError(secureFail.message, OFFLINE_QUEUE_SECURE_STORAGE_CODE, true);
        }
        logger.error('Failed to queue community post after write failure', queueError, {
          userId: user.uid,
        });
      }
    }

    throw error;
  }
};

export const subscribeToPosts = (
  category: string | null,
  callback: (posts: Post[]) => void,
  onError?: (err: CommunityError) => void,
): Unsubscribe => {
  try {
    const communityDb = getCommunityDb();
    const postsQuery =
      category && category !== 'All'
        ? query(
            collection(communityDb, 'posts'),
            where('category', '==', category),
            orderBy('createdAt', 'desc'),
            limit(DEFAULT_PAGE_SIZE),
          )
        : query(
            collection(communityDb, 'posts'),
            orderBy('createdAt', 'desc'),
            limit(DEFAULT_PAGE_SIZE),
          );

    return onSnapshot(
      postsQuery,
      (snapshot) => {
        const visiblePosts = snapshot.docs.map(mapPost).filter((post) => !post.isHidden);
        callback(visiblePosts);
      },
      (err) => {
        const error = new CommunityError(
          err.message || 'Failed to subscribe to posts',
          err.code || 'UNKNOWN',
          err.code === 'unavailable',
        );
        onError?.(error) ?? callback([]);
      },
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to initialize subscription';
    const error = new CommunityError(errorMessage, 'SETUP_ERROR');
    onError?.(error);
    return () => {};
  }
};

export const loadMorePosts = async (
  category: string | null,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResult<Post>> => {
  return retry(async () => {
    const communityDb = getCommunityDb();
    const baseQuery =
      category && category !== 'All'
        ? query(
            collection(communityDb, 'posts'),
            where('category', '==', category),
            orderBy('createdAt', 'desc'),
            limit(pageSize),
          )
        : query(collection(communityDb, 'posts'), orderBy('createdAt', 'desc'), limit(pageSize));

    const postsQuery = lastDoc ? query(baseQuery, startAfter(lastDoc)) : baseQuery;
    const snapshot = await getDocs(postsQuery);
    const items = snapshot.docs.map(mapPost).filter((post) => !post.isHidden);

    return {
      items,
      lastDoc: snapshot.docs.length ? snapshot.docs[snapshot.docs.length - 1] : null,
      hasMore: snapshot.docs.length === pageSize,
    };
  });
};

export const getUserPosts = async (
  user: User,
  limitCount: number = DEFAULT_PAGE_SIZE,
): Promise<Post[]> => {
  if (!user) {
    throw new CommunityError('Must be logged in', 'UNAUTHENTICATED');
  }

  return retry(async () => {
    const communityDb = getCommunityDb();
    const normalizedLimit = Math.max(1, Math.min(limitCount, 1000));
    const baseCollection = collection(communityDb, 'posts');

    const orderedUserQuery = query(
      baseCollection,
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(normalizedLimit),
    );

    try {
      const orderedSnapshot = await getDocs(orderedUserQuery);
      return orderedSnapshot.docs.map(mapPost).filter((post) => !post.isHidden);
    } catch (error: unknown) {
      const normalizedError = error as { code?: string };

      // Fallback to an equality-only query if the ordered query requires an index.
      if (normalizedError?.code !== 'failed-precondition') {
        throw error;
      }

      const fallbackQuery = query(
        baseCollection,
        where('authorId', '==', user.uid),
        limit(normalizedLimit),
      );
      const fallbackSnapshot = await getDocs(fallbackQuery);
      return fallbackSnapshot.docs.map(mapPost).filter((post) => !post.isHidden);
    }
  });
};

export const updatePost = async (user: User, postId: string, content: string): Promise<void> => {
  if (!user) {
    throw new CommunityError('Must be logged in', 'UNAUTHENTICATED');
  }
  const moderation = moderateCommunityContent(content, 'post');
  if (!moderation.allowed) {
    throw new CommunityError(
      moderation.userMessage || 'Post content cannot be published.',
      moderation.code || 'CONTENT_SAFETY_BLOCKED',
    );
  }

  return retry(async () => {
    const communityDb = getCommunityDb();
    const postRef = doc(communityDb, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new CommunityError('Post not found', 'NOT_FOUND');
    }

    if (postSnap.data().authorId !== user.uid) {
      throw new CommunityError('You can only edit your own posts', 'UNAUTHORIZED');
    }

    await updateDoc(postRef, {
      content: moderation.normalizedContent,
      updatedAt: serverTimestamp(),
      isEdited: true,
    });
  });
};

export const deletePost = async (user: User, postId: string): Promise<void> => {
  if (!user) {
    throw new CommunityError('Must be logged in', 'UNAUTHENTICATED');
  }

  return retry(async () => {
    const communityDb = getCommunityDb();
    const postRef = doc(communityDb, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new CommunityError('Post not found', 'NOT_FOUND');
    }

    if (postSnap.data().authorId !== user.uid) {
      throw new CommunityError('You can only delete your own posts', 'UNAUTHORIZED');
    }

    const batch = writeBatch(communityDb);
    const commentsSnap = await getDocs(query(collection(communityDb, 'posts', postId, 'comments')));

    commentsSnap.docs.forEach((commentDoc) => {
      batch.delete(commentDoc.ref);
    });
    batch.delete(postRef);

    await batch.commit();
  });
};

export const reportPost = async (user: User, postId: string, reason: string): Promise<void> => {
  if (!user) {
    throw new CommunityError('Must be logged in', 'UNAUTHENTICATED');
  }

  return retry(async () => {
    const communityDb = getCommunityDb();
    const postRef = doc(communityDb, 'posts', postId);
    const reportRef = doc(communityDb, 'posts', postId, 'reports', user.uid);
    await runTransaction(communityDb, async (transaction) => {
      const [postSnap, reportSnap] = await Promise.all([
        transaction.get(postRef),
        transaction.get(reportRef),
      ]);

      if (!postSnap.exists()) {
        throw new CommunityError('Post not found', 'NOT_FOUND');
      }

      if (reportSnap.exists()) {
        throw new CommunityError('You have already reported this post', 'ALREADY_REPORTED');
      }

      const data = postSnap.data();
      const existingFlagCount = typeof data.flagCount === 'number' ? data.flagCount : 0;
      const nextFlagCount = existingFlagCount + 1;

      transaction.set(reportRef, {
        userId: user.uid,
        reason: reason.trim(),
        createdAt: serverTimestamp(),
      });
      transaction.update(postRef, {
        flagCount: nextFlagCount,
        ...(nextFlagCount >= MAX_FLAG_REPORTS_BEFORE_HIDE ? { isHidden: true } : {}),
      });
    });
  });
};
