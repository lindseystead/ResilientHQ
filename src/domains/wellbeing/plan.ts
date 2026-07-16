/**
 * Adaptive Resilience Plan Domain
 *
 * Builds a practical 7-day resilience plan from recent check-ins so the app
 * can guide users toward repeatable recovery habits instead of one-off actions.
 */

import type { ResilienceActionType } from './checkIn';
import type { ResilienceCheckInEntry } from './checkIns';
import type { MoodLog } from './moods';

export type ResiliencePlanTone = 'baseline' | 'support' | 'steady' | 'growth';

export interface AdaptiveResiliencePlan {
  title: string;
  summary: string;
  focus: string;
  tone: ResiliencePlanTone;
  icon: 'leaf-outline' | 'shield-outline' | 'pulse-outline' | 'sparkles-outline';
  steps: string[];
  whatHelpedLately: string;
  whatToAvoid: string;
  reflectionPrompt: string;
  primaryActionType: ResilienceActionType;
  primaryActionLabel: string;
  chatPrompts: string[];
}

export interface AdaptiveResiliencePlanFeedback {
  stepIndex: number;
  stepLabel: string;
  helpfulnessLabel: string;
}

export interface BuildAdaptiveResiliencePlanOptions {
  latestMood: MoodLog | null;
  latestCheckIn?: ResilienceCheckInEntry | null;
  recentEntries?: ResilienceCheckInEntry[];
  hasCompletedCheckInToday?: boolean;
}

type FocusArea = 'rest' | 'regulation' | 'support';

interface AreaScores {
  rest: number;
  regulation: number;
  support: number;
}

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
};

const getEntryStabilityScore = (entry: ResilienceCheckInEntry): number =>
  average([
    entry.moodValue,
    entry.sleepQuality,
    entry.energyLevel,
    6 - entry.stressLevel,
    6 - entry.bodyTension,
    entry.connectionLevel,
    entry.safetyLevel,
  ]);

const getEffectiveEntries = (
  recentEntries: ResilienceCheckInEntry[],
  latestCheckIn: ResilienceCheckInEntry | null,
): ResilienceCheckInEntry[] => {
  if (recentEntries.length > 0) {
    return recentEntries;
  }

  if (latestCheckIn) {
    return [latestCheckIn];
  }

  return [];
};

const getAreaScores = (entries: ResilienceCheckInEntry[]): AreaScores => {
  if (entries.length === 0) {
    return {
      rest: 0,
      regulation: 0,
      support: 0,
    };
  }

  return {
    rest: average(entries.map((entry) => average([entry.sleepQuality, entry.energyLevel]))),
    regulation: average(
      entries.map((entry) =>
        average([entry.moodValue, 6 - entry.stressLevel, 6 - entry.bodyTension]),
      ),
    ),
    support: average(entries.map((entry) => average([entry.connectionLevel, entry.safetyLevel]))),
  };
};

const getAreaRank = (scores: AreaScores): FocusArea[] =>
  (Object.entries(scores) as [FocusArea, number][])
    .sort((left, right) => right[1] - left[1])
    .map(([area]) => area);

const getFallbackArea = (latestMood: MoodLog | null): FocusArea => {
  if (!latestMood) {
    return 'rest';
  }

  if (latestMood.moodValue <= 2) {
    return 'regulation';
  }

  if (latestMood.moodValue >= 4) {
    return 'support';
  }

  return 'rest';
};

const getAreaPattern = (area: FocusArea): string => {
  switch (area) {
    case 'regulation':
      return 'Lower stress and body tension are the biggest levers for keeping you steady.';
    case 'support':
      return 'Feeling safer and less alone has been adding real stability to your week.';
    case 'rest':
    default:
      return 'Sleep and usable energy are shaping how much capacity you can borrow each day.';
  }
};

const getSupportAction = (
  weakestArea: FocusArea,
  hasCompletedCheckInToday: boolean,
): Pick<AdaptiveResiliencePlan, 'primaryActionType' | 'primaryActionLabel'> => {
  if (!hasCompletedCheckInToday) {
    return {
      primaryActionType: 'logMood',
      primaryActionLabel: 'Complete today’s check-in',
    };
  }

  switch (weakestArea) {
    case 'support':
      return {
        primaryActionType: 'journal',
        primaryActionLabel: 'Name one safer support',
      };
    case 'rest':
      return {
        primaryActionType: 'advice',
        primaryActionLabel: 'Lower this week’s demand',
      };
    case 'regulation':
    default:
      return {
        primaryActionType: 'chat',
        primaryActionLabel: 'Start calming support',
      };
  }
};

