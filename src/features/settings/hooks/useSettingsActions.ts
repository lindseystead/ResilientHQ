import { TEXT } from '@/src/config/text';
import { purgeAllUserData } from '@/src/domains/account/purgeUserData';
import { deleteChatHistory } from '@/src/domains/ai';
import { CacheService } from '@/src/services/offline/cache';
import { processOfflineQueueItem } from '@/src/services/offline/queueProcessor';
import { DataExporter } from '@/src/shared/utils/data/exporter';
import { logger } from '@/src/shared/utils/debug';
import { ErrorHandlerOptions } from '@/src/shared/hooks/useErrorHandler';
import { HapticNotification, HapticStyle } from '@/src/shared/hooks/haptics/useHaptics';
import { UserPreferencesStorage } from '@/src/shared/utils/storage/userPreferences';
import { User } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

interface UseSettingsActionsOptions {
  user: User | null;
  signOut: () => Promise<void>;
  handleError: (error: unknown, options?: ErrorHandlerOptions) => string;
  impact: (style?: HapticStyle) => Promise<void>;
  notification: (type: HapticNotification) => Promise<void>;
}

interface UseSettingsActionsReturn {
  isExporting: boolean;
  isExportingChat: boolean;
  isClearingChatHistory: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  handleExportData: () => void;
  handleDeleteAccount: () => void;
  handleExportChatHistory: () => void;
  handleClearChatHistory: () => void;
  handleClearCache: () => void;
  handleClearQueue: () => void;
  handleForceSync: () => Promise<void>;
  handleLogout: () => void;
}

