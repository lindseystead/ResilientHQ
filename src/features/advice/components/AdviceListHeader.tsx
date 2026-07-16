/**
 * Advice list header
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { AffirmationBlock, Body, Card, ResiliencePlanCard } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { useResponsive } from '@/src/shared/utils/responsive';

type ResiliencePlanCardProps = React.ComponentProps<typeof ResiliencePlanCard>;

interface AdviceListHeaderProps {
  streak: number;
  isLoadingStreak: boolean;
  resiliencePlan: Omit<ResiliencePlanCardProps, 'isLoading'>;
  isLoadingMood: boolean;
  affirmation: string;
  isLoadingAffirmation: boolean;
  onRefreshAffirmation: () => void;
  onShuffle: () => void;
  moodCardAnimatedStyle: object;
  affirmationAnimatedStyle: object;
  tipsAnimatedStyle: object;
}

export const AdviceListHeader: React.FC<AdviceListHeaderProps> = ({
  streak,
  isLoadingStreak,
  resiliencePlan,
  isLoadingMood,
  affirmation,
  isLoadingAffirmation,
  onRefreshAffirmation,
  onShuffle,
  moodCardAnimatedStyle,
  affirmationAnimatedStyle,
  tipsAnimatedStyle,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  return (
    <>
      {!isLoadingStreak && streak > 0 && (
        <Animated.View style={[moodCardAnimatedStyle]}>
          <Card>
            <View
              style={[
                styles.streakContent,
                {
                  gap: scaleSpacing(theme.spacing.sm),
                },
              ]}
            >
              <Ionicons name="flame" size={scaleFont(24, 0.3)} color={theme.colors.secondary} />
              <Body style={[styles.streakText, { fontSize: scaleFont(16, 0.3) }]}>
                {streak} day{streak !== 1 ? 's' : ''} streak
              </Body>
            </View>
          </Card>
        </Animated.View>
      )}

      <Animated.View style={[moodCardAnimatedStyle]}>
        <ResiliencePlanCard {...resiliencePlan} isLoading={isLoadingMood} />
      </Animated.View>

      <Animated.View style={affirmationAnimatedStyle}>
        <AffirmationBlock
          affirmation={affirmation}
          isLoading={isLoadingAffirmation}
          onRefresh={onRefreshAffirmation}
        />
      </Animated.View>

      <Animated.View style={[tipsAnimatedStyle]}>
        <TouchableOpacity
          onPress={onShuffle}
          style={[
            styles.shuffleButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border2,
              paddingVertical: scaleSpacing(theme.spacing.md),
              paddingHorizontal: scaleSpacing(theme.spacing.lg),
              borderRadius: scaleSpacing(theme.spacing.md),
              gap: scaleSpacing(theme.spacing.sm),
            },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons name="shuffle" size={scaleFont(20, 0.3)} color={theme.colors.primary} />
          <Body
            style={[
              styles.shuffleText,
              {
                color: theme.colors.primary,
                fontSize: scaleFont(16, 0.3),
              },
            ]}
          >
            Shuffle Advice
          </Body>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontWeight: '600',
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  shuffleText: {
    fontWeight: '600',
  },
});
