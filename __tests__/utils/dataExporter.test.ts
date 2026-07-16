/**
 * Data Exporter Tests
 *
 * Verifies dedicated AI chat exports stay well-structured and privacy-safe.
 */

import { getUserChatMessages } from '@/src/domains/ai';
import { getUserPosts } from '@/src/domains/community';
import { getUserJournalEntries, getUserMoodLogs } from '@/src/domains/wellbeing';
import { DataExporter } from '@/src/shared/utils/data/exporter';

jest.mock('@/src/domains/ai', () => ({
  getUserChatMessages: jest.fn(),
}));

jest.mock('@/src/domains/community', () => ({
  getUserPosts: jest.fn(),
}));

jest.mock('@/src/domains/wellbeing', () => ({
  getUserJournalEntries: jest.fn(),
  getUserMoodLogs: jest.fn(),
}));

describe('DataExporter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports saved chat history with stable metadata', async () => {
    const mockUser = {
      uid: 'user-123',
      email: 'test@example.com',
    } as unknown as Parameters<typeof DataExporter.exportChatHistory>[0];

    (getUserChatMessages as jest.Mock).mockResolvedValue([
      {
        id: 'm1',
        userId: mockUser.uid,
        role: 'user',
        content: 'I need help slowing down.',
        timestamp: new Date('2026-02-25T10:00:00.000Z'),
      },
      {
        id: 'm2',
        userId: mockUser.uid,
        role: 'assistant',
        content: 'Let us take one breath together.',
        timestamp: new Date('2026-02-25T10:01:00.000Z'),
      },
      {
        id: 'm3',
        userId: mockUser.uid,
        role: 'user',
        content: 'That helped a little.',
        timestamp: new Date('2026-02-26T09:30:00.000Z'),
      },
    ]);

    const exportResult = await DataExporter.exportChatHistory(mockUser);

    expect(getUserChatMessages).toHaveBeenCalledWith(mockUser, 1000);
    expect(exportResult).not.toBeNull();
    expect(exportResult?.metadata.totalMessages).toBe(3);
    expect(exportResult?.metadata.totalUserMessages).toBe(2);
    expect(exportResult?.metadata.totalAssistantMessages).toBe(1);
    expect(exportResult?.metadata.dateRange.earliest).toBe('2026-02-25T10:00:00.000Z');
    expect(exportResult?.metadata.dateRange.latest).toBe('2026-02-26T09:30:00.000Z');
  });

  it('uses a dedicated filename prefix for chat exports', () => {
    const filename = DataExporter.generateFilename('test@example.com', 'chat-history');

    expect(filename).toContain('resilienthq-chat-history-test-');
    expect(filename).toMatch(/\.json$/);
  });

  it('exports user data using scoped domain queries', async () => {
    const mockUser = {
      uid: 'user-abc',
      email: 'abc@example.com',
    } as unknown as Parameters<typeof DataExporter.exportUserData>[0];

    (getUserMoodLogs as jest.Mock).mockResolvedValue([]);
    (getUserJournalEntries as jest.Mock).mockResolvedValue([]);
    (getUserPosts as jest.Mock).mockResolvedValue([]);

    const exportResult = await DataExporter.exportUserData(mockUser);

    expect(exportResult).not.toBeNull();
    expect(getUserMoodLogs).toHaveBeenCalledWith(mockUser, 1000);
    expect(getUserJournalEntries).toHaveBeenCalledWith(mockUser, 1000);
    expect(getUserPosts).toHaveBeenCalledWith(mockUser, 1000);
  });
});
