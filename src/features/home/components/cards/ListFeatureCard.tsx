/**
 * List Feature Card Component
 *
 * Reusable horizontal list card with icon, label, and CTA button.
 * Used in "More Features" section and similar list contexts.
 */

import { Label, Subtitle } from '@/src/shared/ui';
import { animation, elevation, font, radius } from '@/src/config/theme';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export interface ListFeatureCardProps {
  /**
   * Feature label
   */
  label: string;
  /**
   * Ionicons icon name
   */
  icon: keyof typeof Ionicons.glyphMap;
  /**
   * CTA button text (default: "START")
   */
  ctaText?: string;
  /**
   * Press handler
   */
  onPress: () => void;
  /**
   * Optional icon color override
   */
  iconColor?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ListFeatureCardComponent: React.FC<ListFeatureCardProps> = ({
  label,
  icon,
  ctaText = 'START',
  onPress,
  iconColor,
}) => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();

  const cardScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  // Card press animation
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  // Button press animation
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleCardPressIn = () => {
    cardScale.value = withSpring(animation.microInteractionScale, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handleCardPressOut = () => {
    cardScale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePress = () => {
    impact('light');
    onPress();
  };

  const iconColorValue = iconColor || theme.colors.primary;
  const borderRadius = scaleSpacing(radius.xl);
  const iconContainerSize = scaleSpacing(theme.spacing['3xl']);

  return (
    <AnimatedTouchable
      activeOpacity={0.9}
      onPress={handlePress}
      onPressIn={handleCardPressIn}
      onPressOut={handleCardPressOut}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Double tap to open`}
      style={[
        cardAnimatedStyle,
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius,
          padding: scaleSpacing(theme.spacing.lg),
        },
        elevation.medium,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: iconColorValue + '15',
            width: iconContainerSize,
            height: iconContainerSize,
            borderRadius: scaleSpacing(radius.md),
            marginRight: scaleSpacing(theme.spacing.md),
          },
        ]}
      >
        <Ionicons name={icon} size={scaleFont(20, 0.3)} color={iconColorValue} />
      </View>
      <View style={styles.textContainer}>
        <Subtitle style={{ fontWeight: '600' }}>{label}</Subtitle>
      </View>
      <AnimatedTouchable
        activeOpacity={0.8}
        onPress={handlePress}
        onPressIn={handleButtonPressIn}
        onPressOut={handleButtonPressOut}
        style={[
          buttonAnimatedStyle,
          styles.button,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border2,
            borderWidth: 1,
            borderRadius: scaleSpacing(radius.md),
            paddingVertical: scaleSpacing(theme.spacing.sm),
            paddingHorizontal: scaleSpacing(theme.spacing.lg),
          },
        ]}
      >
        <Label style={{ fontSize: scaleFont(font.labelSmall, 0.3), fontWeight: '600' }}>
          {ctaText}
        </Label>
      </AnimatedTouchable>
    </AnimatedTouchable>
  );
};

export const ListFeatureCard = React.memo(ListFeatureCardComponent);
ListFeatureCard.displayName = 'ListFeatureCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    // marginRight applied inline with spacing token
  },
  textContainer: {
    flex: 1,
  },
  button: {
    // Styles applied inline
  },
});
