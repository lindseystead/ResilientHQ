/**
 * Community Domain Types
 *
 * Shared model types and domain-specific errors for the community system.
 */

import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

export type { Unsubscribe } from 'firebase/firestore';

export interface Post {
  id?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  category: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isEdited?: boolean;
  flagCount?: number;
  isHidden?: boolean;
}

export interface Comment {
  id?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isEdited?: boolean;
  flagCount?: number;
  isHidden?: boolean;
}

export interface Resource {
  id?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: Date;
}

export interface Event {
  id?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: Date;
}

export interface PaginationOptions {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
}

export interface PaginatedResult<T> {
  items: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export class CommunityError extends Error {
  code: string;
  retryable: boolean;

  constructor(message: string, code: string, retryable: boolean = false) {
    super(message);
    this.code = code;
    this.retryable = retryable;

    // Required for proper instanceof typing in TS
    Object.setPrototypeOf(this, CommunityError.prototype);
  }
}
