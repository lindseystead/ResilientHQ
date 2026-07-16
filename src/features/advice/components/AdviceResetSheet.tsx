/**
 * Advice reset flow bottom sheet
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet, Body, Button, Title } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { useResponsive } from '@/src/shared/utils/responsive';
import { ADVICE_RESET_STEPS } from '../constants';

interface AdviceResetSheetProps {
  visible: boolean;
  resetStep: number;
  onClose: () => void;
  onNextStep: () => void;
}

export const AdviceResetSheet: React.FC<AdviceResetSheetProps> = ({
  visible,
  resetStep,
  onClose,
  onNextStep,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();
  const step = ADVICE_RESET_STEPS[resetStep];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="1-Minute Reset" snapPoints={['40%']}>
      <View style={styles.resetContent}>
        <View
          style={[
            styles.resetStepContainer,
            {
              paddingVertical: scaleSpacing(theme.spacing.lg),
            },
          ]}
        >
          <Ionicons name={step.icon} size={scaleFont(48, 0.3)} color={theme.colors.primary} />
          <Title
            style={[
              styles.resetStepTitle,
              {
                fontSize: scaleFont(24, 0.3),
                marginTop: scaleSpacing(theme.spacing.md),
                marginBottom: scaleSpacing(theme.spacing.md),
              },
            ]}
          >
            {step.title}
          </Title>
          <Body
            style={[
              styles.resetStepInstruction,
              {
                fontSize: scaleFont(16, 0.3),
                paddingHorizontal: scaleSpacing(theme.spacing.lg),
              },
            ]}
          >
            {step.instruction}
          </Body>
        </View>
        <Button
          title={resetStep < ADVICE_RESET_STEPS.length - 1 ? 'Next Step' : 'Complete'}
          onPress={onNextStep}
          variant="primary"
          style={[styles.resetButton, { marginTop: scaleSpacing(theme.spacing.lg) }]}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  resetContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  resetStepContainer: {
    alignItems: 'center',
  },
  resetStepTitle: {
    textAlign: 'center',
  },
  resetStepInstruction: {
    lineHeight: 24,
    textAlign: 'center',
  },
  resetButton: {
    // marginTop applied inline
  },
});
