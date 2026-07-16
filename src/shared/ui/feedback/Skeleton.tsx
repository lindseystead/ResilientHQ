/**
 * Skeleton Component
 *
 * Skeleton loader with shimmer animation for loading states.
 * Used in lists, cards, and content placeholders.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useShimmer } from '@/src/shared/hooks/animation';
import { useResponsive } from '@/src/shared/utils/responsive';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height,
  borderRadius,
  style,
  variant = 'rectangular',
}) => {
  const { theme } = useTheme();
  const { scaleSpacing } = useResponsive();
  const { animatedStyle } = useShimmer();

  interface SkeletonDimensions {
    width: DimensionValue;
    height: number;
    borderRadius: number;
  }

  // Default dimensions based on variant
  const getDefaultDimensions = (): SkeletonDimensions => {
    switch (variant) {
      case 'text':
        return {
          width: width || '100%',
          height: height || scaleSpacing(16),
          borderRadius: borderRadius || theme.radius.sm,
        };
      case 'circular':
        const size = height || scaleSpacing(40);
        return {
          width: size,
          height: size,
          borderRadius: size / 2,
        };
      case 'rectangular':
      default:
        return {
          width: width || '100%',
          height: height || scaleSpacing(100),
          borderRadius: borderRadius || theme.radius.md,
        };
    }
  };

  const dimensions = getDefaultDimensions();

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: dimensions.borderRadius,
          backgroundColor: theme.colors.border2,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

/**
 * Skeleton List Item - Pre-configured skeleton for list items
 */
export const SkeletonListItem: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const { theme } = useTheme();
  const { scaleSpacing } = useResponsive();

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.listItem,
            {
              marginBottom: scaleSpacing(theme.spacing.lg),
              padding: scaleSpacing(theme.spacing.lg),
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <Skeleton variant="circular" width={scaleSpacing(40)} height={scaleSpacing(40)} />
          <View style={{ flex: 1, marginLeft: scaleSpacing(theme.spacing.md) }}>
            <Skeleton
              variant="text"
              width="60%"
              height={scaleSpacing(16)}
              style={{ marginBottom: scaleSpacing(theme.spacing.sm) }}
            />
            <Skeleton variant="text" width="100%" height={scaleSpacing(14)} />
          </View>
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
