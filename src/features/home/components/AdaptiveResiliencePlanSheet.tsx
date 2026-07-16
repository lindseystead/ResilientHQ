/**
 * Adaptive Resilience Plan Sheet
 *
 * Detailed weekly plan surface with step tracking so the user can work the
 * plan intentionally instead of treating it as a static recommendation.
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/src/config/theme';
import {
  getAdaptiveResilienceStepHelpfulnessLabel,
  type AdaptiveResiliencePlan,
  type InterventionOutcomeInsight,
  type AdaptiveResilienceStepHelpfulness,
} from '@/src/domains/wellbeing';
import { Button, Card, Pressable, Text } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { withAlpha } from '@/src/shared/ui/theme/color';
import { formatDate } from '@/src/shared/utils/format';
import { useResponsive } from '@/src/shared/utils/responsive';

export interface AdaptiveResiliencePlanSheetProps {
  plan: AdaptiveResiliencePlan;
  completedStepIndexes: number[];
  helpfulnessByStep: Record<string, AdaptiveResilienceStepHelpfulness>;
  completionPercent: number;
  completedCount: number;
  weekKey: string;
  isLoading?: boolean;
  hasCompletedCheckInToday: boolean;
  mostHelpfulStepLabel?: string | null;
  strongestHelpfulnessLabel?: string | null;
  outcomeInsight?: InterventionOutcomeInsight | null;
  stepOrder?: number[];
  onToggleStep: (index: number) => void;
  onRateStep: (index: number, helpfulness: AdaptiveResilienceStepHelpfulness) => void;
  onReset: () => void;
  onPrimaryAction: () => void;
  onOpenDailyCheckIn: () => void;
}

const HELPFULNESS_OPTIONS: { value: AdaptiveResilienceStepHelpfulness; label: string }[] = [
  { value: 1, label: 'A little' },
  { value: 2, label: 'Some' },
  { value: 3, label: 'A lot' },
];

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

const parseWeekKey = (weekKey: string): Date => {
  const [year, month, day] = weekKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const AdaptiveResiliencePlanSheet: React.FC<AdaptiveResiliencePlanSheetProps> = ({
  plan,
  completedStepIndexes,
  helpfulnessByStep,
  completionPercent,
  completedCount,
  weekKey,
  isLoading = false,
  hasCompletedCheckInToday,
  mostHelpfulStepLabel = null,
  strongestHelpfulnessLabel = null,
  outcomeInsight = null,
  stepOrder,
  onToggleStep,
  onRateStep,
  onReset,
  onPrimaryAction,
  onOpenDailyCheckIn,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();
  const accent = getPlanAccent(plan.tone, theme.colors);
  const totalSteps = plan.steps.length;
  const displayOrder =
    Array.isArray(stepOrder) && stepOrder.length === plan.steps.length
      ? stepOrder
      : plan.steps.map((_, index) => index);

  const weekLabel = useMemo(() => {
    const start = parseWeekKey(weekKey);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return `${formatDate(start, 'MMM d')} to ${formatDate(end, 'MMM d')}`;
  }, [weekKey]);

  return (
    <View>
      <Text variant="caption" weight="700" style={{ color: accent }}>
        THIS WEEK
      </Text>
      <Text variant="h4" style={{ marginTop: scaleSpacing(8) }}>
        {plan.title}
      </Text>
      <Text variant="body" muted style={{ marginTop: scaleSpacing(6) }}>
        {plan.summary}
      </Text>

      <Card
        variant="outlined"
        marginBottom={0}
        style={[
          styles.progressCard,
          {
            marginTop: scaleSpacing(16),
            borderColor: withAlpha(accent, 0.14),
          },
        ]}
      >
        <View style={styles.progressHeader}>
          <View style={styles.progressCopy}>
            <Text variant="caption" weight="700" style={{ color: accent }}>
              WEEKLY PROGRESS
            </Text>
            <Text variant="label" style={{ marginTop: scaleSpacing(4) }}>
              {weekLabel}
            </Text>
          </View>
          <View
            style={[
              styles.progressBadge,
              {
                backgroundColor: `${accent}18`,
                borderRadius: scaleSpacing(12),
                paddingHorizontal: scaleSpacing(12),
                paddingVertical: scaleSpacing(8),
              },
            ]}
          >
            <Text variant="label" weight="700" style={{ color: accent }}>
              {isLoading ? '...' : `${completionPercent}%`}
            </Text>
          </View>
        </View>
        <Text variant="caption" muted style={{ marginTop: scaleSpacing(8) }}>
          {completedCount} of {totalSteps} steps marked this week
        </Text>
        <Text variant="caption" muted style={{ marginTop: scaleSpacing(6) }}>
          {plan.focus}
        </Text>
        {outcomeInsight ? (
          <Text variant="caption" style={{ marginTop: scaleSpacing(8), color: theme.colors.text2 }}>
            Measured lift: {outcomeInsight.label} • {outcomeInsight.summary}
            {outcomeInsight.eventCount > 1
              ? ` across ${outcomeInsight.eventCount} next check-ins`
              : ''}
          </Text>
        ) : mostHelpfulStepLabel && strongestHelpfulnessLabel ? (
          <Text variant="caption" style={{ marginTop: scaleSpacing(8), color: theme.colors.text2 }}>
            Most helpful so far: {strongestHelpfulnessLabel} • {mostHelpfulStepLabel}
          </Text>
        ) : null}
      </Card>

      <View style={[styles.stepList, { marginTop: scaleSpacing(16) }]}>
        {displayOrder.map((stepIndex, displayIndex) => {
          const step = plan.steps[stepIndex];
          const isCompleted = completedStepIndexes.includes(stepIndex);
          const selectedHelpfulness = helpfulnessByStep[String(stepIndex)] ?? null;

          return (
            <View
              key={`${stepIndex}-${step}`}
              style={[
                styles.stepRow,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: scaleSpacing(16),
                  padding: scaleSpacing(14),
                  borderColor: isCompleted ? withAlpha(accent, 0.2) : theme.colors.cardStroke,
                },
              ]}
            >
              <Pressable
                onPress={() => onToggleStep(stepIndex)}
                disabled={isLoading}
                accessibilityLabel={`${
                  isCompleted ? 'Completed' : 'Incomplete'
                } step ${displayIndex + 1}. ${step}`}
                style={styles.stepToggle}
              >
                <View
                  style={[
                    styles.stepIcon,
                    {
                      backgroundColor: isCompleted ? accent : `${accent}12`,
                      borderRadius: scaleSpacing(12),
                      width: scaleSpacing(34),
                      height: scaleSpacing(34),
                    },
                  ]}
                >
                  <Ionicons
                    name={isCompleted ? 'checkmark' : 'ellipse-outline'}
                    size={scaleFont(16)}
                    color={isCompleted ? theme.colors.white : accent}
                  />
                </View>
                <View style={styles.stepCopy}>
                  <Text variant="label">{`Step ${displayIndex + 1}`}</Text>
                  <Text variant="caption" muted style={{ marginTop: scaleSpacing(4) }}>
                    {step}
                  </Text>
                </View>
              </Pressable>
              {isCompleted ? (
                <View style={[styles.ratingBlock, { marginTop: scaleSpacing(12) }]}>
                  <Text variant="caption" weight="600" color={theme.colors.text2}>
                    How much did this help?
                  </Text>
                  <View style={[styles.ratingRow, { marginTop: scaleSpacing(8) }]}>
                    {HELPFULNESS_OPTIONS.map((option) => {
                      const isSelected = selectedHelpfulness === option.value;

                      return (
                        <Pressable
                          key={`${stepIndex}-${option.value}`}
                          onPress={() => onRateStep(stepIndex, option.value)}
                          disabled={isLoading}
                          accessibilityLabel={`Rate step ${displayIndex + 1} as ${option.label}`}
                          style={[
                            styles.ratingChip,
                            {
                              backgroundColor: isSelected ? `${accent}16` : theme.colors.surface,
                              borderColor: isSelected
                                ? withAlpha(accent, 0.25)
                                : theme.colors.cardStroke,
                              borderRadius: scaleSpacing(999),
                              paddingHorizontal: scaleSpacing(12),
                              paddingVertical: scaleSpacing(8),
                            },
                          ]}
                        >
                          <Text
                            variant="caption"
                            weight={isSelected ? '700' : '600'}
                            style={{ color: isSelected ? accent : theme.colors.text2 }}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {selectedHelpfulness ? (
                    <Text variant="caption" muted style={{ marginTop: scaleSpacing(8) }}>
                      {getAdaptiveResilienceStepHelpfulnessLabel(selectedHelpfulness)}
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <Card
        variant="outlined"
        marginBottom={0}
        style={[
          styles.guidanceCard,
          {
            marginTop: scaleSpacing(16),
            borderColor: theme.colors.cardStroke,
          },
        ]}
      >
        <Text variant="caption" weight="700" color={theme.colors.text2}>
          WHAT IS HELPING
        </Text>
        <Text variant="caption" muted style={{ marginTop: scaleSpacing(6) }}>
          {plan.whatHelpedLately}
        </Text>
        {outcomeInsight ? (
          <>
            <Text
              variant="caption"
              weight="700"
              color={theme.colors.text2}
              style={{ marginTop: scaleSpacing(14) }}
            >
              OBSERVED AFTEREFFECT
            </Text>
            <Text variant="caption" muted style={{ marginTop: scaleSpacing(6) }}>
              {outcomeInsight.label} has {outcomeInsight.summary.toLowerCase()}
              {outcomeInsight.eventCount > 1
                ? ` across ${outcomeInsight.eventCount} tracked follow-up check-ins`
                : ' in the next tracked check-in'}
              .
            </Text>
          </>
        ) : null}

        <Text
          variant="caption"
          weight="700"
          color={theme.colors.text2}
          style={{ marginTop: scaleSpacing(14) }}
        >
          PROTECT THIS WEEK
        </Text>
        <Text variant="caption" muted style={{ marginTop: scaleSpacing(6) }}>
          {plan.whatToAvoid}
        </Text>

        <Text
          variant="caption"
          weight="700"
          color={theme.colors.text2}
          style={{ marginTop: scaleSpacing(14) }}
        >
          REFLECTION PROMPT
        </Text>
        <Text variant="caption" style={{ marginTop: scaleSpacing(6), color: theme.colors.text }}>
          {plan.reflectionPrompt}
        </Text>
      </Card>

      <View style={[styles.actions, { marginTop: scaleSpacing(16) }]}>
        {!hasCompletedCheckInToday ? (
          <Button
            title="Complete today’s check-in"
            variant="outline"
            size="small"
            onPress={onOpenDailyCheckIn}
            disabled={isLoading}
            style={styles.actionButton}
          />
        ) : null}
        <Button
          title={plan.primaryActionLabel}
          variant="primary"
          size="small"
          onPress={onPrimaryAction}
          disabled={isLoading}
          style={styles.actionButton}
        />
        {completedCount > 0 ? (
          <Button
            title="Reset weekly progress"
            variant="outline"
            size="small"
            onPress={onReset}
            disabled={isLoading}
            style={styles.actionButton}
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressCard: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCopy: {
    flex: 1,
  },
  progressBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepList: {
    gap: spacing.sm + spacing.xs / 2,
  },
  stepRow: {
    borderWidth: 1,
  },
  stepToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepCopy: {
    flex: 1,
  },
  ratingBlock: {
    width: '100%',
  },
  ratingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ratingChip: {
    borderWidth: 1,
  },
  guidanceCard: {
    width: '100%',
  },
  actions: {
    gap: spacing.sm + spacing.xs / 2,
  },
  actionButton: {
    width: '100%',
  },
});

export default AdaptiveResiliencePlanSheet;
