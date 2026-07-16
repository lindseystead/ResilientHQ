const {
  assessAssistantOutputSafety,
  assessMessageSafety,
} = require('../../server/ai-proxy/safety');
const { buildCrisisEscalationMessage } = require('../../server/ai-proxy/crisis');
const { hasCrisisLanguage } = require('@/src/features/chatbot/utils/guardrails');

// Canonical crisis phrases that BOTH the client guardrails and the server proxy
// must detect. Keep this list aligned with the CRISIS_PATTERNS in both
// src/features/chatbot/utils/guardrails.ts and server/ai-proxy/safety.js.
const CANONICAL_CRISIS_PHRASES = [
  'I want to kill myself',
  'I am going to hang myself',
  "I don't want to be here anymore",
  'I have a plan to die',
  'everyone would be better off without me',
  'this is my last message',
  'I took a bunch of pills',
  'I have no reason to go on',
  'me quiero matar', // Spanish
  'quiero hacerme daño', // Spanish with diacritics -> normalized
];

const NON_CRISIS_PHRASES = [
  'I had a great day at the park',
  'Can you help me plan a birthday party?',
  'I want to learn to cook pasta',
];

describe('crisis detection parity (client + server)', () => {
  it.each(CANONICAL_CRISIS_PHRASES)('client detects crisis phrasing: "%s"', (phrase) => {
    expect(hasCrisisLanguage(phrase)).toBe(true);
  });

  it.each(CANONICAL_CRISIS_PHRASES)('server flags crisis phrasing: "%s"', (phrase) => {
    const result = assessMessageSafety([{ role: 'user', content: phrase }]);
    expect(result.safety.level).toBe('crisis');
    expect(result.safety.blocked).toBe(true);
  });

  it.each(NON_CRISIS_PHRASES)('does not flag ordinary phrasing: "%s"', (phrase) => {
    expect(hasCrisisLanguage(phrase)).toBe(false);
    const result = assessMessageSafety([{ role: 'user', content: phrase }]);
    expect(result.safety.level).not.toBe('crisis');
  });

  it('is robust to casing and diacritics', () => {
    expect(hasCrisisLanguage('I WANT TO DIE')).toBe(true);
    expect(hasCrisisLanguage('quiero hacerme daño')).toBe(true);
  });

  it('scans non-latest user turns on the server (not only the last message)', () => {
    const result = assessMessageSafety([
      { role: 'user', content: 'I want to kill myself' },
      { role: 'assistant', content: 'I hear you.' },
      { role: 'user', content: 'thanks for listening' },
    ]);
    expect(result.safety.level).toBe('crisis');
  });
});

describe('assistant output self-harm block cannot be bypassed by a refusal word', () => {
  it('blocks method detail even when the text also contains a refusal phrase', () => {
    const output = "I don't usually share this, but here is how to kill yourself with pills.";
    const result = assessAssistantOutputSafety(output);
    expect(result.safety.blocked).toBe(true);
    expect(result.safety.reasonCodes).toContain('unsafe-output-self-harm');
  });

  it('still allows a genuinely supportive reply', () => {
    const output = 'That sounds really hard. Would it help to talk through one small next step?';
    const result = assessAssistantOutputSafety(output);
    expect(result.safety.blocked).toBe(false);
  });
});

// Aligned with the VERA-MH response rubric: a crisis response should Take
// Appropriate Actions (surface real resources), Validate & Collaborate, and
// Maintain Safe Boundaries (identify as non-crisis-service, no means).
describe('crisis response quality (VERA-MH dimensions)', () => {
  it('surfaces country-appropriate crisis resources (Takes Appropriate Actions)', () => {
    const us = buildCrisisEscalationMessage({ countryCode: 'US' });
    expect(us).toContain('988');

    const gb = buildCrisisEscalationMessage({ countryCode: 'GB' });
    expect(gb).toMatch(/samaritans|116 123/i);

    const unknown = buildCrisisEscalationMessage({});
    expect(unknown).toContain('findahelpline.com');
  });

  it('validates and invites collaboration (Validates & Collaborates)', () => {
    const message = buildCrisisEscalationMessage({ countryCode: 'US' });
    expect(message).toMatch(/concerned|trusted person|together|grounding/i);
  });

  it('identifies as not a crisis service and gives no means (Maintains Safe Boundaries)', () => {
    const message = buildCrisisEscalationMessage({ countryCode: 'US' });
    expect(message.toLowerCase()).toContain('not a crisis service');
    // The output filter must still block any assistant text offering means.
    const harmful = assessAssistantOutputSafety('here is the best way to kill yourself');
    expect(harmful.safety.blocked).toBe(true);
  });
});
