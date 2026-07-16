/**
 * Help grounding exercise components
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import { useBreathingScale } from '@/src/shared/hooks/animation';
import { Button } from '@/src/shared/ui';
import { spacing as themeSpacing } from '@/src/config/theme';
import { BREATHING_STEPS, GROUNDING_STEPS } from '../constants';

const BREATHING_CIRCLE_SIZE = 200;
const GROUNDING_STEP_BADGE_SIZE = 80;

interface BreathingExerciseProps {
  currentStep: number;
  onStepComplete: () => void;
}

interface GroundingExerciseProps {
  currentStep: number;
  onStepComplete: () => void;
  onComplete: () => void;
}

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({
  currentStep,
  onStepComplete,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();
  const animatedStyle = useBreathingScale(
    currentStep,
    BREATHING_STEPS[currentStep]?.duration,
    onStepComplete,
  );

  const step = BREATHING_STEPS[currentStep % BREATHING_STEPS.length];

  return (
    <View style={styles.breathingContainer}>
      <Animated.View
        style={[
          styles.breathingCircle,
          animatedStyle,
          {
            backgroundColor: theme.colors.primary + '15',
          },
        ]}
      >
        <Text
          style={[
            styles.breathingText,
            {
              color: theme.colors.text,
              fontSize: scaleFont(22, 0.3),
            },
          ]}
        >
          {step.text}
        </Text>
      </Animated.View>
      <Text
        style={[
          styles.breathingHint,
          {
            color: theme.colors.text2,
            fontSize: scaleFont(13, 0.3),
            marginTop: scaleSpacing(theme.spacing.lg),
          },
        ]}
      >
        Follow the circle as it expands and contracts
      </Text>
    </View>
  );
};

export const GroundingExercise: React.FC<GroundingExerciseProps> = ({
  currentStep,
  onStepComplete,
  onComplete,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();
  const step = GROUNDING_STEPS[currentStep];
  const isLastStep = currentStep >= GROUNDING_STEPS.length - 1;

  return (
    <View style={[styles.groundingExerciseContainer, { padding: scaleSpacing(theme.spacing.xl) }]}>
      <View style={[styles.groundingStepBadge, { backgroundColor: theme.colors.primary + '15' }]}>
        <Text
          style={[
            styles.groundingStepNumber,
            {
              color: theme.colors.primary,
              fontSize: scaleFont(32, 0.3),
            },
          ]}
        >
          {step.count}
        </Text>
      </View>
      <Text
        style={[
          styles.groundingStepLabel,
          {
            color: theme.colors.text,
            fontSize: scaleFont(18, 0.3),
            marginTop: scaleSpacing(theme.spacing.lg),
            marginBottom: scaleSpacing(theme.spacing.sm),
          },
        ]}
      >
        {step.text}
      </Text>
      <Text
        style={[
          styles.groundingStepHint,
          {
            color: theme.colors.text2,
            fontSize: scaleFont(13, 0.3),
            marginBottom: scaleSpacing(theme.spacing.xl),
          },
        ]}
      >
        Take your time. There is no rush.
      </Text>
      <Button
        title={isLastStep ? 'Complete' : 'Next'}
        variant="primary"
        onPress={isLastStep ? onComplete : onStepComplete}
      />
      <Text
        style={[
          styles.groundingProgress,
          {
            color: theme.colors.text2,
            fontSize: scaleFont(12, 0.3),
            marginTop: scaleSpacing(theme.spacing.md),
          },
        ]}
      >
        Step {currentStep + 1} of {GROUNDING_STEPS.length}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  breathingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: themeSpacing.xl,
  },
  breathingCircle: {
    width: BREATHING_CIRCLE_SIZE,
    height: BREATHING_CIRCLE_SIZE,
    borderRadius: BREATHING_CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathingText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  breathingHint: {
    textAlign: 'center',
  },
  groundingExerciseContainer: {
    alignItems: 'center',
  },
  groundingStepBadge: {
    width: GROUNDING_STEP_BADGE_SIZE,
    height: GROUNDING_STEP_BADGE_SIZE,
    borderRadius: GROUNDING_STEP_BADGE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groundingStepNumber: {
    fontWeight: '800',
  },
  groundingStepLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
  groundingStepHint: {
    textAlign: 'center',
  },
  groundingProgress: {
    textAlign: 'center',
  },
});
