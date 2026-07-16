/**
 * Adaptive Resilience Plan Card
 *
 * Home-dashboard card for showing a practical 7-day resilience plan built
 * from recent check-ins and current strain signals.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/src/config/theme';
import type { AdaptiveResiliencePlan, InterventionOutcomeInsight } from '@/src/domains/wellbeing';
import { Pressable, Text } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { withAlpha } from '@/src/shared/ui/theme/color';
import { useResponsive } from '@/src/shared/utils/responsive';

export interface AdaptiveResiliencePlanCardProps {
  plan: AdaptiveResiliencePlan;
  completedCount: number;
  completionPercent: number;
  totalSteps: number;
  mostHelpfulStepLabel?: string | null;
  strongestHelpfulnessLabel?: string | null;
  outcomeInsight?: InterventionOutcomeInsight | null;
  stepOrder?: number[];
  isLoading?: boolean;
  onPress: () => void;
}

const getPlanAccent = (
  tone: AdaptiveResiliencePlan['tone'],
  colors: ReturnType<typeof useTheme>['theme']['colors'],
): string => {
  switch (tone) {
    case 'support':
      return colors.warning;
    case 'growth':
      return colors.success;
    case 'steady':
      return colors.primary;
    case 'baseline':
    default:
      return colors.secondary;
  }
};

const getToneLabel = (tone: AdaptiveResiliencePlan['tone']): string => {
  switch (tone) {
    case 'support':
      return 'RECOVERY PLAN';
    case 'growth':
      return 'CAPACITY PLAN';
    case 'steady':
      return 'STEADY PLAN';
    case 'baseline':
    default:
      return '7-DAY PLAN';
  }
};

const AdaptiveResiliencePlanCard: React.FC<AdaptiveResiliencePlanCardProps> = ({
  plan,
  completedCount,
  completionPercent,
  totalSteps,
  mostHelpfulStepLabel = null,
  strongestHelpfulnessLabel = null,
  outcomeInsight = null,
  stepOrder,
  isLoading = false,
  onPress,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();
  const accent = getPlanAccent(plan.tone, theme.colors);
  const displayOrder =
    Array.isArray(stepOrder) && stepOrder.length === plan.steps.length
      ? stepOrder
      : plan.steps.map((_, index) => index);

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${plan.title}. ${plan.summary}. ${plan.primaryActionLabel}.`}
      style={[
        styles.card,
        {
          backgroundColor:
            theme.mode === 'dark'
              ? withAlpha(theme.colors.accent, 0.1)
              : withAlpha(theme.colors.accent, 0.05),
          borderColor: withAlpha(accent, theme.mode === 'dark' ? 0.19 : 0.13),
          borderRadius: scaleSpacing(20),
          padding: scaleSpacing(20),
          marginBottom: scaleSpacing(24),
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text variant="caption" weight="700" style={{ color: accent }}>
            {getToneLabel(plan.tone)}
          </Text>
          <Text variant="h4" style={{ marginTop: scaleSpacing(4) }}>
            {plan.title}
          </Text>
          <Text variant="body" muted style={{ marginTop: scaleSpacing(4) }}>
            {plan.summary}
          </Text>
        </View>
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: `${accent}18`,
              borderRadius: scaleSpacing(14),
              width: scaleSpacing(48),
              height: scaleSpacing(48),
            },
          ]}
        >
          <Ionicons name={plan.icon} size={scaleFont(22)} color={accent} />
        </View>
      </View>

      <View
        style={[
          styles.focusBand,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.cardStroke,
            borderRadius: scaleSpacing(16),
            padding: scaleSpacing(14),
            marginTop: scaleSpacing(16),
          },
        ]}
      >
        <Text variant="caption" weight="700" style={{ color: accent }}>
          FOCUS THIS WEEK
        </Text>
        <Text variant="caption" muted style={{ marginTop: scaleSpacing(4) }}>
          {plan.focus}
        </Text>
      </View>

      <View style={[styles.stepList, { marginTop: scaleSpacing(16) }]}>
        {displayOrder.map((stepIndex, displayIndex) => (
          <View key={`${stepIndex}-${plan.steps[stepIndex]}`} style={styles.stepRow}>
            <View
              style={[
                styles.stepBadge,
                {
                  backgroundColor: `${accent}18`,
                  borderRadius: scaleSpacing(10),
                  width: scaleSpacing(28),
                  height: scaleSpacing(28),
                },
              ]}
            >
              <Text variant="caption" weight="700" style={{ color: accent }}>
                {displayIndex + 1}
              </Text>
            </View>
            <Text variant="caption" muted style={styles.stepText}>
              {plan.steps[stepIndex]}
            </Text>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: scaleSpacing(16),
            padding: scaleSpacing(14),
            marginTop: scaleSpacing(16),
          },
        ]}
      >
        <View style={styles.footerCopy}>
          <Text variant="label" color={theme.colors.primary}>
            {plan.primaryActionLabel}
          </Text>
          <Text
            variant="caption"
            weight="600"
            style={{ marginTop: scaleSpacing(4), color: accent }}
          >
            {isLoading
              ? 'Loading weekly progress...'
              : `${completedCount} of ${totalSteps} steps marked • ${completionPercent}% complete`}
          </Text>
          <Text variant="caption" muted style={{ marginTop: scaleSpacing(4) }}>
            {outcomeInsight
              ? `Measured lift: ${outcomeInsight.label} • ${outcomeInsight.summary}${
                  outcomeInsight.eventCount > 1
                    ? ` across ${outcomeInsight.eventCount} check-ins`
                    : ''
                }`
              : mostHelpfulStepLabel && strongestHelpfulnessLabel
                ? `Most helpful so far: ${strongestHelpfulnessLabel} • ${mostHelpfulStepLabel}`
                : `What is helping: ${plan.whatHelpedLately}`}
          </Text>
          <Text variant="caption" style={{ marginTop: scaleSpacing(6), color: theme.colors.text2 }}>
            Protect this week: {plan.whatToAvoid}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={scaleFont(18)}
          color={theme.colors.text2}
          style={styles.chevron}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
    marginRight: spacing.md,
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusBand: {
    borderWidth: 1,
  },
  stepList: {
    gap: spacing.sm + spacing.xs / 2,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + spacing.xs / 2,
  },
  stepText: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerCopy: {
    flex: 1,
  },
  chevron: {
    marginLeft: spacing.md,
  },
});

export default AdaptiveResiliencePlanCard;
