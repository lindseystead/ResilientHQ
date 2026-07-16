/**
 * Resilience Check-In Sheet
 *
 * A short, structured daily check-in flow for the home dashboard.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/src/config/theme';
import type { ResilienceCheckInDraft } from '@/src/domains/wellbeing';
import { Button, Input, Pressable, Text } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { useResponsive } from '@/src/shared/utils/responsive';

interface CheckInPrompt {
  key: keyof Omit<ResilienceCheckInDraft, 'reflection'>;
  title: string;
  subtitle: string;
  lowLabel: string;
  highLabel: string;
}

const PROMPTS: CheckInPrompt[] = [
  {
    key: 'moodValue',
    title: 'How do you feel right now?',
    subtitle: 'Choose the number that best matches your current emotional state.',
    lowLabel: 'Overloaded',
    highLabel: 'Grounded',
  },
  {
    key: 'sleepQuality',
    title: 'How restorative was your sleep?',
    subtitle: 'This helps the app adjust expectations for today.',
    lowLabel: 'Drained',
    highLabel: 'Rested',
  },
  {
    key: 'energyLevel',
    title: 'How much usable energy do you have?',
    subtitle: 'Think about what you can realistically give today.',
    lowLabel: 'Empty',
    highLabel: 'Strong',
  },
  {
    key: 'stressLevel',
    title: 'How activated or stressed does your system feel?',
    subtitle: 'Rate the pressure in your mind and body right now.',
    lowLabel: 'Calm',
    highLabel: 'Flooded',
  },
  {
    key: 'bodyTension',
    title: 'How much tension is your body carrying?',
    subtitle: 'Jaw, shoulders, stomach, chest, and breath all count.',
    lowLabel: 'Loose',
    highLabel: 'Tight',
  },
  {
    key: 'connectionLevel',
    title: 'How supported or connected do you feel?',
    subtitle: 'This can be people, routine, faith, community, or structure.',
    lowLabel: 'Isolated',
    highLabel: 'Supported',
  },
  {
    key: 'safetyLevel',
    title: 'How safe and steady does today feel?',
    subtitle: 'Think emotional safety, predictability, and basic stability.',
    lowLabel: 'Unsafe',
    highLabel: 'Safe',
  },
];

const DEFAULT_DRAFT: ResilienceCheckInDraft = {
  moodValue: 3,
  sleepQuality: 3,
  energyLevel: 3,
  stressLevel: 3,
  bodyTension: 3,
  connectionLevel: 3,
  safetyLevel: 3,
  reflection: '',
};

export interface ResilienceCheckInSheetProps {
  onSubmit: (draft: ResilienceCheckInDraft) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  shouldReset: boolean;
}

const ResilienceCheckInSheet: React.FC<ResilienceCheckInSheetProps> = ({
  onSubmit,
  onCancel,
  isSaving,
  shouldReset,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [draft, setDraft] = useState<ResilienceCheckInDraft>(DEFAULT_DRAFT);

  useEffect(() => {
    if (shouldReset) {
      setStepIndex(0);
      setDraft(DEFAULT_DRAFT);
    }
  }, [shouldReset]);

  const activePrompt = PROMPTS[stepIndex];
  const isReflectionStep = stepIndex >= PROMPTS.length;
  const progressLabel = useMemo(
    () => `${Math.min(stepIndex + 1, PROMPTS.length + 1)} of ${PROMPTS.length + 1}`,
    [stepIndex],
  );

  const handleSelectValue = (value: number) => {
    if (!activePrompt) {
      return;
    }

    setDraft((current) => ({
      ...current,
      [activePrompt.key]: value,
    }));
  };

  const handleNext = async () => {
    if (!isReflectionStep) {
      setStepIndex((current) => current + 1);
      return;
    }

    await onSubmit(draft);
  };

  const handleBack = () => {
    if (stepIndex === 0) {
      onCancel();
      return;
    }

    setStepIndex((current) => Math.max(0, current - 1));
  };

  const selectedValue = activePrompt ? draft[activePrompt.key] : 0;

  return (
    <View>
      <Text variant="caption" weight="700" color={theme.colors.primary}>
        {progressLabel}
      </Text>

      {!isReflectionStep && activePrompt ? (
        <>
          <Text variant="h4" style={{ marginTop: scaleSpacing(8) }}>
            {activePrompt.title}
          </Text>
          <Text variant="body" muted style={{ marginTop: scaleSpacing(6) }}>
            {activePrompt.subtitle}
          </Text>

          <View style={styles.scaleLabels}>
            <Text variant="caption" muted>
              {activePrompt.lowLabel}
            </Text>
            <Text variant="caption" muted>
              {activePrompt.highLabel}
            </Text>
          </View>

          <View style={styles.optionRow}>
            {[1, 2, 3, 4, 5].map((value) => {
              const isSelected = selectedValue === value;

              return (
                <Pressable
                  key={value}
                  onPress={() => handleSelectValue(value)}
                  accessibilityLabel={`Choose ${value} for ${activePrompt.title}`}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border2,
                      borderRadius: scaleSpacing(14),
                      minHeight: scaleSpacing(56),
                    },
                  ]}
                >
                  <Text
                    variant="label"
                    weight="700"
                    color={isSelected ? theme.colors.white : theme.colors.text}
                    style={{ fontSize: scaleFont(18, 0.3) }}
                  >
                    {value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <>
          <Text variant="h4" style={{ marginTop: scaleSpacing(8) }}>
            One sentence to carry forward
          </Text>
          <Text variant="body" muted style={{ marginTop: scaleSpacing(6) }}>
            Optional: what does your system need, or what do you want to remember about today?
          </Text>
          <Input
            label="Reflection"
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
            value={draft.reflection ?? ''}
            onChangeText={(reflection) =>
              setDraft((current) => ({
                ...current,
                reflection,
              }))
            }
            placeholder="Example: I need fewer decisions and a 10-minute walk before I keep going."
            style={[
              styles.reflectionInput,
              {
                minHeight: scaleSpacing(120),
              },
            ]}
          />
        </>
      )}

      <View style={[styles.actions, { marginTop: scaleSpacing(16) }]}>
        <Button
          title={stepIndex === 0 ? 'Not now' : 'Back'}
          variant="outline"
          size="small"
          onPress={handleBack}
          disabled={isSaving}
          style={styles.actionButton}
        />
        <Button
          title={isReflectionStep ? 'Save check-in' : 'Next'}
          variant="primary"
          size="small"
          onPress={() => {
            void handleNext();
          }}
          loading={isSaving}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  reflectionInput: {
    paddingTop: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

export default ResilienceCheckInSheet;
