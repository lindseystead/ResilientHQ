/**
 * Community Comment Services
 *
 * Comment creation, subscriptions, editing, deletion, and moderation.
 */

import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
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
import { CommunityError, type Comment, type Unsubscribe } from './types';
import { getCommunityDb, getUserProfile, mapComment, retry } from './shared';

const MAX_FLAG_REPORTS_BEFORE_HIDE = COMMUNITY.maxFlagReportsBeforeHide;

export interface AddCommentOptions {
  allowOfflineQueue?: boolean;
}

export const addComment = async (
  user: User,
  postId: string,
  content: string,
  options: AddCommentOptions = {},
): Promise<string> => {
  const { allowOfflineQueue = true } = options;

  if (!user) {
    throw new CommunityError('Must be logged in', 'UNAUTHENTICATED');
  }
  const moderation = moderateCommunityContent(content, 'comment');
  if (!moderation.allowed) {
    throw new CommunityError(
      moderation.userMessage || 'Comment cannot be published.',
      moderation.code || 'CONTENT_SAFETY_BLOCKED',
    );
  }

  try {
    return await retry(async () => {
      const communityDb = getCommunityDb();
      const { authorName, authorAvatar } = getUserProfile(user);

      const comment = {
        authorId: user.uid,
        authorName,
        authorAvatar,
        content: moderation.normalizedContent,
        createdAt: serverTimestamp(),
        flagCount: 0,
        isHidden: false,
      };

      const ref = await addDoc(collection(communityDb, 'posts', postId, 'comments'), comment);
      return ref.id;
    });
  } catch (error: unknown) {
    if (allowOfflineQueue && isRetryableOfflineError(error)) {
      try {
        const queueId = await CacheService.addToQueue(OFFLINE_QUEUE_ACTIONS.ADD_COMMUNITY_COMMENT, {
          userId: user.uid,
          postId,
          content: moderation.normalizedContent,
        });
        logger.warn('Queued community comment for later sync', { userId: user.uid, queueId });
        return queueId;
      } catch (queueError: unknown) {
        const secureFail = wrapOfflineQueueSecureStorageFailure(queueError, error);
        if (secureFail) {
          logger.warn('Community comment not queued: secure offline storage', {
            userId: user.uid,
            reason: secureFail.reason,
          });
          throw new CommunityError(secureFail.message, OFFLINE_QUEUE_SECURE_STORAGE_CODE, true);
        }
        logger.error('Failed to queue community comment after write failure', queueError, {
          userId: user.uid,
        });
      }
    }

    throw error;
  }
};

export const subscribeToComments = (
  postId: string,
  callback: (comments: Comment[]) => void,
  onError?: (err: CommunityError) => void,
): Unsubscribe => {
  try {
    const communityDb = getCommunityDb();
    const commentsQuery = query(
      collection(communityDb, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc'),
    );

    return onSnapshot(
      commentsQuery,
      (snapshot) => {
        const visibleComments = snapshot.docs
          .map(mapComment)
          .filter((comment) => !comment.isHidden);
        callback(visibleComments);
      },
      (err) => {
        const error = new CommunityError(
          err.message || 'Failed to subscribe to comments',
          err.code || 'UNKNOWN',
          err.code === 'unavailable',
        );
        onError?.(error) ?? callback([]);
      },
    );
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to set up comment subscription';
    const error = new CommunityError(errorMessage, 'SETUP_ERROR');
    onError?.(error);
    return () => {};
  }
};

export const updateComment = async (
  user: User,
  postId: string,
  commentId: string,
  content: string,
): Promise<void> => {
  if (!user) {
    throw new CommunityError('Must be logged in', 'UNAUTHENTICATED');
  }
  const moderation = moderateCommunityContent(content, 'comment');
  if (!moderation.allowed) {
    throw new CommunityError(
      moderation.userMessage || 'Comment cannot be published.',
      moderation.code || 'CONTENT_SAFETY_BLOCKED',
    );
  }

  return retry(async () => {
    const communityDb = getCommunityDb();
    const commentRef = doc(communityDb, 'posts', postId, 'comments', commentId);
    const commentSnap = await getDoc(commentRef);

    if (!commentSnap.exists()) {
      throw new CommunityError('Comment not found', 'NOT_FOUND');
    }

    if (commentSnap.data().authorId !== user.uid) {
      throw new CommunityError('You can only edit your own comments', 'UNAUTHORIZED');
    }

    await updateDoc(commentRef, {
      content: moderation.normalizedContent,
      updatedAt: serverTimestamp(),
      isEdited: true,
    });
  });
};

export const deleteComment = async (
  user: User,
  postId: string,
  commentId: string,
): Promise<void> => {
  if (!user) {
    throw new CommunityError('Must be logged in', 'UNAUTHENTICATED');
  }

  return retry(async () => {
    const communityDb = getCommunityDb();
    const commentRef = doc(communityDb, 'posts', postId, 'comments', commentId);
    const commentSnap = await getDoc(commentRef);

    if (!commentSnap.exists()) {
      throw new CommunityError('Comment not found', 'NOT_FOUND');
    }

    if (commentSnap.data().authorId !== user.uid) {
      throw new CommunityError('You can only delete your own comments', 'UNAUTHORIZED');
    }

    await deleteDoc(commentRef);
  });
};

export const reportComment = async (
  user: User,
  postId: string,
  commentId: string,
  reason: string,
): Promise<void> => {
  if (!user) {
    throw new CommunityError('Must be logged in', 'UNAUTHENTICATED');
  }

  return retry(async () => {
    const communityDb = getCommunityDb();
    const commentRef = doc(communityDb, 'posts', postId, 'comments', commentId);
    const reportRef = doc(communityDb, 'posts', postId, 'comments', commentId, 'reports', user.uid);
    await runTransaction(communityDb, async (transaction) => {
      const [commentSnap, reportSnap] = await Promise.all([
        transaction.get(commentRef),
        transaction.get(reportRef),
      ]);

      if (!commentSnap.exists()) {
        throw new CommunityError('Comment not found', 'NOT_FOUND');
      }

      if (reportSnap.exists()) {
        throw new CommunityError('You have already reported this comment', 'ALREADY_REPORTED');
      }

      const data = commentSnap.data();
      const existingFlagCount = typeof data.flagCount === 'number' ? data.flagCount : 0;
      const nextFlagCount = existingFlagCount + 1;

      transaction.set(reportRef, {
        userId: user.uid,
        reason: reason.trim(),
        createdAt: serverTimestamp(),
      });
      transaction.update(commentRef, {
        flagCount: nextFlagCount,
        ...(nextFlagCount >= MAX_FLAG_REPORTS_BEFORE_HIDE ? { isHidden: true } : {}),
      });
    });
  });
};