export const useSettingsActions = ({
  user,
  signOut,
  handleError,
  impact,
  notification,
}: UseSettingsActionsOptions): UseSettingsActionsReturn => {
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingChat, setIsExportingChat] = useState(false);
  const [isClearingChatHistory, setIsClearingChatHistory] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    const loadLastSyncTime = async () => {
      const time = await UserPreferencesStorage.getPreference<number>('lastSyncTime');
      if (time) {
        setLastSyncTime(new Date(time));
      }
    };

    void loadLastSyncTime();
  }, []);

  const handleExportData = useCallback(() => {
    if (!user) {
      handleError(new Error('You must be logged in to export data.'), {
        alertTitle: 'Error',
        context: 'Data export',
      });
      return;
    }

    Alert.alert('Export Data', 'This will export all your moods, journals, and posts. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Export',
        onPress: async () => {
          setIsExporting(true);
          try {
            const data = await DataExporter.exportUserData(user);
            if (!data) {
              handleError(new Error('Failed to export data.'), {
                context: 'Data export',
              });
              return;
            }

            const shared = await DataExporter.shareData(data);
            if (!shared) {
              handleError(new Error('Unable to share your export right now.'), {
                context: 'Data export share',
              });
              return;
            }

            await notification('success');
            logger.debug('User data export shared', { records: data.metadata });
          } catch (error) {
            handleError(error, { context: 'Data export' });
          } finally {
            setIsExporting(false);
          }
        },
      },
    ]);
  }, [handleError, notification, user]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and your personal data — mood logs, journal entries, check-ins, and chat history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user) {
              return;
            }

            try {
              // Delete the user's private Firestore data first — this must happen
              // while still authenticated, since the security rules require the
              // matching uid. Only then remove the auth account.
              await purgeAllUserData(user);
              await user.delete();
              await notification('success');
            } catch (error: unknown) {
              const authError = error as { code?: string };
              if (authError?.code === 'auth/requires-recent-login') {
                Alert.alert(
                  'Re-authentication Required',
                  'For security, please sign out and sign back in, then try deleting your account again.',
                );
                return;
              }

              handleError(error, { context: 'Deleting account' });
            }
          },
        },
      ],
    );
  }, [handleError, notification, user]);

  const handleExportChatHistory = useCallback(() => {
    if (!user) {
      handleError(new Error('You must be logged in to export chat history.'), {
        alertTitle: 'Error',
        context: 'Chat history export',
      });
      return;
    }

    Alert.alert(
      'Export Saved Chat History',
      'This will export the AI conversations saved while chat memory was enabled. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setIsExportingChat(true);
            try {
              const data = await DataExporter.exportChatHistory(user);
              if (!data) {
                handleError(new Error('Failed to export chat history.'), {
                  context: 'Chat history export',
                });
                return;
              }

              const shared = await DataExporter.shareData(data);
              if (!shared) {
                handleError(new Error('Unable to share chat history right now.'), {
                  context: 'Chat history export share',
                });
                return;
              }

              await notification('success');
              logger.debug('Exported chat history', { records: data.metadata });
            } catch (error) {
              handleError(error, { context: 'Chat history export' });
            } finally {
              setIsExportingChat(false);
            }
          },
        },
      ],
    );
  }, [handleError, notification, user]);

  const handleClearChatHistory = useCallback(() => {
    if (!user) {
      handleError(new Error('You must be logged in to clear chat history.'), {
        alertTitle: 'Error',
        context: 'Clearing chat history',
      });
      return;
    }

    Alert.alert(
      'Clear Saved Chat History',
      'This permanently deletes saved AI conversation history from your account. It does not remove journals, mood logs, or other data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: async () => {
            setIsClearingChatHistory(true);
            try {
              const deletedCount = await deleteChatHistory(user);

              if (deletedCount > 0) {
                await notification('success');
              }

              Alert.alert(
                deletedCount > 0 ? 'Chat History Cleared' : 'Nothing to Clear',
                deletedCount > 0
                  ? `Removed ${deletedCount} saved message${deletedCount === 1 ? '' : 's'}.`
                  : 'No saved chat messages were found.',
              );
            } catch (error) {
              handleError(error, { context: 'Clearing chat history' });
            } finally {
              setIsClearingChatHistory(false);
            }
          },
        },
      ],
    );
  }, [handleError, notification, user]);

  const handleClearCache = useCallback(() => {
    Alert.alert('Clear Cache', 'This will clear all cached data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: async () => {
          await CacheService.clear();
          Alert.alert('Success', 'Cache cleared.');
        },
      },
    ]);
  }, []);

  const handleClearQueue = useCallback(() => {
    Alert.alert(
      'Clear Offline Queue',
      'This will clear all pending offline operations. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            const queue = await CacheService.getQueue();
            for (const item of queue) {
              await CacheService.removeFromQueue(item.id);
            }
            Alert.alert('Success', 'Offline queue cleared.');
          },
        },
      ],
    );
  }, []);

  const handleForceSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const summary = await CacheService.processQueue(async (item) => {
        logger.debug('Processing queue item', { itemId: item.id, action: item.action });
        return processOfflineQueueItem(item, user);
      });

      if (!summary.wasOnline) {
        Alert.alert('Offline', 'Sync requires an internet connection. Please try again online.');
        return;
      }

      await UserPreferencesStorage.setPreference('lastSyncTime', Date.now());
      setLastSyncTime(new Date());

      if (summary.total === 0) {
        Alert.alert('Up to Date', 'No pending offline changes were found.');
        return;
      }

      if (summary.deferred > 0 && summary.failed === 0 && summary.processed === 0) {
        Alert.alert(
          'Sync Deferred',
          `${summary.deferred} queued item${summary.deferred === 1 ? '' : 's'} are waiting for the matching account.`,
        );
        return;
      }

      if (summary.failed > 0 || summary.remaining > 0) {
        Alert.alert(
          'Sync Partially Complete',
          `Processed ${summary.processed}/${summary.total} items. ${summary.remaining} item${summary.remaining === 1 ? '' : 's'} remain queued.`,
        );
        return;
      }

      Alert.alert('Success', `Sync completed. ${summary.processed} item(s) processed.`);
    } catch (error) {
      handleError(error, { context: 'Force sync' });
    } finally {
      setIsSyncing(false);
    }
  }, [handleError, user]);

  const handleLogout = useCallback(() => {
    void impact('medium');
    Alert.alert(
      TEXT.signOut,
      'Are you sure you want to log out?',
      [
        { text: TEXT.cancel, style: 'cancel' },
        {
          text: TEXT.signOut,
          style: 'destructive',
          onPress: async () => {
            try {
              await notification('success');
              await signOut();
            } catch (error) {
              handleError(error, { context: 'Logout attempt' });
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [handleError, impact, notification, signOut]);

  return {
    isExporting,
    isExportingChat,
    isClearingChatHistory,
    isSyncing,
    lastSyncTime,
    handleExportData,
    handleDeleteAccount,
    handleExportChatHistory,
    handleClearChatHistory,
    handleClearCache,
    handleClearQueue,
    handleForceSync,
    handleLogout,
  };
};
