/**
 * Button Component
 *
 * Reusable button component with theme integration, loading states, and variants.
 * Uses the shared app theme.
 */

import React, { useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/providers/ThemeProvider';
import { font, fontWeight, layout } from '@/src/config/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: object;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  size = 'medium',
  style,
}) => {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.disabled;
    if (hasGradientBackground) return 'transparent';
    switch (variant) {
      case 'danger':
        return theme.colors.error;
      case 'outline':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) {
      return theme.colors.disabledText;
    }
    if (variant === 'outline') {
      return theme.colors.primary;
    }
    return theme.colors.white;
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return theme.colors.borderFocus;
    }
    return variant === 'danger' ? theme.colors.error : theme.colors.cardStroke;
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          minHeight: layout.touchTargetComfortable,
        }; // Ensure 48px min height
      case 'large':
        return {
          paddingVertical: theme.spacing.lg,
          paddingHorizontal: theme.spacing.xl,
          minHeight: layout.headerHeight,
        };
      default:
        return {
          paddingVertical: 14,
          paddingHorizontal: 20,
          minHeight: layout.touchTargetComfortable,
        }; // Ensure 48px min height
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return font.buttonSmall;
      case 'large':
        return font.bodyLarge;
      default:
        return font.button;
    }
  };

  const hasGradientBackground = !disabled && (variant === 'primary' || variant === 'secondary');
  const gradientColors =
    variant === 'secondary' ? theme.colors.gradientSecondary : theme.colors.gradientPrimary;
  const shadowStyle =
    variant === 'outline'
      ? {}
      : variant === 'primary'
        ? theme.elevation.high
        : theme.elevation.medium;

  // Press scale animation via onPressIn/onPressOut (no GestureDetector conflict)
  const scaleValue = useSharedValue(1);
  const pressAnimation = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(scaleValue.value, { damping: 15, stiffness: 200, mass: 0.8 }) },
    ],
  }));

  const handlePressIn = useCallback(() => {
    scaleValue.value = 0.98;
  }, [scaleValue]);

  const handlePressOut = useCallback(() => {
    scaleValue.value = 1;
  }, [scaleValue]);

  return (
    <AnimatedTouchable
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: 1,
          opacity: disabled || loading ? 0.6 : 1,
          borderRadius: theme.radius.lg,
          ...getPadding(),
          width: fullWidth ? '100%' : 'auto',
          ...shadowStyle,
        },
        pressAnimation,
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {hasGradientBackground && (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.lg }]}
        />
      )}
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={getFontSize() + 2}
              color={getTextColor()}
              style={[styles.iconLeft, { marginRight: theme.spacing.sm }]}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              {
                color: getTextColor(),
                fontSize: getFontSize(),
              },
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={getFontSize() + 2}
              color={getTextColor()}
              style={[styles.iconRight, { marginLeft: theme.spacing.sm }]}
            />
          )}
        </View>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
    // Shadow/elevation applied inline via theme.elevation.medium
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  buttonText: {
    fontWeight: fontWeight.semibold,
  },
  iconLeft: {
    // marginRight applied inline with theme.spacing.sm
  },
  iconRight: {
    // marginLeft applied inline with theme.spacing.sm
  },
});

export default Button;
