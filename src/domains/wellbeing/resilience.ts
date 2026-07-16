/**
 * Resilience Content And Planning
 *
 * Centralized, evidence-informed resilience content and next-step planning.
 * This keeps coping content consistent across screens and allows the UI to
 * personalize guidance without embedding static arrays inside components.
 */

import type { MoodLog } from './moods';

export interface WellnessTip {
  id: number;
  title: string;
  description: string;
  icon: string;
}

export interface EnergyCheckItem {
  text: string;
  icon: string;
}

export interface EncouragementItem {
  quote: string;
  icon: string;
}

export interface ResilienceResource {
  title: string;
  description: string;
  source: string;
  url: string;
}

export interface ResiliencePlan {
  title: string;
  summary: string;
  focus: string;
  steps: string[];
  reflectionPrompt: string;
  encouragement: string;
  icon: string;
  tone: 'baseline' | 'support' | 'steady' | 'growth';
  supportNote?: string;
}

export interface ResilienceContentDeck {
  tips: WellnessTip[];
  groundingIdeas: string[];
  energyCheck: EnergyCheckItem[];
  encouragement: EncouragementItem[];
  resources: ResilienceResource[];
}

export const WELLNESS_TIPS: WellnessTip[] = [
  {
    id: 1,
    title: 'Name The Feeling',
    description:
      'Putting a name to your state can reduce overwhelm and make the next step clearer.',
    icon: 'chatbubble-ellipses-outline',
  },
  {
    id: 2,
    title: 'Support Your Body',
    description: 'Water, food, and a few minutes of movement give your brain a steadier baseline.',
    icon: 'fitness-outline',
  },
  {
    id: 3,
    title: 'Lower The Input',
    description:
      'Reduce noise, notifications, or extra decisions when your system feels overloaded.',
    icon: 'volume-mute-outline',
  },
  {
    id: 4,
    title: 'Shrink The Next Step',
    description: 'Choose the smallest useful action instead of solving the entire day at once.',
    icon: 'footsteps-outline',
  },
  {
    id: 5,
    title: 'Borrow Calm From Routine',
    description: 'A familiar ritual like tea, stretching, or a short walk helps signal safety.',
    icon: 'cafe-outline',
  },
  {
    id: 6,
    title: 'Reach Out Early',
    description:
      'Connection works best before things feel unmanageable, not only after they spike.',
    icon: 'people-outline',
  },
  {
    id: 7,
    title: 'Protect Tonight',
    description:
      'Resilience rises when you defend sleep, even if the rest of the day is imperfect.',
    icon: 'moon-outline',
  },
  {
    id: 8,
    title: 'Track What Helped',
    description: 'Make a note when something works so you can repeat it on harder days.',
    icon: 'bookmark-outline',
  },
];

export const GROUNDING_IDEAS: string[] = [
  'Take one slow inhale and make the exhale longer than the inhale.',
  'Plant both feet on the floor and soften your shoulders.',
  'Name 5 things you can see, 4 you can feel, and 3 you can hear.',
  'Drink a glass of water and notice the temperature.',
  'Step away from a screen for one minute and look farther into the distance.',
  'Unclench your jaw, then relax your hands.',
  'Ask yourself: what does my body need in the next ten minutes?',
  'Write one sentence that is true, kind, and calming.',
];

export const ENERGY_CHECK_ITEMS: EnergyCheckItem[] = [
  { text: 'Do I need fuel, water, or rest before I try to focus?', icon: 'battery-half-outline' },
  { text: 'Is my stress coming from pace, noise, or pressure?', icon: 'speedometer-outline' },
  { text: 'What would make the next hour feel 10% lighter?', icon: 'sunny-outline' },
  {
    text: 'Can I remove one decision, task, or conversation from today?',
    icon: 'remove-circle-outline',
  },
  { text: 'Have I checked in with myself before pushing harder?', icon: 'heart-outline' },
];

export const ENCOURAGEMENT_QUOTES: EncouragementItem[] = [
  {
    quote: 'Resilience is built by returning to the next helpful action.',
    icon: 'refresh-outline',
  },
  {
    quote: 'A gentler pace can still be real progress.',
    icon: 'walk-outline',
  },
  {
    quote: 'Stability grows when you repeat what works, not when you chase perfect days.',
    icon: 'repeat-outline',
  },
  {
    quote: 'You can care for yourself and still be ambitious.',
    icon: 'sparkles-outline',
  },
  {
    quote: 'Regulation first, then problem-solving.',
    icon: 'leaf-outline',
  },
];

