/**
 * Chatbot Feature Constants
 *
 * Shared presentation and support constants for the chatbot UI.
 */

import { INPUT_LIMITS } from '@/src/config/constants';
import { darkTheme, lightTheme } from '@/src/config/theme';
import type { MoodLog } from '@/src/domains/wellbeing';
import type { ThemeMode } from '@/src/providers/ThemeProvider';

export const MAX_INPUT_LENGTH = INPUT_LIMITS.maxChatMessageLength;

/**
 * Persistent AI-identity disclosure shown in the chat header. Kept fixed and
 * non-adaptive so it stays visible in every mode — including trauma-safe mode,
 * where the header title softens and no longer says "AI".
 */
export const AI_DISCLOSURE_NOTICE =
  'AI assistant — not a person, and not a substitute for professional or crisis care.';

export const EMOTIONAL_KEYWORDS = [
  'sad',
  'overwhelmed',
  'anxious',
  'angry',
  'stressed',
  'depressed',
  'lonely',
  'frustrated',
];

export const getMoodGradient = (mood?: MoodLog | null, mode: ThemeMode = 'light'): string[] => {
  const colors = mode === 'dark' ? darkTheme.colors : lightTheme.colors;
  const gradientMap = {
    happy: colors.gradientHappy,
    neutral: colors.gradientCalm,
    sad: colors.gradientSad,
    anxious: colors.gradientAnxious,
    default: colors.gradientPrimary,
  } as const;

  if (!mood) {
    return [...gradientMap.default];
  }

  if (mood.moodValue >= 4) {
    return [...gradientMap.happy];
  }
  if (mood.moodValue >= 2) {
    return [...gradientMap.neutral];
  }
  if (mood.moodValue >= 1) {
    return [...gradientMap.sad];
  }

  return [...gradientMap.anxious];
};

export const getSuggestedPrompts = (mood?: MoodLog | null): string[] => {
  if (!mood) {
    return [
      'How can I improve my mood today?',
      'What are some self-care activities?',
      'Help me process my feelings',
    ];
  }

  if (mood.moodValue >= 4) {
    return [
      'How can I maintain this positive energy?',
      'What are some gratitude practices?',
      'Share some motivation tips',
    ];
  }

  if (mood.moodValue >= 2) {
    return [
      'Help me feel better',
      'What are some grounding techniques?',
      'Suggest some calming activities',
    ];
  }

  return [
    "I'm struggling today, can you help?",
    'What are some crisis resources?',
    'Help me find hope',
  ];
};

export const BREATHING_STEPS = [
  { text: 'Breathe in slowly...', duration: 4000 },
  { text: 'Hold...', duration: 4000 },
  { text: 'Breathe out slowly...', duration: 4000 },
  { text: 'Pause...', duration: 2000 },
];

export const GROUNDING_STEPS = [
  { type: 'see', text: 'Name 5 things you can see' },
  { type: 'touch', text: 'Name 4 things you can touch' },
  { type: 'hear', text: 'Name 3 things you can hear' },
  { type: 'smell', text: 'Name 2 things you can smell' },
  { type: 'taste', text: 'Name 1 thing you can taste' },
] as const;
