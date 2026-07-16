/**
 * Data Exporter
 *
 * Exports user data and saved AI chat history in JSON format.
 * Supports full data export for privacy compliance.
 */

import { getUserChatMessages } from '@/src/domains/ai';
import type { ChatMessage } from '@/src/domains/ai';
import { Post, getUserPosts } from '@/src/domains/community';
import {
  getUserJournalEntries,
  JournalEntry,
  getUserMoodLogs,
  MoodLog,
} from '@/src/domains/wellbeing';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { logger } from '@/src/shared/utils/debug';
import { formatDate } from '@/src/shared/utils/format';
import { User } from 'firebase/auth';
import { Platform, Share } from 'react-native';

export interface ExportedData {
  exportDate: string;
  userId: string;
  userEmail: string | null;
  moods: MoodLog[];
  journals: JournalEntry[];
  posts: Post[];
  metadata: {
    totalMoods: number;
    totalJournals: number;
    totalPosts: number;
    dateRange: {
      earliest: string | null;
      latest: string | null;
    };
  };
}

export interface ExportedChatData {
  exportDate: string;
  userId: string;
  userEmail: string | null;
  messages: ChatMessage[];
  metadata: {
    totalMessages: number;
    totalUserMessages: number;
    totalAssistantMessages: number;
    dateRange: {
      earliest: string | null;
      latest: string | null;
    };
  };
}

type ExportScope = 'data' | 'chat-history';
type ExportableData = ExportedData | ExportedChatData;
type OptionalModule = Record<string, unknown>;

interface OptionalFileSystemModule {
  cacheDirectory?: string | null;
  writeAsStringAsync?: (fileUri: string, contents: string) => Promise<void>;
}

interface OptionalSharingModule {
  isAvailableAsync?: () => Promise<boolean>;
  shareAsync?: (
    fileUri: string,
    options?: {
      UTI?: string;
      dialogTitle?: string;
      mimeType?: string;
    },
  ) => Promise<void>;
}

/**
 * Data Exporter Service
 */
export class DataExporter {
  private static getExportScope(data: ExportableData): ExportScope {
    return 'messages' in data ? 'chat-history' : 'data';
  }

  private static async loadOptionalModule(
    moduleName: string,
    loader: () => Promise<unknown>,
  ): Promise<OptionalModule | null> {
    try {
      return (await loader()) as OptionalModule;
    } catch (error) {
      logger.debug('Optional export module unavailable', { moduleName, error });
      return null;
    }
  }

  private static async downloadOnWeb(filename: string, contents: string): Promise<boolean> {
    const webUrlApi =
      typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' ? URL : null;

    if (
      Platform.OS !== 'web' ||
      typeof document === 'undefined' ||
      typeof Blob === 'undefined' ||
      !webUrlApi
    ) {
      return false;
    }

    const blob = new Blob([contents], { type: 'application/json;charset=utf-8' });
    const objectUrl = webUrlApi.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = filename;
    link.rel = 'noopener';

    document.body?.appendChild(link);
    link.click();
    document.body?.removeChild(link);

    setTimeout(() => {
      webUrlApi.revokeObjectURL(objectUrl);
    }, 0);

    return true;
  }

  private static async shareNativeFile(filename: string, contents: string): Promise<boolean> {
    const [fileSystemModule, sharingModule] = await Promise.all([
      this.loadOptionalModule('expo-file-system', () => import('expo-file-system')),
      this.loadOptionalModule('expo-sharing', () => import('expo-sharing')),
    ]);

    const fileSystem = fileSystemModule as OptionalFileSystemModule | null;
    const sharing = sharingModule as OptionalSharingModule | null;

    if (
      !fileSystem?.cacheDirectory ||
      !fileSystem.writeAsStringAsync ||
      !sharing?.isAvailableAsync ||
      !sharing.shareAsync
    ) {
      return false;
    }

    if (!(await sharing.isAvailableAsync())) {
      return false;
    }

    const fileUri = `${fileSystem.cacheDirectory}${filename}`;
    await fileSystem.writeAsStringAsync(fileUri, contents);
    await sharing.shareAsync(fileUri, {
      UTI: 'public.json',
      dialogTitle: 'Export data',
      mimeType: 'application/json',
    });

    return true;
  }

