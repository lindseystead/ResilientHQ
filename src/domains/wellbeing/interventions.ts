/**
 * Wellbeing Intervention Outcomes
 *
 * Tracks which resilience interventions the user actually tried and measures
 * whether the next structured check-in looked steadier afterward.
 */

import { UserPreferencesStorage } from '@/src/shared/utils/storage/userPreferences';
import type { ResilienceCheckInEntry } from './checkIns';

export type InterventionType = 'planStep' | 'grounding' | 'breathing' | 'journal';
export type InterventionSource = 'home' | 'chat' | 'journal';

export interface InterventionSignalSnapshot {
  stressLevel: number | null;
  safetyLevel: number | null;
  energyLevel: number | null;
  bodyTension: number | null;
}

export interface InterventionEvent {
  id: string;
  type: InterventionType;
  source: InterventionSource;
  label: string;
  preSignals: InterventionSignalSnapshot;
  loggedAt: string;
}

export interface InterventionOutcomeInsight {
  label: string;
  averageScore: number;
  eventCount: number;
  summary: string;
}

export interface LogInterventionEventInput {
  type: InterventionType;
  source: InterventionSource;
  label: string;
  preSignals: InterventionSignalSnapshot;
  loggedAt?: string | Date;
}

const INTERVENTION_EVENTS_KEY_PREFIX = 'wellbeing.interventions';
const MAX_STORED_INTERVENTION_EVENTS = 100;

const isValidInterventionType = (value: unknown): value is InterventionType =>
  value === 'planStep' || value === 'grounding' || value === 'breathing' || value === 'journal';

const isValidInterventionSource = (value: unknown): value is InterventionSource =>
  value === 'home' || value === 'chat' || value === 'journal';

const normalizeSignalValue = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
    return null;
  }

  return parsed;
};

const normalizeSignalSnapshot = (value: unknown): InterventionSignalSnapshot => {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  return {
    stressLevel: normalizeSignalValue(raw.stressLevel),
    safetyLevel: normalizeSignalValue(raw.safetyLevel),
    energyLevel: normalizeSignalValue(raw.energyLevel),
    bodyTension: normalizeSignalValue(raw.bodyTension),
  };
};

const getPreferenceKey = (userId: string): string => `${INTERVENTION_EVENTS_KEY_PREFIX}.${userId}`;

const parseDate = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeEvent = (value: unknown): InterventionEvent | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const loggedAt = parseDate(raw.loggedAt);

  if (
    typeof raw.id !== 'string' ||
    !isValidInterventionType(raw.type) ||
    !isValidInterventionSource(raw.source) ||
    typeof raw.label !== 'string' ||
    raw.label.trim().length === 0 ||
    !loggedAt
  ) {
    return null;
  }

  return {
    id: raw.id,
    type: raw.type,
    source: raw.source,
    label: raw.label.trim(),
    preSignals: normalizeSignalSnapshot(raw.preSignals),
    loggedAt: loggedAt.toISOString(),
  };
};

const getCheckInDate = (entry: ResilienceCheckInEntry): Date | null =>
  entry.createdAt instanceof Date && !Number.isNaN(entry.createdAt.getTime())
    ? entry.createdAt
    : null;

const calculateOutcomeScore = (
  preSignals: InterventionSignalSnapshot,
  postCheckIn: ResilienceCheckInEntry,
): number | null => {
  const dimensions: number[] = [];

  if (preSignals.stressLevel !== null) {
    dimensions.push(preSignals.stressLevel - postCheckIn.stressLevel);
  }

  if (preSignals.bodyTension !== null) {
    dimensions.push(preSignals.bodyTension - postCheckIn.bodyTension);
  }

  if (preSignals.safetyLevel !== null) {
    dimensions.push(postCheckIn.safetyLevel - preSignals.safetyLevel);
  }

  if (preSignals.energyLevel !== null) {
    dimensions.push(postCheckIn.energyLevel - preSignals.energyLevel);
  }

  if (dimensions.length === 0) {
    return null;
  }

  return dimensions.reduce((total, value) => total + value, 0);
};

const createInsightSummary = (): string => 'Showed the strongest next check-in improvement';

