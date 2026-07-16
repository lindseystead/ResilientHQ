/**
 * Rate Limiter Utility
 *
 * Client-side rate limiting for AI service calls to prevent 429 errors.
 * Queues requests rather than dropping them, ensuring max 1 request per 1500ms.
 */

interface QueuedRequest<T> {
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
  fn: () => Promise<T>;
}

/**
 * Creates a rate limiter that ensures max 1 request per specified interval
 * @param intervalMs Minimum time between requests in milliseconds
 * @returns Rate limiter function
 */
export const createRateLimiter = (intervalMs: number = 1500) => {
  let lastRequestTime = 0;
  const queue: QueuedRequest<unknown>[] = [];
  let processing = false;

  const processQueue = async () => {
    if (processing || queue.length === 0) return;

    processing = true;

    while (queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;

      // Wait if needed to respect rate limit
      if (timeSinceLastRequest < intervalMs) {
        const waitTime = intervalMs - timeSinceLastRequest;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      const request = queue.shift();
      if (!request) break;

      lastRequestTime = Date.now();

      try {
        const result = await request.fn();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    }

    processing = false;
  };

  return <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      queue.push({
        resolve: resolve as (value: unknown) => void,
        reject,
        fn,
      });
      processQueue();
    });
  };
};

/**
 * Global rate limiter for AI service calls
 * Max 1 request every 1500ms (1.5 seconds)
 */
export const rateLimit = createRateLimiter(1500);
