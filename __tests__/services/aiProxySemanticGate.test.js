const { buildSafetyResult, createSemanticModerationGate } = require('../../server/ai-proxy');

describe('AI proxy semantic moderation gate', () => {
  it('reuses previous moderation safety until the character threshold is reached', async () => {
    const resolver = jest.fn(async () =>
      buildSafetyResult({
        level: 'sensitive',
        reasonCodes: ['semantic-moderation-flagged'],
      }),
    );
    const gate = createSemanticModerationGate(resolver, { minChars: 10 });

    const first = await gate.evaluate('hello');
    expect(first.blocked).toBe(false);
    expect(resolver).not.toHaveBeenCalled();

    const second = await gate.evaluate('hello world!');
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(second.reasonCodes).toContain('semantic-moderation-flagged');

    const third = await gate.evaluate('hello world!!!');
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(third.reasonCodes).toContain('semantic-moderation-flagged');
  });

  it('supports forced moderation checks for final stream flushes', async () => {
    const resolver = jest.fn(async () =>
      buildSafetyResult({
        level: 'blocked',
        blocked: true,
        reasonCodes: ['semantic-moderation-unsafe'],
      }),
    );
    const gate = createSemanticModerationGate(resolver, { minChars: 1_000 });

    await gate.evaluate('small');
    expect(resolver).not.toHaveBeenCalled();

    const forced = await gate.evaluate('small', { force: true });
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(forced.blocked).toBe(true);
    expect(forced.reasonCodes).toContain('semantic-moderation-unsafe');
  });
});
