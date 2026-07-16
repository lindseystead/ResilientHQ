/**
 * Journal Service
 *
 * Backwards-compatible export of the wellbeing domain journal service.
 */

export type { JournalEntry } from '@/src/domains/wellbeing/journal';
export {
  deleteJournalEntry,
  getUserJournalEntries,
  saveJournalEntry,
  updateJournalEntry,
} from '@/src/domains/wellbeing/journal';
