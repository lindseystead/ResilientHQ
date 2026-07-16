/**
 * Advice feature content constants
 */

import { Ionicons } from '@expo/vector-icons';

export interface ResetStep {
  title: string;
  instruction: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const ADVICE_RESET_STEPS: ResetStep[] = [
  {
    title: 'Breathe',
    instruction: 'Take 4 slow, deep breaths. Inhale for 4 counts, hold for 4, exhale for 4.',
    icon: 'leaf-outline',
  },
  {
    title: 'Ground',
    instruction: 'Name 3 things you can see, 2 things you can touch, and 1 thing you can hear.',
    icon: 'earth-outline',
  },
  {
    title: 'Reset',
    instruction: 'Take a moment to stretch or move gently. You&apos;ve got this.',
    icon: 'checkmark-circle-outline',
  },
];
