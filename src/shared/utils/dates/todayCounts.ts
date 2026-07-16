/**
 * Today Counts Utility
 *
 * Fetches today's mood log and journal entry counts for a given user.
 */

import { getUserJournalEntries, getUserMoodLogs } from '@/src/domains/wellbeing';
import { getTodayCount } from '@/src/shared/utils/dates/getTodayCount';
import { logger } from '@/src/shared/utils/debug';
import { User } from 'firebase/auth';

export const getTodayMoodLogsCount = async (user: User): Promise<number> => {
  try {
    const logs = await getUserMoodLogs(user, 100);
    return getTodayCount(logs, (log) => log.timestamp);
  } catch (error) {
    logger.error('Error getting today mood logs count', error);
    return 0;
  }
};

export const getTodayJournalEntriesCount = async (user: User): Promise<number> => {
  try {
    const entries = await getUserJournalEntries(user, 100);
    return getTodayCount(entries, (entry) => entry.timestamp);
  } catch (error) {
    logger.error('Error getting today journal entries count', error);
    return 0;
  }
};
