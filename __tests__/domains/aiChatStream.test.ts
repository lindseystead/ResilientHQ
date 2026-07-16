import { streamChatCompletion } from '@/src/domains/ai/chat';

jest.mock('@/src/config/api.config', () => ({
  buildUrl: (endpoint: string) => `https://api.test${endpoint}`,
  openaiConfig: {
    endpoints: {
      aiChatStream: '/ai/chat/stream',
    },
    models: {
      chat: 'gpt-4o-mini',
    },
  },
}));

jest.mock('@/src/config/firebase.config', () => ({
  auth: null,
  db: null,
}));

jest.mock('@/src/shared/utils/debug', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('streamChatCompletion', () => {
  const originalFetch = global.fetch;

  const createStreamResponse = (payload: string | string[]) => ({
    ok: true,
    status: 200,
    body: {
      getReader: () => {
        const chunks = Array.isArray(payload) ? payload : [payload];
        let index = 0;

        return {
          read: jest.fn().mockImplementation(async () => {
            if (index >= chunks.length) {
              return { done: true, value: undefined };
            }

            const nextChunk = chunks[index];
            index += 1;

            return {
              done: false,
              value: new TextEncoder().encode(nextChunk),
            };
          }),
        };
      },
    },
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('handles meta and done events without duplicating the final message', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        createStreamResponse(
          [
            'data: {"type":"meta","safety":{"level":"sensitive","blocked":false,"shouldEscalate":false,"reasonCodes":["pii-redacted"],"redactedTypes":["email"]}}',
            'data: {"content":"Hello there"}',
            'data: {"type":"done","content":"Hello there","safety":{"level":"sensitive","blocked":false,"shouldEscalate":false,"reasonCodes":["pii-redacted"],"redactedTypes":["email"]}}',
            'data: [DONE]',
          ].join('\n\n'),
        ),
      ) as jest.Mock;

    const onToken = jest.fn();
    const onMeta = jest.fn();
    const onMessageComplete = jest.fn();

    const result = await streamChatCompletion(
      [{ role: 'user', content: 'Hi' }],
      {
        onToken,
        onMeta,
        onMessageComplete,
      },
      { safetyIdentifier: 'uid_123' },
    );

    expect(global.fetch).toHaveBeenCalled();
    expect(onToken).toHaveBeenCalledTimes(1);
    expect(onToken).toHaveBeenCalledWith('Hello there');
    expect(onMeta).toHaveBeenCalledTimes(2);
    expect(onMessageComplete).toHaveBeenCalledTimes(1);
    expect(onMessageComplete).toHaveBeenCalledWith('Hello there');
    expect(result).toBe('Hello there');
  });

  it('surfaces streamed error events once', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        createStreamResponse(
          [
            'data: {"type":"error","error":"Proxy rejected the request.","safety":{"level":"blocked","blocked":true,"shouldEscalate":false,"reasonCodes":["policy"],"redactedTypes":[]}}',
            'data: [DONE]',
          ].join('\n\n'),
        ),
      ) as jest.Mock;

    const onError = jest.fn();
    const onMeta = jest.fn();

    await expect(
      streamChatCompletion([{ role: 'user', content: 'Hi' }], {
        onToken: jest.fn(),
        onError,
        onMeta,
      }),
    ).rejects.toThrow('Proxy rejected the request.');

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onMeta).toHaveBeenCalledTimes(1);
  });

  it('parses SSE events split across transport chunks', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        createStreamResponse([
          'data: {"content":"Hello',
          ' there"}\n\ndata: {"type":"done","content":"Hello there"}\n\ndata: [DONE]\n\n',
        ]),
      ) as jest.Mock;

    const onToken = jest.fn();
    const onMessageComplete = jest.fn();

    const result = await streamChatCompletion(
      [{ role: 'user', content: 'Hi' }],
      {
        onToken,
        onMessageComplete,
      },
      { safetyIdentifier: 'uid_fragmented' },
    );

    expect(onToken).toHaveBeenCalledTimes(1);
    expect(onToken).toHaveBeenCalledWith('Hello there');
    expect(onMessageComplete).toHaveBeenCalledTimes(1);
    expect(onMessageComplete).toHaveBeenCalledWith('Hello there');
    expect(result).toBe('Hello there');
  });

  it('forwards abort signals to fetch for stream cancellation', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        createStreamResponse('data: {"type":"done","content":"ok"}\n\ndata: [DONE]'),
      ) as jest.Mock;

    const abortController = new AbortController();

    await streamChatCompletion(
      [{ role: 'user', content: 'Hi' }],
      {
        onToken: jest.fn(),
      },
      {
        safetyIdentifier: 'uid_abort',
        signal: abortController.signal,
      },
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: abortController.signal,
      }),
    );
  });

  it('treats AbortError as a controlled cancellation', async () => {
    const abortError =
      typeof DOMException === 'function'
        ? new DOMException('The operation was aborted.', 'AbortError')
        : Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' });

    global.fetch = jest.fn().mockRejectedValue(abortError) as jest.Mock;

    const onError = jest.fn();
    const abortController = new AbortController();
    abortController.abort();

    await expect(
      streamChatCompletion(
        [{ role: 'user', content: 'Hi' }],
        {
          onToken: jest.fn(),
          onError,
        },
        {
          safetyIdentifier: 'uid_abort_error',
          signal: abortController.signal,
        },
      ),
    ).resolves.toBeUndefined();

    expect(onError).not.toHaveBeenCalled();
  });
});
