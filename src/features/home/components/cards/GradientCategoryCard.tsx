/**
 * Gradient Category Card Component
 *
 * Reusable gradient category card with entrance animations, micro-interactions,
 * and full dark mode support. Designed for 2x2 grid layouts.
 */

import { Subtitle } from '@/src/shared/ui';
import { animation, elevation, radius } from '@/src/config/theme';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useTheme } from '@/src/providers/ThemeProvider';
import { withAlpha } from '@/src/shared/ui/theme/color';
import { useResponsive } from '@/src/shared/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export interface GradientCategoryCardProps {
  /**
   * Card title
   */
  title: string;
  /**
   * Ionicons icon name
   */
  icon: keyof typeof Ionicons.glyphMap;
  /**
   * Gradient colors [start, end]
   */
  gradient: [string, string];
  /**
   * Card size (width and height)
   */
  size: number;
  /**
   * Index for staggered animation
   */
  index: number;
  /**
   * Press handler
   */
  onPress: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const GradientCategoryCardComponent: React.FC<GradientCategoryCardProps> = ({
  title,
  icon,
  gradient,
  size,
  index,
  onPress,
}) => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();

  // Entrance animation
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const pressScale = useSharedValue(1);

  // Staggered entrance animation
  useEffect(() => {
    const delay = index * animation.staggerDelay;
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 12,
        stiffness: 180,
        mass: 1,
      }),
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: animation.entranceDuration,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [index, scale, opacity]);

  // Entrance animation style
  const entranceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Press micro-interaction
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(animation.microInteractionScale, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePress = () => {
    impact('light');
    onPress();
  };

  // Calculate icon container size based on card size — smaller for cleaner look
  const iconSize = scaleFont(20, 0.3);
  const iconContainerSize = size * 0.18; // 18% of card size for subtler icons
  const borderRadius = scaleSpacing(radius.xl);

  return (
    <Animated.View
      style={[
        entranceStyle,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <AnimatedTouchable
        activeOpacity={0.9}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${title}. Double tap to open`}
        style={[
          pressStyle,
          styles.card,
          {
            width: size,
            height: size,
            borderRadius,
          },
          elevation.medium,
        ]}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              borderRadius,
            },
          ]}
        >
          <View style={[styles.content, { padding: scaleSpacing(theme.spacing.lg) }]}>
            <View
              style={[
                styles.iconContainer,
                {
                  width: iconContainerSize,
                  height: iconContainerSize,
                  borderRadius: iconContainerSize / 2,
                  backgroundColor: withAlpha(theme.colors.white, 0.25),
                },
              ]}
            >
              <Ionicons name={icon} size={iconSize} color={theme.colors.white} />
            </View>
            <Subtitle
              color={theme.colors.white}
              style={[
                styles.title,
                {
                  marginTop: scaleSpacing(theme.spacing.sm),
                  fontWeight: '700',
                },
              ]}
            >
              {title}
            </Subtitle>
          </View>
        </LinearGradient>
      </AnimatedTouchable>
    </Animated.View>
  );
};

export const GradientCategoryCard = React.memo(GradientCategoryCardComponent);
GradientCategoryCard.displayName = 'GradientCategoryCard';

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // padding applied inline with spacing token
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
});
