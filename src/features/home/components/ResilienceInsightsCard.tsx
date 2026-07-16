/**
 * Resilience Insights Card
 *
 * Home dashboard card for showing weekly patterns from recent resilience
 * check-ins.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/src/config/theme';
import {
  type ResilienceInsightsSummary,
  type ResilienceInsightsTrend,
} from '@/src/domains/wellbeing';
import { Pressable, Text } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { withAlpha } from '@/src/shared/ui/theme/color';
import { useResponsive } from '@/src/shared/utils/responsive';

export interface ResilienceInsightsCardProps {
  insights: ResilienceInsightsSummary;
  onPress: () => void;
}

const TREND_ICON: Record<ResilienceInsightsTrend, keyof typeof Ionicons.glyphMap> = {
  improving: 'trending-up-outline',
  steady: 'remove-outline',
  needsSupport: 'trending-down-outline',
};

const getTrendColor = (
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

const ResilienceInsightsCard: React.FC<ResilienceInsightsCardProps> = ({ insights, onPress }) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();
  const trendColor = getTrendColor(insights.trend, theme.colors);

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${insights.title}. ${insights.summary}. ${insights.primaryActionLabel}.`}
      style={[
        styles.card,
        {
          backgroundColor:
            theme.mode === 'dark'
              ? withAlpha(theme.colors.info, 0.1)
              : withAlpha(theme.colors.info, 0.06),
          borderColor:
            theme.mode === 'dark'
              ? withAlpha(theme.colors.info, 0.24)
              : withAlpha(theme.colors.info, 0.12),
          borderRadius: scaleSpacing(20),
          padding: scaleSpacing(20),
          marginBottom: scaleSpacing(24),
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text variant="caption" weight="700" color={theme.colors.primary}>
            WEEKLY INSIGHTS
          </Text>
          <Text variant="h4" style={{ marginTop: scaleSpacing(4) }}>
            {insights.title}
          </Text>
          <Text variant="body" muted style={{ marginTop: scaleSpacing(4) }}>
            {insights.summary}
          </Text>
        </View>
        <View
          style={[
            styles.scoreBadge,
            {
              backgroundColor: `${trendColor}18`,
              borderRadius: scaleSpacing(14),
              paddingHorizontal: scaleSpacing(12),
              paddingVertical: scaleSpacing(10),
            },
          ]}
        >
          <Ionicons name={TREND_ICON[insights.trend]} size={scaleFont(18)} color={trendColor} />
          <Text
            variant="label"
            weight="700"
            color={trendColor}
            style={{ marginTop: scaleSpacing(4) }}
          >
            {insights.averageStability}%
          </Text>
        </View>
      </View>

      <View style={[styles.metricGrid, { marginTop: scaleSpacing(16) }]}>
        {insights.metrics.map((metric) => (
          <View
            key={metric.id}
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.cardStroke,
                borderRadius: scaleSpacing(16),
                padding: scaleSpacing(14),
              },
            ]}
          >
            <Text variant="caption" weight="600" color={theme.colors.text2}>
              {metric.label}
            </Text>
            <Text variant="h4" style={{ marginTop: scaleSpacing(6) }}>
              {metric.value}
            </Text>
            <Text variant="caption" muted style={{ marginTop: scaleSpacing(4) }}>
              {metric.detail}
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
            {insights.primaryActionLabel}
          </Text>
          <Text variant="caption" muted style={{ marginTop: scaleSpacing(2) }}>
            Strongest area: {insights.strongestArea}
          </Text>
          <Text variant="caption" muted style={{ marginTop: scaleSpacing(2) }}>
            Growth area: {insights.growthArea}
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
  scoreBadge: {
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricGrid: {
    gap: spacing.md,
  },
  metricCard: {
    borderWidth: 1,
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

export default ResilienceInsightsCard;
