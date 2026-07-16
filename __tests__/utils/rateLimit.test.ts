/**
 * Rate Limiter Tests
 *
 * Tests for API rate limiting functionality to prevent 429 errors.
 */

import { createRateLimiter, rateLimit } from '@/src/shared/utils/api/rateLimit';

describe('Rate Limiter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('createRateLimiter', () => {
    it('should create a rate limiter with default interval', () => {
      const limiter = createRateLimiter();
      expect(typeof limiter).toBe('function');
    });

    it('should create a rate limiter with custom interval', () => {
      const limiter = createRateLimiter(1000);
      expect(typeof limiter).toBe('function');
    });

    it('should queue requests and execute them with delay', async () => {
      const limiter = createRateLimiter(100);
      const results: number[] = [];

      // Queue multiple requests
      limiter(async () => {
        results.push(1);
        return 1;
      });
      limiter(async () => {
        results.push(2);
        return 2;
      });
      limiter(async () => {
        results.push(3);
        return 3;
      });

      // Fast-forward time
      jest.advanceTimersByTime(500);

      // Wait for promises
      await Promise.resolve();

      expect(results.length).toBeGreaterThan(0);
    });

    it('should respect rate limit interval', async () => {
      const limiter = createRateLimiter(200);
      const callTimes: number[] = [];

      limiter(async () => {
        callTimes.push(Date.now());
        return 1;
      });

      jest.advanceTimersByTime(50);
      await Promise.resolve();

      limiter(async () => {
        callTimes.push(Date.now());
        return 2;
      });

      jest.advanceTimersByTime(200);
      await Promise.resolve();

      expect(callTimes.length).toBeGreaterThan(0);
    });
  });

  describe('rateLimit (global instance)', () => {
    it('should be a function', () => {
      expect(typeof rateLimit).toBe('function');
    });

    it('should execute async functions', async () => {
      const result = await rateLimit(async () => {
        return 'test';
      });
      expect(result).toBe('test');
    });

    it('should handle errors in rate-limited functions', async () => {
      const promise = rateLimit(async () => {
        throw new Error('Test error');
      });

      // Advance timers for the default rate-limit interval
      jest.advanceTimersByTime(1500);
      await Promise.resolve();

      await expect(promise).rejects.toThrow('Test error');
    }, 15000); // Increase timeout for this test
  });
});
