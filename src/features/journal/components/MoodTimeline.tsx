/**
 * Mood Timeline Component
 *
 * Sparkline chart showing user's mood trends over the last 30 days.
 * Minimal visualization using Reanimated.
 */

import { Card } from '@/src/shared/ui';
import { font } from '@/src/config/theme';
import { MoodLog } from '@/src/domains/wellbeing';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

export interface MoodTimelineProps {
  moodLogs: MoodLog[];
}

const MoodTimeline: React.FC<MoodTimelineProps> = ({ moodLogs }) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  // Process last 30 days of mood data
  const chartData = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Create array of last 30 days
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      return date.toDateString();
    });

    // Map mood logs to days
    const data = days.map((day) => {
      const log = moodLogs.find(
        (l) => l.timestamp instanceof Date && l.timestamp.toDateString() === day,
      );
      return log ? log.moodValue : null;
    });

    return data;
  }, [moodLogs]);

  // Calculate points for sparkline
  const chartWidth = scaleSpacing(300); // Fixed width for chart
  const chartHeight = scaleSpacing(48); // 48px height (using direct value since not in theme)
  const padding = scaleSpacing(theme.spacing.sm); // 8px padding

  const points = useMemo(() => {
    const validData = chartData.filter((d) => d !== null) as number[];
    if (validData.length === 0) return '';

    const maxValue = 4;
    const minValue = 0;
    const range = maxValue - minValue;
    const stepX = (chartWidth - padding * 2) / (chartData.length - 1);
    const stepY = (chartHeight - padding * 2) / range;

    return chartData
      .map((value, index) => {
        if (value === null) return null;
        const x = padding + index * stepX;
        const y = chartHeight - padding - (value - minValue) * stepY;
        return `${x},${y}`;
      })
      .filter((p) => p !== null)
      .join(' ');
  }, [chartData, chartWidth, padding, chartHeight]);

  if (chartData.filter((d) => d !== null).length === 0) {
    return (
      <Card
        variant="elevated"
        padding={scaleSpacing(theme.spacing.lg)}
        marginBottom={scaleSpacing(theme.spacing.lg)}
      >
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: scaleFont(font.body, 0.3),
              marginBottom: scaleSpacing(theme.spacing.md),
            },
          ]}
        >
          Mood Timeline
        </Text>
        <Text
          style={[
            styles.emptyText,
            {
              color: theme.colors.text2,
              fontSize: scaleFont(13),
            },
          ]}
        >
          Start logging your mood to see your timeline
        </Text>
      </Card>
    );
  }

  return (
    <Card
      variant="elevated"
      padding={scaleSpacing(theme.spacing.lg)}
      marginBottom={scaleSpacing(theme.spacing.lg)}
    >
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: scaleFont(16),
            marginBottom: scaleSpacing(theme.spacing.md),
          },
        ]}
      >
        Mood Timeline (Last 30 Days)
      </Text>
      <View style={styles.chartContainer}>
        {Platform.OS !== 'web' ? (
          <Svg width={chartWidth} height={chartHeight}>
            <Polyline
              points={points}
              fill="none"
              stroke={theme.colors.primary}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : (
          // Web fallback: Simple text representation
          <View
            style={[
              styles.webFallback,
              {
                width: chartWidth,
                height: chartHeight,
              },
            ]}
          >
            <Text
              style={[
                styles.fallbackText,
                {
                  color: theme.colors.text2,
                  fontSize: scaleFont(12),
                },
              ]}
            >
              {chartData.filter((d) => d !== null).length > 0
                ? `Mood trend: ${chartData.filter((d) => d !== null).length} days logged`
                : 'No mood data'}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  webFallback: {
    // width and height applied inline with design tokens
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    textAlign: 'center',
  },
});

export default MoodTimeline;
