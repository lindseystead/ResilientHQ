/**
 * Community Content Services
 *
 * Resource and event publishing plus real-time subscriptions.
 */

import type { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { CommunityError, type Event, type Resource, type Unsubscribe } from './types';
import {
  DEFAULT_PAGE_SIZE,
  getCommunityDb,
  getUserProfile,
  mapEvent,
  mapResource,
  retry,
} from './shared';

export const createResource = async (user: User, content: string): Promise<string> => {
  if (!user) {
    throw new CommunityError('Must be logged in', 'UNAUTHENTICATED');
  }
  if (!content.trim()) {
    throw new CommunityError('Resource content cannot be empty', 'VALIDATION_ERROR');
  }

  return retry(async () => {
    const communityDb = getCommunityDb();
    const { authorName, authorAvatar } = getUserProfile(user);

    const resource = {
      authorId: user.uid,
      authorName,
      authorAvatar,
      content: content.trim(),
      createdAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(communityDb, 'resources'), resource);
    return ref.id;
  });
};

export const subscribeToResources = (
  callback: (resources: Resource[]) => void,
  onError?: (err: CommunityError) => void,
): Unsubscribe => {
  try {
    const communityDb = getCommunityDb();
    const resourcesQuery = query(
      collection(communityDb, 'resources'),
      orderBy('createdAt', 'desc'),
      limit(DEFAULT_PAGE_SIZE),
    );

    return onSnapshot(
      resourcesQuery,
      (snapshot) => {
        callback(snapshot.docs.map(mapResource));
      },
      (err) => {
        const error = new CommunityError(
          err.message || 'Failed to subscribe to resources',
          err.code || 'UNKNOWN',
          err.code === 'unavailable',
        );
        onError?.(error) ?? callback([]);
      },
    );
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to set up resources subscription';
    const error = new CommunityError(errorMessage, 'SETUP_ERROR');
    onError?.(error);
    return () => {};
  }
};

export const createEvent = async (user: User, content: string): Promise<string> => {
  if (!user) {
    throw new CommunityError('Must be logged in', 'UNAUTHENTICATED');
  }
  if (!content.trim()) {
    throw new CommunityError('Event content cannot be empty', 'VALIDATION_ERROR');
  }

  return retry(async () => {
    const communityDb = getCommunityDb();
    const { authorName, authorAvatar } = getUserProfile(user);

    const event = {
      authorId: user.uid,
      authorName,
      authorAvatar,
      content: content.trim(),
      createdAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(communityDb, 'events'), event);
    return ref.id;
  });
};

export const subscribeToEvents = (
  callback: (events: Event[]) => void,
  onError?: (err: CommunityError) => void,
): Unsubscribe => {
  try {
    const communityDb = getCommunityDb();
    const eventsQuery = query(
      collection(communityDb, 'events'),
      orderBy('createdAt', 'desc'),
      limit(DEFAULT_PAGE_SIZE),
    );

    return onSnapshot(
      eventsQuery,
      (snapshot) => {
        callback(snapshot.docs.map(mapEvent));
      },
      (err) => {
        const error = new CommunityError(
          err.message || 'Failed to subscribe to events',
          err.code || 'UNKNOWN',
          err.code === 'unavailable',
        );
        onError?.(error) ?? callback([]);
      },
    );
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to set up events subscription';
    const error = new CommunityError(errorMessage, 'SETUP_ERROR');
    onError?.(error);
    return () => {};
  }
};
