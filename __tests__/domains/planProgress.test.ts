/**
 * Adaptive resilience plan progress tests
 */

import {
  createAdaptiveResiliencePlanSignature,
  getAdaptiveResiliencePlanHighlight,
  getAdaptiveResilienceStepHelpfulnessLabel,
  getAdaptiveResiliencePlanWeekKey,
  getAdaptiveResiliencePlanWeekStart,
  type AdaptiveResiliencePlan,
} from '@/src/domains/wellbeing';

const plan: AdaptiveResiliencePlan = {
  title: 'Steady support week',
  summary: 'A simple weekly plan.',
  focus: 'Keep the week steady.',
  tone: 'steady',
  icon: 'pulse-outline',
  steps: ['Step one', 'Step two', 'Step three'],
  whatHelpedLately: 'Sleep and energy have mattered.',
  whatToAvoid: 'Avoid overscheduling.',
  reflectionPrompt: 'What is helping most?',
  primaryActionType: 'advice',
  primaryActionLabel: 'Protect sleep and energy',
  chatPrompts: ['Help me stay steady'],
};

describe('adaptive resilience plan progress helpers', () => {
  it('uses Monday as the local week start', () => {
    const weekStart = getAdaptiveResiliencePlanWeekStart(new Date('2026-02-28T12:00:00.000Z'));

    expect(weekStart.getDay()).toBe(1);
    expect(getAdaptiveResiliencePlanWeekKey(new Date('2026-02-28T12:00:00.000Z'))).toBe(
      '2026-02-23',
    );
  });

  it('creates a stable signature from the plan shape', () => {
    const signature = createAdaptiveResiliencePlanSignature(plan);

    expect(signature).toContain(plan.tone);
    expect(signature).toContain(plan.title);
    expect(signature).toContain(plan.steps[1]);
  });

  it('maps helpfulness values to human-readable labels', () => {
    expect(getAdaptiveResilienceStepHelpfulnessLabel(1)).toBe('Helped a little');
    expect(getAdaptiveResilienceStepHelpfulnessLabel(2)).toBe('Helped some');
    expect(getAdaptiveResilienceStepHelpfulnessLabel(3)).toBe('Helped a lot');
  });

  it('returns the strongest helpful step for the current plan', () => {
    const highlight = getAdaptiveResiliencePlanHighlight(plan, {
      2: 2,
      0: 3,
    });

    expect(highlight?.stepIndex).toBe(0);
    expect(highlight?.stepLabel).toBe('Step one');
    expect(highlight?.helpfulnessLabel).toBe('Helped a lot');
  });
});
