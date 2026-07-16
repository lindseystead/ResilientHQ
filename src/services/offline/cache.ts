/**
 * Offline Cache Service
 *
 * Provides offline caching and queue management for data operations.
 * Implements retry logic and fallback queues.
 */

import { OfflineQueueSecureStorageError } from '@/src/services/offline/errors';
import { logger } from '@/src/shared/utils/debug';
import {
  getSecureValueStrict,
  removeSecureValue,
  setSecureValueStrict,
} from '@/src/shared/utils/storage/secureStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_PREFIX = '@resilienthq_cache:';
const QUEUE_PREFIX = '@resilienthq_queue:';
const QUEUE_PAYLOAD_PREFIX = 'queue-payload:';
const QUEUE_MAX_ITEMS = 250;
const QUEUE_ITEM_TTL_MS = 7 * 24 * 60 * 60 * 1000;
let queueIdCounter = 0;

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn?: number; // milliseconds
}

export interface QueueItem {
  id: string;
  action: string;
  payload: unknown;
  timestamp: number;
  retries: number;
  payloadRef?: string;
}

export type QueueProcessorResult = boolean | 'defer';

export interface QueueProcessSummary {
  total: number;
  processed: number;
  failed: number;
  deferred: number;
  removed: number;
  remaining: number;
  wasOnline: boolean;
}

const getQueueStorageKey = (id: string) => `${QUEUE_PREFIX}${id}`;
const toQueuePayloadRef = (id: string) => `${QUEUE_PAYLOAD_PREFIX}${id}`;
const isQueueItemExpired = (item: QueueItem) => Date.now() - item.timestamp > QUEUE_ITEM_TTL_MS;

/**
 * Cache Service
 */
export class CacheService {
  /**
   * Store data in cache
   */
  static async set<T>(key: string, data: T, expiresIn?: number): Promise<void> {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresIn,
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item));
  }

  /**
   * Get data from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const itemString = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!itemString) return null;

      const item: CacheItem<T> = JSON.parse(itemString);

      // Check expiration
      if (item.expiresIn && Date.now() - item.timestamp > item.expiresIn) {
        await this.remove(key);
        return null;
      }

      return item.data;
    } catch (error) {
      logger.error('Cache get error', error, { key });
      return null;
    }
  }

  /**
   * Remove item from cache
   */
  static async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  }

  /**
   * Clear all cache
   */
  static async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  }

  /**
   * Add item to offline queue
   */
  static async addToQueue(action: string, payload: unknown): Promise<string> {
    const id = `queue-${Date.now()}-${queueIdCounter++}`;
    const payloadRef = toQueuePayloadRef(id);
    const serialized = JSON.stringify(payload ?? null);
    const write = await setSecureValueStrict(payloadRef, serialized);
    if (!write.ok) {
      throw new OfflineQueueSecureStorageError(write.reason, write.byteLength);
    }

    const item: QueueItem = {
      id,
      action,
      payload: null,
      timestamp: Date.now(),
      retries: 0,
      payloadRef,
    };
    await AsyncStorage.setItem(getQueueStorageKey(id), JSON.stringify(item));

    // Keep queue bounded to avoid indefinite local retention.
    const queue = await this.getQueue();
    if (queue.length > QUEUE_MAX_ITEMS) {
      const overflow = queue.length - QUEUE_MAX_ITEMS;
      const staleItems = [...queue].sort((a, b) => a.timestamp - b.timestamp).slice(0, overflow);
      await Promise.all(staleItems.map((queueItem) => this.removeFromQueue(queueItem.id)));
    }

    return id;
  }

  /**
   * Get all queued items
   */
  static async getQueue(): Promise<QueueItem[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const queueKeys = keys.filter((key) => key.startsWith(QUEUE_PREFIX));
      const entries = await AsyncStorage.multiGet(queueKeys);
      const queueItems: QueueItem[] = [];

      for (const [storageKey, value] of entries) {
        if (!value) {
          continue;
        }

        let item: QueueItem;

        try {
          item = JSON.parse(value) as QueueItem;
        } catch {
          await AsyncStorage.removeItem(storageKey);
          continue;
        }

        if (!item.id || !item.action || typeof item.timestamp !== 'number') {
          await AsyncStorage.removeItem(storageKey);
          continue;
        }

        if (isQueueItemExpired(item)) {
          await this.removeFromQueue(item.id);
          continue;
        }

        if (item.payloadRef) {
          try {
            const securePayload = await getSecureValueStrict(item.payloadRef);
            item.payload = securePayload === null ? null : JSON.parse(securePayload);
          } catch {
            item.payload = null;
          }
        }

        queueItems.push(item);
      }

      return queueItems;
    } catch (error) {
      logger.error('Queue get error', error);
      return [];
    }
  }

  /**
   * Remove item from queue
   */
  static async removeFromQueue(id: string): Promise<void> {
    const storageKey = getQueueStorageKey(id);
    const raw = await AsyncStorage.getItem(storageKey);

    if (raw) {
      try {
        const item = JSON.parse(raw) as QueueItem;
        if (item.payloadRef) {
          await removeSecureValue(item.payloadRef);
        }
      } catch {
        await removeSecureValue(toQueuePayloadRef(id));
      }
    } else {
      await removeSecureValue(toQueuePayloadRef(id));
    }

    await AsyncStorage.removeItem(storageKey);
  }

  /**
   * Check if device is online
   */
  static async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  /**
   * Process offline queue when online
   */
  static async processQueue(
    processor: (item: QueueItem) => Promise<QueueProcessorResult>,
  ): Promise<QueueProcessSummary> {
    const queue = await this.getQueue();
    const isOnline = await this.isOnline();
    if (!isOnline) {
      return {
        total: queue.length,
        processed: 0,
        failed: 0,
        deferred: queue.length,
        removed: 0,
        remaining: queue.length,
        wasOnline: false,
      };
    }

    let processed = 0;
    let failed = 0;
    let deferred = 0;
    let removed = 0;

    const persistRetry = async (item: QueueItem): Promise<void> => {
      const itemToPersist: QueueItem = {
        ...item,
        payload: null,
        payloadRef: item.payloadRef || toQueuePayloadRef(item.id),
      };
      await AsyncStorage.setItem(getQueueStorageKey(item.id), JSON.stringify(itemToPersist));
    };

    for (const item of queue) {
      try {
        const result = await processor(item);
        if (result === true) {
          await this.removeFromQueue(item.id);
          processed += 1;
          continue;
        }

        if (result === 'defer') {
          deferred += 1;
          continue;
        }

        item.retries += 1;
        failed += 1;
        if (item.retries < 3) {
          await persistRetry(item);
        } else {
          await this.removeFromQueue(item.id);
          removed += 1;
        }
      } catch (error) {
        item.retries += 1;
        failed += 1;

        if (item.retries < 3) {
          try {
            await persistRetry(item);
          } catch (persistError) {
            logger.error('Queue retry persistence error', persistError, {
              itemId: item.id,
              action: item.action,
            });
          }
        } else {
          await this.removeFromQueue(item.id);
          removed += 1;
        }

        logger.error('Queue processing error', error, { itemId: item.id, action: item.action });
      }
    }

    const remaining = (await this.getQueue()).length;
    return {
      total: queue.length,
      processed,
      failed,
      deferred,
      removed,
      remaining,
      wasOnline: true,
    };
  }
}