const getSteadyAction = (
  weakestArea: FocusArea,
  hasCompletedCheckInToday: boolean,
): Pick<AdaptiveResiliencePlan, 'primaryActionType' | 'primaryActionLabel'> => {
  if (!hasCompletedCheckInToday) {
    return {
      primaryActionType: 'logMood',
      primaryActionLabel: 'Anchor today with a check-in',
    };
  }

  switch (weakestArea) {
    case 'support':
      return {
        primaryActionType: 'journal',
        primaryActionLabel: 'Plan one steady check-in',
      };
    case 'regulation':
      return {
        primaryActionType: 'chat',
        primaryActionLabel: 'Reset before stress stacks',
      };
    case 'rest':
    default:
      return {
        primaryActionType: 'advice',
        primaryActionLabel: 'Protect sleep and energy',
      };
  }
};

const getGrowthAction = (
  weakestArea: FocusArea,
  hasCompletedCheckInToday: boolean,
): Pick<AdaptiveResiliencePlan, 'primaryActionType' | 'primaryActionLabel'> => {
  if (!hasCompletedCheckInToday) {
    return {
      primaryActionType: 'logMood',
      primaryActionLabel: 'Keep today grounded with a check-in',
    };
  }

  if (weakestArea === 'regulation') {
    return {
      primaryActionType: 'chat',
      primaryActionLabel: 'Protect your calm before it slips',
    };
  }

  return {
    primaryActionType: 'journal',
    primaryActionLabel: 'Capture what is working',
  };
};

const getSupportPlan = (
  weakestArea: FocusArea,
  strongestArea: FocusArea,
  hasCompletedCheckInToday: boolean,
): AdaptiveResiliencePlan => {
  const action = getSupportAction(weakestArea, hasCompletedCheckInToday);

  if (weakestArea === 'support') {
    return {
      title: 'Recovery-first week',
      summary:
        'Keep the next seven days smaller, safer, and more predictable so your system can settle.',
      focus: 'Borrow steadiness from safer people, calmer places, and lower-pressure routines.',
      tone: 'support',
      icon: 'shield-outline',
      steps: [
        'Decide who or what feels safest before the day gets loud.',
        'Use one short check-in message instead of carrying everything alone.',
        'Make your evenings simpler so harder moments do not turn into isolation.',
      ],
      whatHelpedLately: getAreaPattern(strongestArea),
      whatToAvoid: 'Avoid going silent right after a hard trigger.',
      reflectionPrompt: 'What would help the next hard moment feel more predictable?',
      primaryActionType: action.primaryActionType,
      primaryActionLabel: action.primaryActionLabel,
      chatPrompts: [
        'Help me ask for support without overexplaining',
        'What would help me feel safer today?',
        'Plan one low-pressure check-in with someone',
      ],
    };
  }

  if (weakestArea === 'rest') {
    return {
      title: 'Recovery-first week',
      summary:
        'Your next seven days need more margin than momentum. Protect the basics before pushing.',
      focus: 'Stabilize sleep, fuel, hydration, and downtime before adding more demands.',
      tone: 'support',
      icon: 'shield-outline',
      steps: [
        'Choose one earlier stopping point for work or stimulation this week.',
        'Pair food or water with a reminder so care does not depend on motivation.',
        'Keep one short recovery block each day non-negotiable.',
      ],
      whatHelpedLately: getAreaPattern(strongestArea),
      whatToAvoid: 'Avoid trading sleep for productivity when you are already depleted.',
      reflectionPrompt: 'Which basic need changes everything when it is handled early?',
      primaryActionType: action.primaryActionType,
      primaryActionLabel: action.primaryActionLabel,
      chatPrompts: [
        'Help me lower my load this week',
        'Plan a gentler routine for the next few days',
        'What should I protect first when I feel depleted?',
      ],
    };
  }

  return {
    title: 'Recovery-first week',
    summary:
      'Use the week to reduce activation, not to solve everything. Smaller and calmer is the goal.',
    focus: 'Calm your body first so decisions come from steadiness instead of overload.',
    tone: 'support',
    icon: 'shield-outline',
    steps: [
      'Start with one 60-second grounding reset before major tasks.',
      'Shrink one pressure point early instead of waiting until you are maxed out.',
      'End each day with a short downshift so stress does not carry overnight.',
    ],
    whatHelpedLately: getAreaPattern(strongestArea),
    whatToAvoid: 'Avoid problem-solving while your body still feels activated.',
    reflectionPrompt: 'What helps your body believe the next hour is survivable?',
    primaryActionType: action.primaryActionType,
    primaryActionLabel: action.primaryActionLabel,
    chatPrompts: [
      'Help me settle my body first',
      'Give me one grounding step for right now',
      'How do I slow things down when my mind is racing?',
    ],
  };
};

