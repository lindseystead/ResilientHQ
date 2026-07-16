/**
 * Offline Queue Action Types
 *
 * Typed queue action names and payload shapes for write operations that can be
 * retried safely after transient network failures.
 */

export const OFFLINE_QUEUE_ACTIONS = {
  SAVE_MOOD_LOG: 'wellbeing.saveMoodLog',
  SAVE_JOURNAL_ENTRY: 'wellbeing.saveJournalEntry',
  CREATE_COMMUNITY_POST: 'community.createPost',
  ADD_COMMUNITY_COMMENT: 'community.addComment',
} as const;

export type OfflineQueueAction = (typeof OFFLINE_QUEUE_ACTIONS)[keyof typeof OFFLINE_QUEUE_ACTIONS];

export interface SaveMoodLogQueuePayload {
  userId: string;
  moodValue: number;
  moodEmoji: string;
  moodLabel: string;
  notes?: string;
}

export interface SaveJournalEntryQueuePayload {
  userId: string;
  mood: number;
  prompt: string;
  entry: string;
}

export interface CreateCommunityPostQueuePayload {
  userId: string;
  category: string;
  content: string;
}

export interface AddCommunityCommentQueuePayload {
  userId: string;
  postId: string;
  content: string;
}
