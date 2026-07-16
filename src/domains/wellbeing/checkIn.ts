/**
 * Daily Resilience Check-In
 *
 * Converts recent wellbeing signals into a trauma-informed daily check-in the
 * UI can render as a short, actionable ritual.
 */

import type { MoodLog } from './moods';

export type ResilienceSignalStatus = 'restore' | 'steady' | 'strong';
export type ResilienceActionType = 'logMood' | 'journal' | 'chat' | 'advice';

export interface ResilienceCheckInSignal {
  id: 'stress' | 'energy' | 'body' | 'connection' | 'safety' | 'reflection' | 'capacity';
  label: string;
  prompt: string;
  status: ResilienceSignalStatus;
}

export interface DailyResilienceCheckIn {
  title: string;
  summary: string;
  recoveryFocus: string;
  completionLabel: string;
  signals: ResilienceCheckInSignal[];
  primaryActionType: ResilienceActionType;
  primaryActionLabel: string;
  actionReason: string;
}

export interface BuildDailyResilienceCheckInOptions {
  latestMood: MoodLog | null;
  moodLogsToday: number;
  journalEntriesToday: number;
  hasCompletedCheckInToday?: boolean;
  now?: Date;
}

const baselineSignals = (): ResilienceCheckInSignal[] => [
  {
    id: 'body',
    label: 'Body',
    prompt: 'What does your body need first: water, food, movement, or rest?',
    status: 'restore',
  },
  {
    id: 'stress',
    label: 'Stress',
    prompt: 'What is making today feel heavy, loud, or rushed?',
    status: 'steady',
  },
  {
    id: 'connection',
    label: 'Connection',
    prompt: 'Who helps you feel a little safer or less alone today?',
    status: 'steady',
  },
];

export const buildDailyResilienceCheckIn = ({
  latestMood,
  moodLogsToday,
  journalEntriesToday,
  hasCompletedCheckInToday = false,
}: BuildDailyResilienceCheckInOptions): DailyResilienceCheckIn => {
  if (!latestMood) {
    return {
      title: 'Start Your Daily Reset',
      summary:
        'A short check-in helps you notice strain early and choose support before stress spikes.',
      recoveryFocus: 'Begin with awareness, then pick one stabilizing action.',
      completionLabel: hasCompletedCheckInToday
        ? 'You completed today’s check-in'
        : moodLogsToday > 0
          ? 'Check-in started'
          : 'No check-in yet',
      signals: baselineSignals(),
      primaryActionType: moodLogsToday > 0 ? 'journal' : 'logMood',
      primaryActionLabel: moodLogsToday > 0 ? 'Add a quick reflection' : 'Log how you feel',
      actionReason:
        'A single honest signal gives the rest of your resilience plan better guidance.',
    };
  }

  if (latestMood.moodValue <= 1) {
    return {
      title: 'Stabilize First',
      summary:
        'Today is about safety, regulation, and reducing activation before you try to push through.',
      recoveryFocus: 'Lower demand, create safety, and choose the smallest calming next step.',
      completionLabel: hasCompletedCheckInToday
        ? 'You completed today’s check-in'
        : journalEntriesToday > 0
          ? 'You already reflected today'
          : 'Keep the next step gentle',
      signals: [
        {
          id: 'safety',
          label: 'Safety',
          prompt: 'What would make the next 10 minutes feel safer or more predictable?',
          status: 'restore',
        },
        {
          id: 'body',
          label: 'Body',
          prompt: 'Slow your exhale and unclench your shoulders before deciding what comes next.',
          status: 'restore',
        },
        {
          id: 'connection',
          label: 'Connection',
          prompt: 'Reach toward one trusted person or live support before you isolate further.',
          status: 'restore',
        },
      ],
      primaryActionType: moodLogsToday > 0 ? 'chat' : 'logMood',
      primaryActionLabel: moodLogsToday > 0 ? 'Open grounding support' : 'Log how you feel',
      actionReason: 'Regulation first. You do not need to solve the whole day right now.',
    };
  }

  if (latestMood.moodValue === 2) {
    return {
      title: 'Lighten The Load',
      summary:
        'Your system may be carrying strain. Reduce friction first, then choose one useful task.',
      recoveryFocus: 'Protect energy before asking more from yourself.',
      completionLabel: hasCompletedCheckInToday
        ? 'You completed today’s check-in'
        : journalEntriesToday > 0
          ? 'You processed something today'
          : 'A short reflection can help',
      signals: [
        {
          id: 'energy',
          label: 'Energy',
          prompt: 'What would help your energy most right now: fuel, water, movement, or a pause?',
          status: 'restore',
        },
        {
          id: 'stress',
          label: 'Stress',
          prompt: 'Which demand can be delayed, delegated, or made smaller today?',
          status: 'steady',
        },
        {
          id: 'reflection',
          label: 'Reflection',
          prompt: 'Name one thing that is making today harder than it needs to be.',
          status: 'steady',
        },
      ],
      primaryActionType: journalEntriesToday > 0 ? 'advice' : 'journal',
      primaryActionLabel:
        journalEntriesToday > 0 ? 'Review today’s support plan' : 'Write a quick check-in',
      actionReason: 'A quick reflection can reduce pressure and clarify the next helpful move.',
    };
  }

  if (latestMood.moodValue === 3) {
    return {
      title: 'Protect Your Momentum',
      summary:
        'You have usable energy today. Pair progress with recovery so the day stays sustainable.',
      recoveryFocus: 'Build steadiness, not just output.',
      completionLabel: hasCompletedCheckInToday
        ? 'You completed today’s check-in'
        : journalEntriesToday > 0
          ? 'You captured some progress today'
          : 'Capture one useful insight',
      signals: [
        {
          id: 'energy',
          label: 'Energy',
          prompt: 'What helps you keep steady energy instead of overextending?',
          status: 'steady',
        },
        {
          id: 'connection',
          label: 'Connection',
          prompt: 'Who could you update, thank, or lean on before the day gets crowded?',
          status: 'steady',
        },
        {
          id: 'reflection',
          label: 'Reflection',
          prompt: 'What is working today that you want to repeat tomorrow?',
          status: 'strong',
        },
      ],
      primaryActionType: journalEntriesToday > 0 ? 'advice' : 'journal',
      primaryActionLabel:
        journalEntriesToday > 0 ? 'Reinforce today’s plan' : 'Save what is working',
      actionReason: 'Good days are where resilience patterns get reinforced.',
    };
  }

  return {
    title: 'Bank Today’s Resilience',
    summary:
      'When things feel stronger, capture what helped so future-you can reuse it on harder days.',
    recoveryFocus: 'Turn a good day into a repeatable pattern.',
    completionLabel: hasCompletedCheckInToday
      ? 'You completed today’s check-in'
      : journalEntriesToday > 0
        ? 'You have a record of today'
        : 'Capture today before it fades',
    signals: [
      {
        id: 'capacity',
        label: 'Capacity',
        prompt: 'What gave you a sense of steadiness, energy, or confidence today?',
        status: 'strong',
      },
      {
        id: 'connection',
        label: 'Connection',
        prompt: 'Who or what support made today easier to carry?',
        status: 'strong',
      },
      {
        id: 'reflection',
        label: 'Reflection',
        prompt: 'What does future-you need to remember about today?',
        status: 'strong',
      },
    ],
    primaryActionType: journalEntriesToday > 0 ? 'advice' : 'journal',
    primaryActionLabel: journalEntriesToday > 0 ? 'Extend this momentum' : 'Record today’s pattern',
    actionReason: 'Positive days are useful data, not just a break from the hard ones.',
  };
};