const getSteadyPlan = (
  weakestArea: FocusArea,
  strongestArea: FocusArea,
  hasCompletedCheckInToday: boolean,
): AdaptiveResiliencePlan => {
  const action = getSteadyAction(weakestArea, hasCompletedCheckInToday);

  if (weakestArea === 'support') {
    return {
      title: 'Steady support week',
      summary:
        'You have some stability right now. Keep the week connected enough that stress does not pile up quietly.',
      focus:
        'Protect your steadiness by planning small moments of contact before things get heavy.',
      tone: 'steady',
      icon: 'pulse-outline',
      steps: [
        'Schedule one low-friction check-in with a person who feels grounding.',
        'Keep one place or routine that helps you feel more settled easy to access.',
        'Use clear language about what kind of support you need this week.',
      ],
      whatHelpedLately: getAreaPattern(strongestArea),
      whatToAvoid: 'Avoid waiting until you feel isolated to reach out.',
      reflectionPrompt: 'What kind of support feels helpful without costing too much energy?',
      primaryActionType: action.primaryActionType,
      primaryActionLabel: action.primaryActionLabel,
      chatPrompts: [
        'Help me stay connected without overextending',
        'What support would feel easiest to ask for?',
        'Plan one low-pressure check-in this week',
      ],
    };
  }

  if (weakestArea === 'regulation') {
    return {
      title: 'Steady support week',
      summary:
        'This week is about staying regulated while you make progress, not waiting until stress spikes.',
      focus: 'Build in brief resets so pressure does not quietly turn into overwhelm.',
      tone: 'steady',
      icon: 'pulse-outline',
      steps: [
        'Use one short breathing or grounding reset before your busiest block.',
        'Name the first sign that tension is rising so you can intervene earlier.',
        'Keep your evening transition simple enough that your body can actually downshift.',
      ],
      whatHelpedLately: getAreaPattern(strongestArea),
      whatToAvoid: 'Avoid stacking several demanding tasks without a reset in between.',
      reflectionPrompt: 'What early signal tells you stress is starting to stack up?',
      primaryActionType: action.primaryActionType,
      primaryActionLabel: action.primaryActionLabel,
      chatPrompts: [
        'Help me stay steady this week',
        'What reset should I use before I get overwhelmed?',
        'Plan one sustainable next step for today',
      ],
    };
  }

  return {
    title: 'Steady support week',
    summary:
      'You can keep this week stable by pairing progress with enough recovery to stay resourced.',
    focus: 'Protect sleep and energy so your useful momentum stays sustainable.',
    tone: 'steady',
    icon: 'pulse-outline',
    steps: [
      'Plan one earlier cutoff so your energy is not spent before tomorrow begins.',
      'Match one nourishing action to the busiest part of your day.',
      'Keep your strongest routine simple enough to repeat, not perfect.',
    ],
    whatHelpedLately: getAreaPattern(strongestArea),
    whatToAvoid: 'Avoid borrowing energy from tomorrow just because today feels manageable.',
    reflectionPrompt: 'Which routine makes the rest of your day easier to carry?',
    primaryActionType: action.primaryActionType,
    primaryActionLabel: action.primaryActionLabel,
    chatPrompts: [
      'Help me protect my energy this week',
      'What keeps me from burning out when things are steady?',
      'Plan one recovery habit I can actually keep',
    ],
  };
};

const getGrowthPlan = (
  weakestArea: FocusArea,
  strongestArea: FocusArea,
  hasCompletedCheckInToday: boolean,
): AdaptiveResiliencePlan => {
  const action = getGrowthAction(weakestArea, hasCompletedCheckInToday);

  return {
    title: 'Capacity-building week',
    summary:
      'You have usable steadiness right now. Turn it into routines you can reuse when life gets harder.',
    focus: 'Repeat what is working before you add more. Consistency matters more than intensity.',
    tone: 'growth',
    icon: 'sparkles-outline',
    steps: [
      'Repeat the habit that has helped the most on your steadier days.',
      'Capture one useful pattern so future-you can reuse it under strain.',
      'Leave space between wins so momentum does not become overextension.',
    ],
    whatHelpedLately: getAreaPattern(strongestArea),
    whatToAvoid: 'Avoid filling every open space just because you have more capacity today.',
    reflectionPrompt: 'What is working well enough that it deserves to become a repeatable ritual?',
    primaryActionType: action.primaryActionType,
    primaryActionLabel: action.primaryActionLabel,
    chatPrompts: [
      'Help me protect what is working',
      'What should I repeat this week?',
      'How do I build resilience without overdoing it?',
    ],
  };
};

