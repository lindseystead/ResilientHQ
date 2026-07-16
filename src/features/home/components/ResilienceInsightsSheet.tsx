/**
 * Resilience Insights Sheet
 *
 * Detailed weekly trends surface for the home dashboard. It gives users a
 * readable snapshot of recent check-ins and a clear next step.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/src/config/theme';
import {
  type InterventionOutcomeInsight,
  type ResilienceCheckInEntry,
  type ResilienceInsightsSummary,
  type ResilienceInsightsTrend,
} from '@/src/domains/wellbeing';
import { useTheme } from '@/src/shared/hooks';
import { formatDate } from '@/src/shared/utils/format';
import { useResponsive } from '@/src/shared/utils/responsive';
import { Button, Text } from '@/src/shared/ui';

export interface ResilienceInsightsSheetProps {
  insights: ResilienceInsightsSummary;
  entries: ResilienceCheckInEntry[];
  outcomeInsight?: InterventionOutcomeInsight | null;
  hasCompletedCheckInToday: boolean;
  onPrimaryAction: () => void;
  onOpenDailyCheckIn: () => void;
}

const getTrendAccent = (
  trend: ResilienceInsightsTrend,
  colors: ReturnType<typeof useTheme>['theme']['colors'],
): string => {
  switch (trend) {
    case 'improving':
      return colors.success;
    case 'needsSupport':
      return colors.warning;
    case 'steady':
    default:
      return colors.primary;
  }
};

const getEntryState = (
  entry: ResilienceCheckInEntry,
): { label: string; emphasis: 'soft' | 'steady' | 'strong' } => {
  const averageStability =
    [
      entry.moodValue,
      entry.sleepQuality,
      entry.energyLevel,
      6 - entry.stressLevel,
      6 - entry.bodyTension,
      entry.connectionLevel,
      entry.safetyLevel,
    ].reduce((total, value) => total + value, 0) / 7;

  if (averageStability >= 3.8) {
    return { label: 'Grounded', emphasis: 'strong' };
  }

  if (averageStability <= 2.6) {
    return { label: 'Tender', emphasis: 'soft' };
  }

  return { label: 'Steady', emphasis: 'steady' };
};

const getEntryStateColor = (
  emphasis: 'soft' | 'steady' | 'strong',
  colors: ReturnType<typeof useTheme>['theme']['colors'],
): string => {
  switch (emphasis) {
    case 'soft':
      return colors.warning;
    case 'strong':
      return colors.success;
    case 'steady':
    default:
      return colors.primary;
  }
};

const ResilienceInsightsSheet: React.FC<ResilienceInsightsSheetProps> = ({
  insights,
  entries,
  outcomeInsight = null,
  hasCompletedCheckInToday,
  onPrimaryAction,
  onOpenDailyCheckIn,
}) => {
  const { theme } = useTheme();
  const { scaleSpacing } = useResponsive();
  const trendColor = getTrendAccent(insights.trend, theme.colors);
  const recentEntries = useMemo(() => entries.slice(0, 5), [entries]);

  return (
    <View>
      <Text variant="caption" weight="700" color={trendColor}>
        LAST {Math.max(recentEntries.length, 1)} CHECK-INS
      </Text>
      <Text variant="h4" style={{ marginTop: scaleSpacing(8) }}>
        Track what helps you stay steady
      </Text>
      <Text variant="body" muted style={{ marginTop: scaleSpacing(6) }}>
        {insights.summary}
      </Text>

      <View
        style={[
          styles.summaryCard,
          {
            marginTop: scaleSpacing(16),
            borderRadius: scaleSpacing(18),
            padding: scaleSpacing(16),
            backgroundColor: theme.colors.surface,
            borderColor: `${trendColor}24`,
          },
        ]}
      >
        <View style={styles.summaryHeader}>
          <View style={styles.summaryMetric}>
            <Text variant="caption" weight="600" color={theme.colors.text2}>
              Stability
            </Text>
            <Text variant="h3" style={{ marginTop: scaleSpacing(4) }}>
              {insights.averageStability}%
            </Text>
          </View>
          <View style={styles.summaryMetric}>
            <Text variant="caption" weight="600" color={theme.colors.text2}>
              Strongest area
            </Text>
            <Text variant="label" style={{ marginTop: scaleSpacing(4) }}>
              {insights.strongestArea}
            </Text>
          </View>
        </View>
        <Text variant="caption" muted style={{ marginTop: scaleSpacing(12) }}>
          Growth edge: {insights.growthArea}
        </Text>
      </View>

      {outcomeInsight ? (
        <View
          style={[
            styles.learningCard,
            {
              marginTop: scaleSpacing(16),
              borderRadius: scaleSpacing(18),
              padding: scaleSpacing(16),
              backgroundColor: theme.colors.surface,
              borderColor: `${trendColor}20`,
            },
          ]}
        >
          <Text variant="caption" weight="700" color={theme.colors.text2}>
            WHAT YOUR CHECK-INS SHOW
          </Text>
          <Text variant="label" style={{ marginTop: scaleSpacing(8) }}>
            {outcomeInsight.label}
          </Text>
          <Text variant="caption" muted style={{ marginTop: scaleSpacing(6) }}>
            {outcomeInsight.summary}
            {outcomeInsight.eventCount > 1
              ? ` across ${outcomeInsight.eventCount} follow-up check-ins`
              : ' in the next follow-up check-in'}
            .
          </Text>
        </View>
      ) : null}

      <View style={[styles.historyList, { marginTop: scaleSpacing(16) }]}>
        {recentEntries.length > 0 ? (
          recentEntries.map((entry) => {
            const state = getEntryState(entry);
            const stateColor = getEntryStateColor(state.emphasis, theme.colors);

            return (
              <View
                key={entry.id ?? `${entry.userId}-${String(entry.createdAt)}`}
                style={[
                  styles.historyRow,
                  {
                    borderRadius: scaleSpacing(16),
                    padding: scaleSpacing(14),
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.cardStroke,
                  },
                ]}
              >
                <View style={styles.historyTopRow}>
                  <Text variant="label">{formatDate(entry.createdAt, 'EEE, MMM d')}</Text>
                  <Text variant="caption" weight="700" color={stateColor}>
                    {state.label}
                  </Text>
                </View>
                <Text variant="caption" muted style={{ marginTop: scaleSpacing(6) }}>
                  Energy {entry.energyLevel}/5 • Stress {entry.stressLevel}/5 • Safety{' '}
                  {entry.safetyLevel}/5
                </Text>
                {entry.reflection ? (
                  <Text
                    variant="caption"
                    style={{ marginTop: scaleSpacing(6), color: theme.colors.text2 }}
                  >
                    {entry.reflection}
                  </Text>
                ) : null}
              </View>
            );
          })
        ) : (
          <View
            style={[
              styles.emptyState,
              {
                borderRadius: scaleSpacing(16),
                padding: scaleSpacing(14),
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.cardStroke,
              },
            ]}
          >
            <Text variant="caption" muted>
              As you complete check-ins, this space will show the days that felt steadier and the
              days that asked for more care.
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.actions, { marginTop: scaleSpacing(16) }]}>
        {!hasCompletedCheckInToday ? (
          <Button
            title="Complete today’s check-in"
            variant="outline"
            size="small"
            onPress={onOpenDailyCheckIn}
            style={styles.actionButton}
          />
        ) : null}
        <Button
          title={insights.primaryActionLabel}
          variant="primary"
          size="small"
          onPress={onPrimaryAction}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    borderWidth: 1,
  },
  learningCard: {
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryMetric: {
    flex: 1,
  },
  historyList: {
    gap: spacing.sm + spacing.xs / 2,
  },
  historyRow: {
    borderWidth: 1,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyState: {
    borderWidth: 1,
  },
  actions: {
    gap: spacing.sm + spacing.xs / 2,
  },
  actionButton: {
    width: '100%',
  },
});

export default ResilienceInsightsSheet;
