/**
 * Profile Stats Component
 *
 * Displays user statistics: mood logs, journal entries, streak, AI conversations.
 * Features animated numbers and weekly progress indicator.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useFadeAnimation } from '@/src/shared/hooks/animation/useFadeAnimation';
import { useResponsive, SPACING, DIMENSIONS, scaleFont } from '@/src/shared/utils/responsive';
import { Card } from '@/src/shared/ui';

export interface ProfileStatsProps {
  moodLogsCount?: number;
  journalEntriesCount?: number;
  streakDays?: number;
  aiConversationsCount?: number;
  weeklyProgress?: number[];
}

interface AnimatedStatProps {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  index: number;
}

const AnimatedStat: React.FC<AnimatedStatProps> = ({ value, label, icon, color, index }) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();
  const animatedValue = useSharedValue(0);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      animatedValue.value = withDelay(
        index * 100,
        withSpring(value, {
          damping: 12,
          stiffness: 180,
          mass: 1,
          overshootClamping: false,
        }),
      );
      isMounted.current = true;
    } else {
      animatedValue.value = withSpring(value, {
        damping: 12,
        stiffness: 180,
        mass: 1,
        overshootClamping: false,
      });
    }
  }, [value, index, animatedValue]);

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: theme.colors.text,
    fontSize: scaleFont(24),
    fontWeight: '800',
  }));

  const iconSize = scaleFont(DIMENSIONS.iconSize);
  const iconContainerSize = scaleSpacing(SPACING.xxl);

  return (
    <View style={styles.statItem}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: color + '20',
            width: iconContainerSize,
            height: iconContainerSize,
            borderRadius: iconContainerSize / 2,
            marginBottom: scaleSpacing(SPACING.sm),
          },
        ]}
      >
        <Ionicons name={icon} size={iconSize} color={color} />
      </View>
      <Animated.Text style={animatedTextStyle}>{Math.round(animatedValue.value)}</Animated.Text>
      <Text
        style={[
          styles.statLabel,
          {
            color: theme.colors.text2,
            fontSize: scaleFont(12),
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const ProfileStats: React.FC<ProfileStatsProps> = ({
  moodLogsCount = 0,
  journalEntriesCount = 0,
  streakDays = 0,
  aiConversationsCount = 0,
  weeklyProgress = [],
}) => {
  const { theme } = useTheme();
  const { scaleSpacing } = useResponsive();

  const cardAnimation = useFadeAnimation({
    initialOpacity: 0,
    targetOpacity: 1,
    duration: 600,
    delay: 200,
    autoStart: true,
  });

  const stats = [
    {
      value: moodLogsCount,
      label: 'Mood Logs',
      icon: 'happy-outline' as const,
      color: theme.colors.primary,
    },
    {
      value: journalEntriesCount,
      label: 'Journal Entries',
      icon: 'book-outline' as const,
      color: theme.colors.secondary,
    },
    {
      value: streakDays,
      label: 'Day Streak',
      icon: 'flame-outline' as const,
      color: theme.colors.error,
    },
    {
      value: aiConversationsCount,
      label: 'AI Chats',
      icon: 'chatbubbles-outline' as const,
      color: theme.colors.accent,
    },
  ];

  return (
    <Animated.View style={cardAnimation.animatedStyle}>
      <Card variant="elevated" padding={scaleSpacing(SPACING.xl)}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: scaleFont(18),
              marginBottom: scaleSpacing(SPACING.lg),
            },
          ]}
        >
          Your Stats
        </Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <AnimatedStat
              key={stat.label}
              value={stat.value}
              label={stat.label}
              icon={stat.icon}
              color={stat.color}
              index={index}
            />
          ))}
        </View>
        {/* Weekly Progress Indicator (simplified sparkline) */}
        {weeklyProgress.length > 0 && (
          <View
            style={[
              styles.progressContainer,
              {
                marginTop: scaleSpacing(SPACING.lg),
                paddingTop: scaleSpacing(SPACING.lg),
                borderTopColor: theme.colors.border2,
                borderTopWidth: 1,
              },
            ]}
          >
            <Text
              style={[
                styles.progressLabel,
                {
                  color: theme.colors.text2,
                  fontSize: scaleFont(12),
                  marginBottom: scaleSpacing(SPACING.sm),
                },
              ]}
            >
              Weekly Progress
            </Text>
            <View style={styles.sparkline}>
              {weeklyProgress.map((value, index) => {
                const maxValue = Math.max(...weeklyProgress, 1);
                const height = (value / maxValue) * 40;
                return (
                  <View
                    key={index}
                    style={[
                      styles.sparklineBar,
                      {
                        height: height || 4,
                        backgroundColor: theme.colors.primary,
                        width: scaleSpacing(SPACING.sm),
                        marginRight: scaleSpacing(SPACING.xs),
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>
        )}
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // Size, border radius, background color, and margin applied inline
  },
  statLabel: {
    fontWeight: '500',
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  progressContainer: {
    // Margin, padding, and border applied inline
  },
  progressLabel: {
    fontWeight: '500',
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
  },
  sparklineBar: {
    borderRadius: SPACING.xs / 2,
    // Height, width, background color, and margin applied inline
  },
});

export default ProfileStats;