  private static async shareAsTextFallback(filename: string, contents: string): Promise<boolean> {
    await Share.share({
      title: filename,
      message: contents,
    });

    return true;
  }

  /**
   * Export all user data
   */
  static async exportUserData(user: User): Promise<ExportedData | null> {
    try {
      // Fetch all user data
      const [moods, journals, posts] = await Promise.all([
        getUserMoodLogs(user, 1000), // Get up to 1000 mood logs
        getUserJournalEntries(user, 1000), // Get up to 1000 journal entries
        getUserPosts(user, 1000), // Get up to 1000 posts
      ]);

      // Calculate metadata
      const allDates = [
        ...moods.map((m) => m.timestamp),
        ...journals.map((j) => j.timestamp),
        ...posts.map((p) => p.createdAt),
      ]
        .filter(Boolean)
        .map((date) => normalizeTimestamp(date))
        .filter((d) => !isNaN(d.getTime()));

      const sortedDates = allDates.sort((a, b) => a.getTime() - b.getTime());

      const exportedData: ExportedData = {
        exportDate: new Date().toISOString(),
        userId: user.uid,
        userEmail: user.email,
        moods,
        journals,
        posts,
        metadata: {
          totalMoods: moods.length,
          totalJournals: journals.length,
          totalPosts: posts.length,
          dateRange: {
            earliest: sortedDates.length > 0 ? sortedDates[0].toISOString() : null,
            latest:
              sortedDates.length > 0 ? sortedDates[sortedDates.length - 1].toISOString() : null,
          },
        },
      };

      return exportedData;
    } catch (error) {
      logger.error('Error exporting user data', error, { userId: user.uid });
      return null;
    }
  }

  /**
   * Export saved AI chat history
   */
  static async exportChatHistory(
    user: User,
    limit: number = 1000,
  ): Promise<ExportedChatData | null> {
    try {
      const messages = await getUserChatMessages(user, limit);

      const messageDates = messages
        .map((message) => message.timestamp)
        .filter(Boolean)
        .map((date) => normalizeTimestamp(date))
        .filter((date) => !isNaN(date.getTime()));

      const sortedDates = messageDates.sort((a, b) => a.getTime() - b.getTime());
      const totalUserMessages = messages.filter((message) => message.role === 'user').length;
      const totalAssistantMessages = messages.filter(
        (message) => message.role === 'assistant',
      ).length;

      return {
        exportDate: new Date().toISOString(),
        userId: user.uid,
        userEmail: user.email,
        messages,
        metadata: {
          totalMessages: messages.length,
          totalUserMessages,
          totalAssistantMessages,
          dateRange: {
            earliest: sortedDates.length > 0 ? sortedDates[0].toISOString() : null,
            latest:
              sortedDates.length > 0 ? sortedDates[sortedDates.length - 1].toISOString() : null,
          },
        },
      };
    } catch (error) {
      logger.error('Error exporting chat history', error, { userId: user.uid });
      return null;
    }
  }

  /**
   * Convert exported data to JSON string
   */
  static toJSON<T>(data: T, pretty: boolean = true): string {
    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  /**
   * Generate filename for export
   */
  static generateFilename(
    userEmail: string | null,
    exportScope: 'data' | 'chat-history' = 'data',
  ): string {
    const date = formatDate(new Date(), 'yyyy-MM-dd');
    const email = userEmail?.split('@')[0] || 'user';
    const prefix =
      exportScope === 'chat-history' ? 'resilienthq-chat-history' : 'resilienthq-export';
    return `${prefix}-${email}-${date}.json`;
  }

  /**
   * Share exported data (platform-specific)
   */
  static async shareData(data: ExportableData): Promise<boolean> {
    try {
      const exportScope = this.getExportScope(data);
      const json = this.toJSON(data);
      const filename = this.generateFilename(data.userEmail, exportScope);

      const shared =
        (await this.downloadOnWeb(filename, json)) ||
        (await this.shareNativeFile(filename, json)) ||
        (await this.shareAsTextFallback(filename, json));

      logger.debug('Export data', {
        filename,
        size: json.length,
        records: data.metadata,
        exportScope,
        shared,
      });

      return shared;
    } catch (error) {
      logger.error('Error sharing data', error);
      return false;
    }
  }
}
