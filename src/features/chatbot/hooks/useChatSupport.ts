/**
 * Chat Support Hook
 *
 * Encapsulates mood-adaptive presentation state, grounding helpers, summary
 * modal state, and journal-save prompts so the screen stays focused on layout.
 */

import {
  buildAdaptiveResiliencePlan,
  createInterventionSignalSnapshot,
  getAdaptiveResiliencePlanFeedbackForUser,
  getLatestResilienceCheckIn,
  getRecentResilienceCheckIns,
  getTopInterventionOutcomeForUser,
  getUserMoodLogs,
  hasCompletedResilienceCheckInToday,
  logInterventionEvent,
  personalizeAdaptiveResiliencePlan,
  saveJournalEntry,
  type MoodLog,
  type AdaptiveResiliencePlan,
  type AdaptiveResiliencePlanFeedback,
  type InterventionOutcomeInsight,
  type InterventionSource,
  type InterventionType,
  type ResilienceCheckInEntry,
} from '@/src/domains/wellbeing';
import type { User } from 'firebase/auth';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BREATHING_STEPS,
  GROUNDING_STEPS,
  getMoodGradient,
  getSuggestedPrompts,
} from '../constants/chatbot';
import { useTheme } from '@/src/shared/hooks';
import { buildAdaptiveChatPrompts, buildChatExperienceProfile } from '../utils/experience';
import { shouldPromptJournal } from '../utils/guardrails';

interface UseChatSupportOptions {
  user: User | null;
  traumaSafeMode: boolean;
  promptsPaused?: boolean;
  onNotifySuccess: () => void;
  onHandleError: (error: unknown, options?: { context?: string }) => void;
  onGenerateSummary: () => Promise<string | null>;
}

