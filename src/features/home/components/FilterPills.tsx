/**
 * Filter Pills Component
 *
 * Reusable filter pill selector with smooth animations and theme-aware styling.
 * Supports multiple options with selected state management.
 * Uses stable, hook-driven animations.
 */

import { Label } from '@/src/shared/ui';
import { elevation, radius, spacing } from '@/src/config/theme';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterPillsProps {
  /**
   * Array of filter options
   */
  options: FilterOption[];
  /**
   * Currently selected filter ID
   */
  selected: string;
  /**
   * Callback when a filter is selected
   */
  onSelect: (id: string) => void;
}

/**
 * Individual Filter Pill Component
 *
 * Separate component to properly use hooks (useSharedValue) per pill.
 * This ensures React's Rules of Hooks are followed.
 */
interface FilterPillProps {
  option: FilterOption;
  isSelected: boolean;
  onPress: (id: string) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const FilterPill: React.FC<FilterPillProps> = ({ option, isSelected, onPress }) => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleSpacing } = useResponsive();

  // Shared value for scale animation (properly at component top level)
  const scale = useSharedValue(1);

  // Animated style for press interaction
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Press handlers with spring animations
  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  const handlePress = () => {
    impact('light');
    onPress(option.id);
  };

  return (
    <AnimatedTouchable
      activeOpacity={0.8}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        animatedStyle,
        styles.pill,
        {
          backgroundColor: isSelected ? theme.colors.primary + '20' : 'transparent',
          paddingVertical: scaleSpacing(theme.spacing.sm),
          paddingHorizontal: scaleSpacing(theme.spacing.lg),
          borderRadius: scaleSpacing(radius.xl),
        },
      ]}
    >
      <Label
        color={isSelected ? theme.colors.primary : theme.colors.text2}
        style={{ fontWeight: isSelected ? '600' : '500' }}
      >
        {option.label}
      </Label>
    </AnimatedTouchable>
  );
};

/**
 * Filter Pills Container Component
 */
export const FilterPills: React.FC<FilterPillsProps> = ({ options, selected, onSelect }) => {
  const { theme } = useTheme();
  const { scaleSpacing } = useResponsive();

  // Memoize pill components to prevent unnecessary re-renders
  const pillComponents = useMemo(
    () =>
      options.map((option) => (
        <FilterPill
          key={option.id}
          option={option}
          isSelected={option.id === selected}
          onPress={onSelect}
        />
      )),
    [options, selected, onSelect],
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: scaleSpacing(radius['2xl']),
          padding: scaleSpacing(theme.spacing.xs),
        },
        elevation.low,
      ]}
    >
      {pillComponents}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pill: {
    // Styles applied inline
  },
});