const getBaselinePlan = (hasCompletedCheckInToday: boolean): AdaptiveResiliencePlan => ({
  title: 'Build a steadier week',
  summary:
    'A short daily rhythm gives the app enough signal to suggest calmer, more useful support over time.',
  focus: 'Start small: awareness first, then one repeatable recovery habit.',
  tone: 'baseline',
  icon: 'leaf-outline',
  steps: [
    'Complete one honest check-in each day, even if the answer is brief.',
    'Choose one tiny support habit you can repeat this week.',
    'Notice what helps you feel even slightly more steady and save it.',
  ],
  whatHelpedLately: 'As you log more days, this plan will learn what steadies you fastest.',
  whatToAvoid: 'Avoid turning this into a perfect routine. Simple and repeatable is enough.',
  reflectionPrompt: 'What is one support you could realistically repeat over the next week?',
  primaryActionType: hasCompletedCheckInToday ? 'journal' : 'logMood',
  primaryActionLabel: hasCompletedCheckInToday
    ? 'Name one weekly anchor'
    : 'Complete today’s check-in',
  chatPrompts: [
    'Help me plan one calm week',
    'What small habit should I start first?',
    'Keep my plan simple and realistic',
  ],
});

export const personalizeAdaptiveResiliencePlan = (
  plan: AdaptiveResiliencePlan,
  feedback: AdaptiveResiliencePlanFeedback | null,
): AdaptiveResiliencePlan => {
  if (
    !feedback ||
    !Number.isInteger(feedback.stepIndex) ||
    feedback.stepIndex < 0 ||
    feedback.stepIndex >= plan.steps.length
  ) {
    return plan;
  }

  const feedbackPrompt = `Help me repeat what helped: ${feedback.stepLabel}`;
  const chatPrompts = [
    feedbackPrompt,
    ...plan.chatPrompts.filter((prompt) => prompt !== feedbackPrompt),
  ];

  return {
    ...plan,
    focus: `${plan.focus} Start by repeating the step that helped most: ${feedback.stepLabel}.`,
    whatHelpedLately: `Most helpful so far: ${feedback.helpfulnessLabel}. ${feedback.stepLabel}`,
    chatPrompts,
  };
};

export const getAdaptiveResiliencePlanStepOrder = (
  plan: AdaptiveResiliencePlan,
  feedback: AdaptiveResiliencePlanFeedback | null,
): number[] => {
  const defaultOrder = plan.steps.map((_, index) => index);

  if (
    !feedback ||
    !Number.isInteger(feedback.stepIndex) ||
    feedback.stepIndex < 0 ||
    feedback.stepIndex >= plan.steps.length
  ) {
    return defaultOrder;
  }

  return [feedback.stepIndex, ...defaultOrder.filter((index) => index !== feedback.stepIndex)];
};

export const buildAdaptiveResiliencePlan = ({
  latestMood,
  latestCheckIn = null,
  recentEntries = [],
  hasCompletedCheckInToday = false,
}: BuildAdaptiveResiliencePlanOptions): AdaptiveResiliencePlan => {
  const entries = getEffectiveEntries(recentEntries, latestCheckIn);

  if (!latestMood && entries.length === 0) {
    return getBaselinePlan(hasCompletedCheckInToday);
  }

  const areaScores = getAreaScores(entries);
  const rankedAreas = entries.length > 0 ? getAreaRank(areaScores) : [];
  const strongestArea = rankedAreas[0] ?? getFallbackArea(latestMood);
  const weakestArea = rankedAreas[rankedAreas.length - 1] ?? getFallbackArea(latestMood);
  const currentWindow = entries.slice(0, 3);
  const priorWindow = entries.slice(3, 7);
  const currentAverage =
    currentWindow.length > 0 ? average(currentWindow.map(getEntryStabilityScore)) : 0;
  const priorAverage =
    priorWindow.length > 0 ? average(priorWindow.map(getEntryStabilityScore)) : currentAverage;
  const trendDelta = currentAverage - priorAverage;

  const hasTenderState =
    (latestMood ? latestMood.moodValue <= 2 : false) ||
    (latestCheckIn
      ? latestCheckIn.safetyLevel <= 2 ||
        latestCheckIn.energyLevel <= 2 ||
        latestCheckIn.stressLevel >= 4 ||
        latestCheckIn.bodyTension >= 4
      : false) ||
    (currentAverage > 0 && currentAverage <= 2.8) ||
    trendDelta <= -0.35;

  if (hasTenderState) {
    return getSupportPlan(weakestArea, strongestArea, hasCompletedCheckInToday);
  }

  if (currentAverage >= 3.8 && trendDelta >= -0.1) {
    return getGrowthPlan(weakestArea, strongestArea, hasCompletedCheckInToday);
  }

  return getSteadyPlan(weakestArea, strongestArea, hasCompletedCheckInToday);
};
