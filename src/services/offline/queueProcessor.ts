/**
 * Offline Queue Processor
 *
 * Resolves queued write operations into domain calls when connectivity returns.
 */

import { addComment, createPost } from '@/src/domains/community/community';
import { saveJournalEntry, saveMoodLog } from '@/src/domains/wellbeing';
import { logger } from '@/src/shared/utils/debug';
import type { User } from 'firebase/auth';
import type { QueueItem, QueueProcessorResult } from './cache';
import { OFFLINE_QUEUE_ACTIONS } from './queueActions';
import type {
  AddCommunityCommentQueuePayload,
  CreateCommunityPostQueuePayload,
  SaveJournalEntryQueuePayload,
  SaveMoodLogQueuePayload,
} from './queueActions';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isFinite(value);
};

const isMoodPayload = (payload: unknown): payload is SaveMoodLogQueuePayload => {
  if (!isRecord(payload)) {
    return false;
  }

  return (
    isNonEmptyString(payload.userId) &&
    isNumber(payload.moodValue) &&
    isNonEmptyString(payload.moodEmoji) &&
    isNonEmptyString(payload.moodLabel) &&
    (payload.notes === undefined || typeof payload.notes === 'string')
  );
};

const isJournalPayload = (payload: unknown): payload is SaveJournalEntryQueuePayload => {
  if (!isRecord(payload)) {
    return false;
  }

  return (
    isNonEmptyString(payload.userId) &&
    isNumber(payload.mood) &&
    isNonEmptyString(payload.prompt) &&
    isNonEmptyString(payload.entry)
  );
};

const isCreatePostPayload = (payload: unknown): payload is CreateCommunityPostQueuePayload => {
  if (!isRecord(payload)) {
    return false;
  }

  return (
    isNonEmptyString(payload.userId) &&
    isNonEmptyString(payload.category) &&
    isNonEmptyString(payload.content)
  );
};

const isCommentPayload = (payload: unknown): payload is AddCommunityCommentQueuePayload => {
  if (!isRecord(payload)) {
    return false;
  }

  return (
    isNonEmptyString(payload.userId) &&
    isNonEmptyString(payload.postId) &&
    isNonEmptyString(payload.content)
  );
};

const shouldDeferForUser = (user: User, payloadUserId: string): boolean => {
  return payloadUserId !== user.uid;
};

export const processOfflineQueueItem = async (
  item: QueueItem,
  user: User | null,
): Promise<QueueProcessorResult> => {
  if (!user) {
    return 'defer';
  }

  switch (item.action) {
    case OFFLINE_QUEUE_ACTIONS.SAVE_MOOD_LOG: {
      if (!isMoodPayload(item.payload)) {
        logger.warn('Dropping invalid queued mood payload', { itemId: item.id });
        return true;
      }

      if (shouldDeferForUser(user, item.payload.userId)) {
        return 'defer';
      }

      await saveMoodLog(
        user,
        item.payload.moodValue,
        item.payload.moodEmoji,
        item.payload.moodLabel,
        item.payload.notes,
        { allowOfflineQueue: false },
      );
      return true;
    }

    case OFFLINE_QUEUE_ACTIONS.SAVE_JOURNAL_ENTRY: {
      if (!isJournalPayload(item.payload)) {
        logger.warn('Dropping invalid queued journal payload', { itemId: item.id });
        return true;
      }

      if (shouldDeferForUser(user, item.payload.userId)) {
        return 'defer';
      }

      await saveJournalEntry(user, item.payload.mood, item.payload.prompt, item.payload.entry, {
        allowOfflineQueue: false,
      });
      return true;
    }

    case OFFLINE_QUEUE_ACTIONS.CREATE_COMMUNITY_POST: {
      if (!isCreatePostPayload(item.payload)) {
        logger.warn('Dropping invalid queued post payload', { itemId: item.id });
        return true;
      }

      if (shouldDeferForUser(user, item.payload.userId)) {
        return 'defer';
      }

      await createPost(user, item.payload.category, item.payload.content, {
        allowOfflineQueue: false,
      });
      return true;
    }

    case OFFLINE_QUEUE_ACTIONS.ADD_COMMUNITY_COMMENT: {
      if (!isCommentPayload(item.payload)) {
        logger.warn('Dropping invalid queued comment payload', { itemId: item.id });
        return true;
      }

      if (shouldDeferForUser(user, item.payload.userId)) {
        return 'defer';
      }

      await addComment(user, item.payload.postId, item.payload.content, {
        allowOfflineQueue: false,
      });
      return true;
    }

    default:
      logger.warn('Dropping unknown queue action', { action: item.action, itemId: item.id });
      return true;
  }
};
