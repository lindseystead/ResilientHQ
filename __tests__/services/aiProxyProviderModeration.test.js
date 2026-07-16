const { callOpenAIModeration } = require('../../server/ai-proxy/provider');

describe('AI proxy provider moderation', () => {
  const originalFetch = global.fetch;
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.OPENAI_API_KEY = originalApiKey;
    jest.clearAllMocks();
  });

  it('normalizes moderation category flags from OpenAI responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'modr_123',
        model: 'omni-moderation-latest',
        results: [
          {
            flagged: true,
            categories: {
              'self-harm': true,
              violence: false,
            },
          },
        ],
      }),
    });

    const result = await callOpenAIModeration('test content');

    expect(result.flagged).toBe(true);
    expect(result.categories['self-harm']).toBe(true);
    expect(result.categories.violence).toBe(false);
  });

  it('throws a readable error when moderation endpoint returns non-2xx', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({
        error: {
          message: 'Rate limited by moderation endpoint.',
        },
      }),
    });

    await expect(callOpenAIModeration('test content')).rejects.toThrow(
      'Rate limited by moderation endpoint.',
    );
  });
});
