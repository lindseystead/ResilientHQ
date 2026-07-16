/**
 * Community Domain Shared Helpers
 *
 * Shared infrastructure helpers for Firestore access, retries, and model mapping.
 */

import { db } from '@/src/config/firebase.config';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import type { User } from 'firebase/auth';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { CommunityError, type Comment, type Event, type Post, type Resource } from './types';

const DEFAULT_AVATAR = '';

export const DEFAULT_PAGE_SIZE = 20;

export const getCommunityDb = () => {
  if (!db) {
    throw new CommunityError('Firestore not initialized', 'NO_DB');
  }

  return db;
};

export const getUserProfile = (user: User | null) => ({
  authorName: user?.displayName || user?.email?.split('@')[0] || 'Anonymous',
  authorAvatar: user?.photoURL || DEFAULT_AVATAR,
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const retry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  try {
    return await fn();
  } catch (err: unknown) {
    if (retries <= 0) {
      throw err;
    }

    // Jitter avoids synchronized retries across clients.
    const jitter = Math.random() * 200;
    await wait(500 * Math.pow(2, 3 - retries) + jitter);

    return retry(fn, retries - 1);
  }
};

export const mapPost = (snapshot: QueryDocumentSnapshot<DocumentData>): Post => {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    authorId: data.authorId,
    authorName: data.authorName,
    authorAvatar: data.authorAvatar,
    category: data.category,
    content: data.content,
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: data.updatedAt ? normalizeTimestamp(data.updatedAt) : undefined,
    isEdited: data.isEdited === true,
    flagCount: typeof data.flagCount === 'number' ? data.flagCount : 0,
    isHidden: data.isHidden === true,
  };
};

export const mapComment = (snapshot: QueryDocumentSnapshot<DocumentData>): Comment => {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    authorId: data.authorId,
    authorName: data.authorName,
    authorAvatar: data.authorAvatar,
    content: data.content,
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: data.updatedAt ? normalizeTimestamp(data.updatedAt) : undefined,
    isEdited: data.isEdited === true,
    flagCount: typeof data.flagCount === 'number' ? data.flagCount : 0,
    isHidden: data.isHidden === true,
  };
};

export const mapResource = (snapshot: QueryDocumentSnapshot<DocumentData>): Resource => {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    authorId: data.authorId,
    authorName: data.authorName,
    authorAvatar: data.authorAvatar,
    content: data.content,
    createdAt: normalizeTimestamp(data.createdAt),
  };
};

export const mapEvent = (snapshot: QueryDocumentSnapshot<DocumentData>): Event => {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    authorId: data.authorId,
    authorName: data.authorName,
    authorAvatar: data.authorAvatar,
    content: data.content,
    createdAt: normalizeTimestamp(data.createdAt),
  };
};
