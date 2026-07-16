/**
 * Reaction Bar Component
 *
 * Interactive reaction buttons with emoji reactions and haptic feedback.
 * Features smooth animations and mood-adaptive styling.
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useResponsive, SPACING } from '@/src/shared/utils/responsive';

const REACTIONS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💛', label: 'Support' },
  { emoji: '🙏', label: 'Grateful' },
  { emoji: '💪', label: 'Strong' },
];

export interface ReactionBarProps {
  onReaction?: (reaction: string) => void;
  initialReactions?: Record<string, number>;
}

type ThemeColors = ReturnType<typeof useTheme>['theme']['colors'];

const ReactionBar: React.FC<ReactionBarProps> = ({ onReaction, initialReactions = {} }) => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();
  const [reactions, setReactions] = useState<Record<string, number>>(initialReactions);

  const handleReaction = (emoji: string) => {
    impact('light');
    setReactions((prev) => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1,
    }));
    onReaction?.(emoji);
  };

  return (
    <View style={styles.container}>
      {REACTIONS.map((reaction) => (
        <ReactionButton
          key={reaction.emoji}
          reaction={reaction}
          count={reactions[reaction.emoji] || 0}
          onPress={handleReaction}
          scaleFont={scaleFont}
          scaleSpacing={scaleSpacing}
          themeColors={theme.colors}
        />
      ))}
    </View>
  );
};

interface ReactionButtonProps {
  reaction: { emoji: string; label: string };
  count: number;
  onPress: (emoji: string) => void;
  scaleFont: (value: number, factor?: number) => number;
  scaleSpacing: (value: number) => number;
  themeColors: ThemeColors;
}

const ReactionButton: React.FC<ReactionButtonProps> = ({
  reaction,
  count,
  onPress,
  scaleFont,
  scaleSpacing,
  themeColors,
}) => {
  const scaleValue = useSharedValue(1);

  const pressAnimation = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(scaleValue.value, { damping: 15, stiffness: 200, mass: 0.8 }) },
    ],
  }));

  const handlePressIn = useCallback(() => {
    scaleValue.value = 0.85;
  }, [scaleValue]);

  const handlePressOut = useCallback(() => {
    scaleValue.value = 1;
  }, [scaleValue]);

  return (
    <Animated.View style={pressAnimation}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(reaction.emoji)}
        style={[
          styles.reactionButton,
          {
            backgroundColor: themeColors.input,
            paddingHorizontal: scaleSpacing(SPACING.sm),
            paddingVertical: scaleSpacing(SPACING.xs),
            borderRadius: scaleSpacing(SPACING.xl - SPACING.xs),
          },
        ]}
        activeOpacity={0.7}
      >
        <Text style={[styles.emoji, { fontSize: scaleFont(18) }]}>{reaction.emoji}</Text>
        {count > 0 && (
          <Text
            style={[
              styles.count,
              {
                color: themeColors.text2,
                fontSize: scaleFont(11),
                marginLeft: scaleSpacing(SPACING.xs),
              },
            ]}
          >
            {count}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // Padding, border radius, and background applied inline
  },
  emoji: {
    // Font size applied inline
  },
  count: {
    fontWeight: '600',
  },
});

export default ReactionBar;
