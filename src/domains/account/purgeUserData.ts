/**
 * Account Data Purge
 *
 * Deletes all of a user's private Firestore data. This MUST run while the user
 * is still authenticated (the security rules require request.auth.uid == userId),
 * so it is invoked immediately before deleting the Firebase Auth account.
 */

import { db } from '@/src/config/firebase.config';
import { logger } from '@/src/shared/utils/debug';
import { User } from 'firebase/auth';
import { collection, getDocs, writeBatch } from 'firebase/firestore';

const DELETE_BATCH_SIZE = 400;

// Owner-scoped private subcollections, as defined in firestore.rules.
const USER_SUBCOLLECTIONS: readonly (readonly [string, string])[] = [
  ['chats', 'messages'],
  ['journals', 'entries'],
  ['moods', 'logs'],
  ['resilienceCheckIns', 'entries'],
];

const deleteSubcollection = async (parent: string, uid: string, child: string): Promise<number> => {
  if (!db) return 0;

  const ref = collection(db, parent, uid, child);
  const snapshot = await getDocs(ref);

  if (snapshot.empty) {
    return 0;
  }

  for (let index = 0; index < snapshot.docs.length; index += DELETE_BATCH_SIZE) {
    const batch = writeBatch(db);
    snapshot.docs.slice(index, index + DELETE_BATCH_SIZE).forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }

  return snapshot.docs.length;
};

export interface PurgeUserDataResult {
  deletedCounts: Record<string, number>;
  totalDeleted: number;
}

/**
 * Deletes every private collection owned by the user (chats, journals, moods,
 * resilience check-ins). Throws if any deletion fails, so the caller can abort
 * the account deletion rather than orphan the data.
 */
export const purgeAllUserData = async (user: User): Promise<PurgeUserDataResult> => {
  if (!db || !user) {
    return { deletedCounts: {}, totalDeleted: 0 };
  }

  const deletedCounts: Record<string, number> = {};
  let totalDeleted = 0;

  for (const [parent, child] of USER_SUBCOLLECTIONS) {
    const count = await deleteSubcollection(parent, user.uid, child);
    deletedCounts[parent] = count;
    totalDeleted += count;
  }

  logger.info('Purged user data before account deletion', { totalDeleted });
  return { deletedCounts, totalDeleted };
};
