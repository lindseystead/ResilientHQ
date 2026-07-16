/**
 * Normalizes any Firestore timestamp or JS Date into a Date.
 */
type FirestoreTimestamp = {
  toDate: () => Date;
};

export const normalizeTimestamp = (ts: unknown): Date => {
  if (!ts) return new Date();

  if (ts instanceof Date) return ts;

  if (typeof ts === 'object' && ts !== null && 'toDate' in ts) {
    try {
      return (ts as FirestoreTimestamp).toDate();
    } catch {
      return new Date();
    }
  }

  // Try to parse as number (milliseconds since epoch)
  if (typeof ts === 'number' && !isNaN(ts)) {
    return new Date(ts);
  }

  // Try to parse as string
  if (typeof ts === 'string') {
    const parsed = new Date(ts);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
};
