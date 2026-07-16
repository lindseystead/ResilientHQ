/**
 * AI Safety Identifier
 *
 * Generates a stable, non-PII identifier suitable for safety monitoring on the
 * AI provider side.
 */

import type { User } from 'firebase/auth';

const fnv1aHash = (value: string): string => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16);
};

export const createSafetyIdentifier = (seed: string): string => `uid_${fnv1aHash(seed)}`;

export const createUserSafetyIdentifier = (user: User | null): string | undefined => {
  if (!user?.uid) {
    return undefined;
  }

  return createSafetyIdentifier(user.uid);
};
