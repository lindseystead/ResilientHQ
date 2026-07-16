/**
 * Journal editor AI assist helpers
 */

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { FEATURES } from '@/src/config/constants';
import { requestChatCompletion } from '@/src/domains/ai';
import { useHaptics } from '@/src/shared/hooks/haptics';

interface UseJournalAiAssistOptions {
  entryText: string;
  onEntryTextChange: (text: string) => void;
}

const createEmptyEntryAlert = () => {
  Alert.alert('No Text', 'Please write something first before using AI assist.');
};
const createDisabledAlert = () => {
  Alert.alert('AI Disabled', 'AI journal assist is disabled in this build.');
};

const requestAiUpdate = async (
  systemPrompt: string,
  userPrompt: string,
  entryText: string,
): Promise<string | null> => {
  const response = await requestChatCompletion([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `${userPrompt}\n\n${entryText}` },
  ]);

  if (!response.content || response.error) {
    return null;
  }

  return response.content;
};

export const useJournalAiAssist = ({ entryText, onEntryTextChange }: UseJournalAiAssistOptions) => {
  const { impact, notification } = useHaptics();
  const [isAIAssisting, setIsAIAssisting] = useState(false);
  const aiEnabled = FEATURES.aiJournalAnalysisEnabled;

  const rewriteSofter = useCallback(async () => {
    if (!aiEnabled) {
      createDisabledAlert();
      return;
    }

    if (!entryText.trim()) {
      createEmptyEntryAlert();
      return;
    }

    setIsAIAssisting(true);
    impact('light');

    try {
      const nextText = await requestAiUpdate(
        'You are a compassionate writing assistant.',
        'Rewrite this journal entry in a softer, more compassionate tone. Keep the same meaning but make it gentler and more self-compassionate:',
        entryText,
      );

      if (!nextText) {
        Alert.alert('Error', 'Failed to rewrite entry. Please try again.');
        return;
      }

      onEntryTextChange(nextText);
      notification('success');
    } catch {
      Alert.alert('Error', 'Failed to rewrite entry. Please try again.');
    } finally {
      setIsAIAssisting(false);
    }
  }, [aiEnabled, entryText, impact, notification, onEntryTextChange]);

  const getInsight = useCallback(async () => {
    if (!aiEnabled) {
      createDisabledAlert();
      return;
    }

    if (!entryText.trim()) {
      createEmptyEntryAlert();
      return;
    }

    setIsAIAssisting(true);
    impact('light');

    try {
      const insight = await requestAiUpdate(
        'You are a compassionate mental wellness coach.',
        'Provide a brief, supportive insight about this journal entry. Be compassionate and helpful:',
        entryText,
      );

      if (!insight) {
        Alert.alert('Error', 'Failed to generate insight. Please try again.');
        return;
      }

      Alert.alert('AI Insight', insight);
      notification('success');
    } catch {
      Alert.alert('Error', 'Failed to generate insight. Please try again.');
    } finally {
      setIsAIAssisting(false);
    }
  }, [aiEnabled, entryText, impact, notification]);

  const shortenEntry = useCallback(async () => {
    if (!aiEnabled) {
      createDisabledAlert();
      return;
    }

    if (!entryText.trim()) {
      createEmptyEntryAlert();
      return;
    }

    setIsAIAssisting(true);
    impact('light');

    try {
      const nextText = await requestAiUpdate(
        'You are a concise writing assistant.',
        'Shorten this journal entry while keeping the key points and emotional essence:',
        entryText,
      );

      if (!nextText) {
        Alert.alert('Error', 'Failed to shorten entry. Please try again.');
        return;
      }

      onEntryTextChange(nextText);
      notification('success');
    } catch {
      Alert.alert('Error', 'Failed to shorten entry. Please try again.');
    } finally {
      setIsAIAssisting(false);
    }
  }, [aiEnabled, entryText, impact, notification, onEntryTextChange]);

  return {
    isAIAssisting,
    rewriteSofter,
    getInsight,
    shortenEntry,
  };
};
