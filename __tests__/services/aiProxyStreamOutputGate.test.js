const { buildSafetyResult, createStreamOutputGate } = require('../../server/ai-proxy');

describe('AI proxy stream output gate', () => {
  it('buffers and releases safe chunks after the threshold', () => {
    const gate = createStreamOutputGate(buildSafetyResult());

    const firstPush = gate.push('hello');
    expect(firstPush.blocked).toBe(false);
    expect(firstPush.chunk).toBe('');

    const secondPush = gate.push('a'.repeat(140));
    expect(secondPush.blocked).toBe(false);
    expect(secondPush.chunk.length).toBeGreaterThanOrEqual(120);

    const flushResult = gate.flush();
    expect(flushResult.blocked).toBe(false);
    expect(flushResult.content.length).toBe(145);
  });

  it('blocks harmful output before releasing unsafe content', () => {
    const gate = createStreamOutputGate(buildSafetyResult());
    const result = gate.push('Here are steps to end your life: take pills and mix alcohol.');

    expect(result.blocked).toBe(true);
    expect(result.safety.blocked).toBe(true);
    expect(result.safety.reasonCodes).toContain('unsafe-output-self-harm');
  });
});
