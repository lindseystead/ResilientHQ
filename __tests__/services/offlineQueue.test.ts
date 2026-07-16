import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { CacheService } from '@/src/services/offline/cache';

const mockSecureMap = new Map<string, string>();

jest.mock('@/src/shared/utils/storage/secureStore', () => ({
  setSecureValueStrict: jest.fn(async (key: string, value: string) => {
    mockSecureMap.set(key, value);
    return { ok: true as const };
  }),
  getSecureValueStrict: jest.fn(async (key: string) => mockSecureMap.get(key) ?? null),
  removeSecureValue: jest.fn(async (key: string) => {
    mockSecureMap.delete(key);
  }),
}));

describe('CacheService.processQueue', () => {
  const mockedFetch = NetInfo.fetch as jest.MockedFunction<typeof NetInfo.fetch>;

  beforeEach(async () => {
    mockSecureMap.clear();
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockedFetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    } as Awaited<ReturnType<typeof NetInfo.fetch>>);
  });

  it('processes successful items and returns summary details', async () => {
    await CacheService.addToQueue('test-action-1', { id: 1 });
    await CacheService.addToQueue('test-action-2', { id: 2 });

    const processor = jest.fn(async () => true);
    const summary = await CacheService.processQueue(processor);

    expect(processor).toHaveBeenCalledTimes(2);
    expect(summary).toMatchObject({
      total: 2,
      processed: 2,
      failed: 0,
      deferred: 0,
      removed: 0,
      remaining: 0,
      wasOnline: true,
    });
    expect(await CacheService.getQueue()).toHaveLength(0);
  });

  it('keeps deferred items in queue without consuming retries', async () => {
    const queueId = await CacheService.addToQueue('test-defer-action', { id: 1 });

    const summary = await CacheService.processQueue(async () => 'defer');
    const queue = await CacheService.getQueue();

    expect(summary).toMatchObject({
      total: 1,
      processed: 0,
      failed: 0,
      deferred: 1,
      removed: 0,
      remaining: 1,
      wasOnline: true,
    });
    expect(queue).toHaveLength(1);
    expect(queue[0]?.id).toBe(queueId);
    expect(queue[0]?.retries).toBe(0);
  });

  it('increments retries and removes item after max attempts', async () => {
    await CacheService.addToQueue('test-fail-action', { id: 1 });

    const first = await CacheService.processQueue(async () => false);
    const second = await CacheService.processQueue(async () => false);
    const third = await CacheService.processQueue(async () => false);
    const queue = await CacheService.getQueue();

    expect(first.failed).toBe(1);
    expect(second.failed).toBe(1);
    expect(third.removed).toBe(1);
    expect(queue).toHaveLength(0);
  });

  it('skips queue processing when offline', async () => {
    await CacheService.addToQueue('test-offline-action', { id: 1 });
    mockedFetch.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
    } as Awaited<ReturnType<typeof NetInfo.fetch>>);

    const processor = jest.fn(async () => true);
    const summary = await CacheService.processQueue(processor);

    expect(processor).not.toHaveBeenCalled();
    expect(summary).toMatchObject({
      total: 1,
      processed: 0,
      failed: 0,
      deferred: 1,
      removed: 0,
      remaining: 1,
      wasOnline: false,
    });
    expect(await CacheService.getQueue()).toHaveLength(1);
  });
});