export const createInterventionSignalSnapshot = (
  latestCheckIn: ResilienceCheckInEntry | null,
): InterventionSignalSnapshot => {
  if (!latestCheckIn) {
    return {
      stressLevel: null,
      safetyLevel: null,
      energyLevel: null,
      bodyTension: null,
    };
  }

  return {
    stressLevel: normalizeSignalValue(latestCheckIn.stressLevel),
    safetyLevel: normalizeSignalValue(latestCheckIn.safetyLevel),
    energyLevel: normalizeSignalValue(latestCheckIn.energyLevel),
    bodyTension: normalizeSignalValue(latestCheckIn.bodyTension),
  };
};

export const getInterventionEvents = async (userId: string): Promise<InterventionEvent[]> => {
  const stored = await UserPreferencesStorage.getPreference<unknown[]>(
    getPreferenceKey(userId),
    [],
  );

  if (!Array.isArray(stored)) {
    return [];
  }

  return stored
    .map(normalizeEvent)
    .filter((event): event is InterventionEvent => event !== null)
    .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt));
};

export const logInterventionEvent = async (
  userId: string,
  input: LogInterventionEventInput,
): Promise<InterventionEvent> => {
  const loggedAt = parseDate(input.loggedAt ?? new Date()) ?? new Date();
  const nextEvent: InterventionEvent = {
    id: `${loggedAt.getTime().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    source: input.source,
    label: input.label.trim(),
    preSignals: normalizeSignalSnapshot(input.preSignals),
    loggedAt: loggedAt.toISOString(),
  };

  if (nextEvent.label.length === 0) {
    throw new Error('Intervention label is required');
  }

  const existingEvents = await getInterventionEvents(userId);
  const didSave = await UserPreferencesStorage.setPreference(
    getPreferenceKey(userId),
    [nextEvent, ...existingEvents].slice(0, MAX_STORED_INTERVENTION_EVENTS),
  );

  if (!didSave) {
    throw new Error('Failed to save intervention event');
  }

  return nextEvent;
};

export const buildTopInterventionOutcome = (
  events: InterventionEvent[],
  recentCheckIns: ResilienceCheckInEntry[],
): InterventionOutcomeInsight | null => {
  if (events.length === 0 || recentCheckIns.length === 0) {
    return null;
  }

  const orderedCheckIns = recentCheckIns
    .map((entry) => ({ entry, createdAt: getCheckInDate(entry) }))
    .filter(
      (item): item is { entry: ResilienceCheckInEntry; createdAt: Date } => item.createdAt !== null,
    )
    .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());

  if (orderedCheckIns.length === 0) {
    return null;
  }

  const aggregates = new Map<string, { totalScore: number; eventCount: number }>();

  events
    .map((event) => ({ event, loggedAt: parseDate(event.loggedAt) }))
    .filter((item): item is { event: InterventionEvent; loggedAt: Date } => item.loggedAt !== null)
    .sort((left, right) => left.loggedAt.getTime() - right.loggedAt.getTime())
    .forEach(({ event, loggedAt }) => {
      const nextCheckIn = orderedCheckIns.find(
        (item) => item.createdAt.getTime() > loggedAt.getTime(),
      );

      if (!nextCheckIn) {
        return;
      }

      const score = calculateOutcomeScore(event.preSignals, nextCheckIn.entry);

      if (score === null) {
        return;
      }

      const current = aggregates.get(event.label) ?? { totalScore: 0, eventCount: 0 };
      aggregates.set(event.label, {
        totalScore: current.totalScore + score,
        eventCount: current.eventCount + 1,
      });
    });

  const bestOutcome = [...aggregates.entries()]
    .map(([label, aggregate]) => ({
      label,
      averageScore: aggregate.totalScore / aggregate.eventCount,
      eventCount: aggregate.eventCount,
    }))
    .filter((aggregate) => aggregate.averageScore > 0)
    .sort((left, right) => {
      if (right.averageScore !== left.averageScore) {
        return right.averageScore - left.averageScore;
      }

      if (right.eventCount !== left.eventCount) {
        return right.eventCount - left.eventCount;
      }

      return left.label.localeCompare(right.label);
    })[0];

  if (!bestOutcome) {
    return null;
  }

  return {
    label: bestOutcome.label,
    averageScore: Number(bestOutcome.averageScore.toFixed(2)),
    eventCount: bestOutcome.eventCount,
    summary: createInsightSummary(),
  };
};

export const getTopInterventionOutcomeForUser = async (
  userId: string,
  recentCheckIns: ResilienceCheckInEntry[],
): Promise<InterventionOutcomeInsight | null> => {
  if (recentCheckIns.length === 0) {
    return null;
  }

  const events = await getInterventionEvents(userId);
  return buildTopInterventionOutcome(events, recentCheckIns);
};
