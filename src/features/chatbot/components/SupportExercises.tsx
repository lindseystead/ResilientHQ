/**
 * Support Exercises
 *
 * Reusable grounding and breathing exercise views used by the chatbot.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Button } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { useBreathingScale } from '@/src/shared/hooks/animation';
import { SPACING, scaleFont } from '@/src/shared/utils/responsive';
import { BREATHING_STEPS, GROUNDING_STEPS } from '../constants/chatbot';

const BREATHING_CIRCLE_SIZE = 220;

interface BreathingExerciseProps {
  currentStep: number;
  onStepComplete: () => void;
}

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({
  currentStep,
  onStepComplete,
}) => {
  const { theme } = useTheme();
  const animatedStyle = useBreathingScale(
    currentStep,
    BREATHING_STEPS[currentStep]?.duration,
    onStepComplete,
  );

  const step = BREATHING_STEPS[currentStep % BREATHING_STEPS.length];

  return (
    <View style={styles.breathingContainer}>
      <Animated.View
        style={[styles.breathingCircle, { borderColor: theme.colors.border2 }, animatedStyle]}
      >
        <Text style={[styles.breathingText, { color: theme.colors.text, fontSize: scaleFont(24) }]}>
          {step.text}
        </Text>
      </Animated.View>
    </View>
  );
};

interface GroundingExerciseProps {
  currentStep: number;
  onStepComplete: () => void;
}

export const GroundingExercise: React.FC<GroundingExerciseProps> = ({
  currentStep,
  onStepComplete,
}) => {
  const { theme } = useTheme();
  const step = GROUNDING_STEPS[currentStep];

  return (
    <View style={styles.groundingContainer}>
      <Text style={[styles.groundingText, { color: theme.colors.text, fontSize: scaleFont(18) }]}>
        {step.text}
      </Text>
      <Button
        title={currentStep < GROUNDING_STEPS.length - 1 ? 'Next' : 'Complete'}
        variant="primary"
        onPress={onStepComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  breathingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
  },
  breathingCircle: {
    minHeight: BREATHING_CIRCLE_SIZE,
    minWidth: BREATHING_CIRCLE_SIZE,
    borderRadius: BREATHING_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    borderWidth: 2,
  },
  breathingText: {
    textAlign: 'center',
    fontWeight: '700',
  },
  groundingContainer: {
    paddingVertical: SPACING.xl,
    gap: SPACING.lg,
  },
  groundingText: {
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 28,
  },
});