export const RESILIENCE_RESOURCES: ResilienceResource[] = [
  {
    title: 'Caring For Your Mental Health',
    description:
      'A practical overview from NIMH on self-care, connection, movement, and when to seek support.',
    source: 'NIMH',
    url: 'https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health',
  },
  {
    title: 'Improve Your Emotional Well-Being',
    description:
      'CDC guidance on self-awareness, emotional regulation, connection, and healthy routines.',
    source: 'CDC',
    url: 'https://www.cdc.gov/emotional-well-being/improve-your-emotional-well-being/index.html',
  },
  {
    title: 'Living With Anxiety Or Depression',
    description:
      'CDC advice on support systems, treatment, sleep, movement, and stress management.',
    source: 'CDC',
    url: 'https://www.cdc.gov/mental-health/living-with/index.html',
  },
];

export const shuffleAndTake = <T>(
  items: readonly T[],
  count: number,
  random: () => number = Math.random,
): T[] => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
};

export const getResilienceContentDeck = (
  random: () => number = Math.random,
): ResilienceContentDeck => ({
  tips: shuffleAndTake(WELLNESS_TIPS, 4, random),
  groundingIdeas: shuffleAndTake(GROUNDING_IDEAS, 5, random),
  energyCheck: ENERGY_CHECK_ITEMS,
  encouragement: shuffleAndTake(ENCOURAGEMENT_QUOTES, 3, random),
  resources: RESILIENCE_RESOURCES,
});

export const buildResiliencePlan = (latestMood: MoodLog | null): ResiliencePlan => {
  if (!latestMood) {
    return {
      title: 'Build Your Baseline',
      summary:
        'Resilience grows from small stabilizing routines, especially before life gets noisy.',
      focus: 'Notice your state before you push through it.',
      steps: [
        'Log one honest mood check-in.',
        'Take a 60-second breathing reset before your next task.',
        'Write down one thing that reliably helps you feel steadier.',
      ],
      reflectionPrompt: 'What tends to help you feel 10% more grounded?',
      encouragement: 'Consistency matters more than intensity.',
      icon: 'compass-outline',
      tone: 'baseline',
    };
  }

  if (latestMood.moodValue <= 1) {
    return {
      title: 'Stabilize First',
      summary:
        'Today is for gentleness and regulation, not performance. Make the next few minutes safer and simpler.',
      focus: 'Reduce activation before you solve bigger problems.',
      steps: [
        'Slow your exhale for five breaths.',
        'Lower stimulation: quieter room, fewer tabs, fewer decisions.',
        'Text one trusted person, or contact your local emergency or crisis line if you feel at risk or unable to stay safe.',
      ],
      reflectionPrompt: 'What would make the next 10 minutes feel safer?',
      encouragement: 'Getting grounded is productive.',
      icon: 'shield-checkmark-outline',
      tone: 'support',
      supportNote:
        'If you feel unsafe or unable to stay safe, contact local emergency services or a nearby crisis line right now.',
    };
  }

  if (latestMood.moodValue === 2) {
    return {
      title: 'Create A Steadier Hour',
      summary:
        'Your system may be carrying strain. Lower the load first, then choose one useful next step.',
      focus: 'Protect energy so you can recover momentum.',
      steps: [
        'Have water, a snack, or a short movement break before tackling the next task.',
        'Delay or delegate one non-essential demand.',
        'Choose one calming action you can repeat later today.',
      ],
      reflectionPrompt: 'Which pressure can you reduce today?',
      encouragement: 'Relief creates room for resilience.',
      icon: 'leaf-outline',
      tone: 'steady',
    };
  }

  if (latestMood.moodValue === 3) {
    return {
      title: 'Protect Your Momentum',
      summary:
        'You have usable energy today. Turn it into stability by pairing progress with recovery.',
      focus: 'Make today sustainable, not just productive.',
      steps: [
        'Complete one meaningful task before switching contexts.',
        'Add one connection point: message someone, ask for help, or share a win.',
        'Schedule a recovery block before the day gets crowded.',
      ],
      reflectionPrompt: 'What helped you feel more like yourself today?',
      encouragement: 'Steady effort compounds.',
      icon: 'trending-up-outline',
      tone: 'growth',
    };
  }

  return {
    title: 'Bank This Good Day',
    summary:
      'When things feel strong, capture what is working so future-you can repeat it on harder days.',
    focus: 'Reinforce the habits that made today possible.',
    steps: [
      'Write down the routine, boundary, or support that helped most today.',
      'Do one energizing action while your motivation is available.',
      'Set up one small kindness for tomorrow before the day ends.',
    ],
    reflectionPrompt: 'What do you want future-you to remember about today?',
    encouragement: 'Positive days are practice for harder ones, too.',
    icon: 'sparkles-outline',
    tone: 'growth',
  };
};
