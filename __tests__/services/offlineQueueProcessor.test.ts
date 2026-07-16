import type { User } from 'firebase/auth';
import type { QueueItem } from '@/src/services/offline/cache';
import { processOfflineQueueItem } from '@/src/services/offline/queueProcessor';
import { OFFLINE_QUEUE_ACTIONS } from '@/src/services/offline/queueActions';
import { addComment, createPost } from '@/src/domains/community/community';
import { saveJournalEntry, saveMoodLog } from '@/src/domains/wellbeing';

jest.mock('@/src/domains/wellbeing', () => ({
  saveMoodLog: jest.fn(),
  saveJournalEntry: jest.fn(),
}));

jest.mock('@/src/domains/community/community', () => ({
  createPost: jest.fn(),
  addComment: jest.fn(),
}));

jest.mock('@/src/shared/utils/debug', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const createQueueItem = (overrides: Partial<QueueItem> = {}): QueueItem => ({
  id: 'queue-item-1',
  action: OFFLINE_QUEUE_ACTIONS.SAVE_MOOD_LOG,
  payload: {},
  retries: 0,
  timestamp: Date.now(),
  ...overrides,
});

describe('processOfflineQueueItem', () => {
  const user = { uid: 'user-123' } as User;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns defer when user context is unavailable', async () => {
    const item = createQueueItem();
    await expect(processOfflineQueueItem(item, null)).resolves.toBe('defer');
  });

  it('processes queued mood logs for matching users', async () => {
    const item = createQueueItem({
      action: OFFLINE_QUEUE_ACTIONS.SAVE_MOOD_LOG,
      payload: {
        userId: user.uid,
        moodValue: 4,
        moodEmoji: '🙂',
        moodLabel: 'Steady',
      },
    });

    await expect(processOfflineQueueItem(item, user)).resolves.toBe(true);
    expect(saveMoodLog).toHaveBeenCalledWith(user, 4, '🙂', 'Steady', undefined, {
      allowOfflineQueue: false,
    });
  });

  it('defers items that belong to another user', async () => {
    const item = createQueueItem({
      action: OFFLINE_QUEUE_ACTIONS.SAVE_JOURNAL_ENTRY,
      payload: {
        userId: 'other-user',
        mood: 3,
        prompt: 'Prompt',
        entry: 'Entry',
      },
    });

    await expect(processOfflineQueueItem(item, user)).resolves.toBe('defer');
    expect(saveJournalEntry).not.toHaveBeenCalled();
  });

  it('drops invalid payload records to prevent infinite retry loops', async () => {
    const item = createQueueItem({
      action: OFFLINE_QUEUE_ACTIONS.CREATE_COMMUNITY_POST,
      payload: { userId: user.uid, category: 'Support' },
    });

    await expect(processOfflineQueueItem(item, user)).resolves.toBe(true);
    expect(createPost).not.toHaveBeenCalled();
  });

  it('routes supported actions to domain services with queueing disabled', async () => {
    const postItem = createQueueItem({
      action: OFFLINE_QUEUE_ACTIONS.CREATE_COMMUNITY_POST,
      payload: {
        userId: user.uid,
        category: 'Support',
        content: 'You are not alone.',
      },
    });

    const commentItem = createQueueItem({
      id: 'queue-item-2',
      action: OFFLINE_QUEUE_ACTIONS.ADD_COMMUNITY_COMMENT,
      payload: {
        userId: user.uid,
        postId: 'post-1',
        content: 'Thank you for sharing.',
      },
    });

    await expect(processOfflineQueueItem(postItem, user)).resolves.toBe(true);
    await expect(processOfflineQueueItem(commentItem, user)).resolves.toBe(true);

    expect(createPost).toHaveBeenCalledWith(user, 'Support', 'You are not alone.', {
      allowOfflineQueue: false,
    });
    expect(addComment).toHaveBeenCalledWith(user, 'post-1', 'Thank you for sharing.', {
      allowOfflineQueue: false,
    });
  });
});