export const useChatSupport = ({
  user,
  traumaSafeMode,
  promptsPaused = false,
  onNotifySuccess,
  onHandleError,
  onGenerateSummary,
}: UseChatSupportOptions) => {
  const { mode } = useTheme();
  const [latestMood, setLatestMood] = useState<MoodLog | null>(null);
  const [latestCheckIn, setLatestCheckIn] = useState<ResilienceCheckInEntry | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<ResilienceCheckInEntry[]>([]);
  const [planFeedback, setPlanFeedback] = useState<AdaptiveResiliencePlanFeedback | null>(null);
  const [topInterventionOutcome, setTopInterventionOutcome] =
    useState<InterventionOutcomeInsight | null>(null);
  const [showGroundingModal, setShowGroundingModal] = useState<boolean>(false);
  const [groundingMode, setGroundingMode] = useState<'breathing' | 'grounding' | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [showJournalPrompt, setShowJournalPrompt] = useState<boolean>(false);
  const [journalPromptMessage, setJournalPromptMessage] = useState<string>('');
  const lastPromptedMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const loadSupportContext = async () => {
      if (!user) {
        setLatestMood(null);
        setLatestCheckIn(null);
        setRecentCheckIns([]);
        setPlanFeedback(null);
        setTopInterventionOutcome(null);
        return;
      }

      try {
        const [moodLogs, checkIn, checkIns] = await Promise.all([
          getUserMoodLogs(user, 1),
          getLatestResilienceCheckIn(user),
          getRecentResilienceCheckIns(user, 7),
        ]);
        setLatestMood(moodLogs[0] ?? null);
        setLatestCheckIn(checkIn);
        setRecentCheckIns(checkIns);
      } catch {
        setLatestMood(null);
        setLatestCheckIn(null);
        setRecentCheckIns([]);
        setPlanFeedback(null);
        setTopInterventionOutcome(null);
      }
    };

    void loadSupportContext();
  }, [user]);

  const moodGradient = useMemo(() => getMoodGradient(latestMood, mode), [latestMood, mode]);
  const hasCompletedCheckInToday = useMemo(
    () => hasCompletedResilienceCheckInToday(latestCheckIn),
    [latestCheckIn],
  );
  const baseResiliencePlan = useMemo<AdaptiveResiliencePlan>(
    () =>
      buildAdaptiveResiliencePlan({
        latestMood,
        latestCheckIn,
        recentEntries: recentCheckIns,
        hasCompletedCheckInToday,
      }),
    [hasCompletedCheckInToday, latestCheckIn, latestMood, recentCheckIns],
  );
  useEffect(() => {
    const loadPlanFeedback = async () => {
      if (!user) {
        setPlanFeedback(null);
        return;
      }

      try {
        const feedback = await getAdaptiveResiliencePlanFeedbackForUser(
          user.uid,
          baseResiliencePlan,
        );
        setPlanFeedback(feedback);
      } catch {
        setPlanFeedback(null);
      }
    };

    void loadPlanFeedback();
  }, [baseResiliencePlan, user]);
  useEffect(() => {
    const loadTopInterventionOutcome = async () => {
      if (!user) {
        setTopInterventionOutcome(null);
        return;
      }

      try {
        const outcome = await getTopInterventionOutcomeForUser(user.uid, recentCheckIns);
        setTopInterventionOutcome(outcome);
      } catch {
        setTopInterventionOutcome(null);
      }
    };

    void loadTopInterventionOutcome();
  }, [recentCheckIns, user]);
  const adaptivePlanFeedback = useMemo<AdaptiveResiliencePlanFeedback | null>(() => {
    if (topInterventionOutcome) {
      const stepIndex = baseResiliencePlan.steps.findIndex(
        (step) => step === topInterventionOutcome.label,
      );

      if (stepIndex >= 0) {
        return {
          stepIndex,
          stepLabel: topInterventionOutcome.label,
          helpfulnessLabel: topInterventionOutcome.summary,
        };
      }
    }

    return planFeedback;
  }, [baseResiliencePlan.steps, planFeedback, topInterventionOutcome]);
  const resiliencePlan = useMemo<AdaptiveResiliencePlan>(
    () => personalizeAdaptiveResiliencePlan(baseResiliencePlan, adaptivePlanFeedback),
    [adaptivePlanFeedback, baseResiliencePlan],
  );
  const chatExperience = useMemo(
    () =>
      buildChatExperienceProfile({
        traumaSafeMode,
        latestMood,
        latestCheckIn,
      }),
    [latestCheckIn, latestMood, traumaSafeMode],
  );
  const suggestedPrompts = useMemo(() => {
    if (promptsPaused) {
      return [];
    }

    const fallbackPrompts = buildAdaptiveChatPrompts({
      defaultPrompts: getSuggestedPrompts(latestMood),
      traumaSafeMode,
      latestMood,
      latestCheckIn,
    });

    if (recentCheckIns.length > 0 || latestMood || latestCheckIn) {
      return resiliencePlan.chatPrompts;
    }

    return fallbackPrompts;
  }, [
    latestCheckIn,
    latestMood,
    promptsPaused,
    recentCheckIns.length,
    resiliencePlan.chatPrompts,
    traumaSafeMode,
  ]);

  const reviewMessageForJournalPrompt = useCallback(
    (messageId: string, content: string) => {
      if (promptsPaused) {
        return;
      }

      if (lastPromptedMessageIdRef.current === messageId) {
        return;
      }

      if (shouldPromptJournal(content, { gentleMode: chatExperience.prefersGentleFollowUps })) {
        lastPromptedMessageIdRef.current = messageId;
        setJournalPromptMessage(content);
        setShowJournalPrompt(true);
      }
    },
    [chatExperience.prefersGentleFollowUps, promptsPaused],
  );

  const dismissJournalPrompt = useCallback(() => {
    setShowJournalPrompt(false);
    setJournalPromptMessage('');
  }, []);

  const recordIntervention = useCallback(
    (type: InterventionType, source: InterventionSource, label: string) => {
      if (!user) {
        return;
      }

      void logInterventionEvent(user.uid, {
        type,
        source,
        label,
        preSignals: createInterventionSignalSnapshot(latestCheckIn),
      }).catch(() => undefined);
    },
    [latestCheckIn, user],
  );

  const handleCreateJournal = useCallback(async () => {
    if (!user || !journalPromptMessage) {
      return;
    }

    try {
      await saveJournalEntry(
        user,
        latestMood?.moodValue ?? 2,
        'From chat conversation',
        journalPromptMessage,
      );
      recordIntervention('journal', 'chat', 'Write a brief journal reflection');
      onNotifySuccess();
      dismissJournalPrompt();
    } catch (error) {
      onHandleError(error, { context: 'Saving journal entry from chat' });
    }
  }, [
    dismissJournalPrompt,
    journalPromptMessage,
    latestMood,
    onHandleError,
    onNotifySuccess,
    recordIntervention,
    user,
  ]);

  const handleGenerateSummary = useCallback(async () => {
    setShowSummary(true);
    setSummaryText(null);

    const summary = await onGenerateSummary();
    setSummaryText(summary ?? 'Unable to generate summary. Please try again.');
  }, [onGenerateSummary]);

  const closeSummary = useCallback(() => {
    setShowSummary(false);
  }, []);

  const handleStartBreathing = useCallback(() => {
    recordIntervention('breathing', 'chat', 'Start guided breathing reset');
    setGroundingMode('breathing');
    setCurrentStep(0);
    setShowGroundingModal(true);
  }, [recordIntervention]);

  const handleStartGrounding = useCallback(() => {
    recordIntervention('grounding', 'chat', 'Start 5-4-3-2-1 grounding reset');
    setGroundingMode('grounding');
    setCurrentStep(0);
    setShowGroundingModal(true);
  }, [recordIntervention]);

  const closeGroundingModal = useCallback(() => {
    setShowGroundingModal(false);
    setGroundingMode(null);
    setCurrentStep(0);
  }, []);

  const advanceBreathingStep = useCallback(() => {
    setCurrentStep((prev) => (prev + 1) % BREATHING_STEPS.length);
  }, []);

  const advanceGroundingStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < GROUNDING_STEPS.length - 1) {
        return prev + 1;
      }

      return prev;
    });
  }, []);

  return {
    latestMood,
    latestCheckIn,
    moodGradient,
    chatExperience,
    suggestedPrompts,
    showGroundingModal,
    groundingMode,
    currentStep,
    showSummary,
    summaryText,
    showJournalPrompt,
    reviewMessageForJournalPrompt,
    dismissJournalPrompt,
    handleCreateJournal,
    handleGenerateSummary,
    closeSummary,
    handleStartBreathing,
    handleStartGrounding,
    closeGroundingModal,
    advanceBreathingStep,
    advanceGroundingStep,
  };
};
