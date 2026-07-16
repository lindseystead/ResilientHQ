/**
 * Category Selector Component
 *
 * Animated category pills with smooth transitions and haptic feedback.
 * Used for filtering posts by category.
 */

import React, { useCallback } from 'react';
import { Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useResponsive, SPACING, DIMENSIONS } from '@/src/shared/utils/responsive';

const CATEGORIES = ['All', 'For You', 'Trending', 'Recent', 'My Posts', 'Support'];

export interface CategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

type ThemeColors = ReturnType<typeof useTheme>['theme']['colors'];

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();

  const handleSelect = (category: string) => {
    impact('light');
    onSelectCategory(category);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, { paddingHorizontal: scaleSpacing(SPACING.lg) }]}
    >
      {CATEGORIES.map((category) => (
        <CategoryPill
          key={category}
          category={category}
          isSelected={selectedCategory === category}
          onSelect={handleSelect}
          scaleFont={scaleFont}
          scaleSpacing={scaleSpacing}
          themeColors={theme.colors}
        />
      ))}
    </ScrollView>
  );
};

interface CategoryPillProps {
  category: string;
  isSelected: boolean;
  onSelect: (category: string) => void;
  scaleFont: (value: number, factor?: number) => number;
  scaleSpacing: (value: number) => number;
  themeColors: ThemeColors;
}

const CategoryPill: React.FC<CategoryPillProps> = ({
  category,
  isSelected,
  onSelect,
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
    scaleValue.value = 0.95;
  }, [scaleValue]);
  const handlePressOut = useCallback(() => {
    scaleValue.value = 1;
  }, [scaleValue]);

  return (
    <Animated.View style={pressAnimation}>
      <TouchableOpacity
        onPress={() => onSelect(category)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.categoryPill,
          {
            backgroundColor: isSelected ? themeColors.primary : themeColors.input,
            paddingHorizontal: scaleSpacing(SPACING.md),
            paddingVertical: scaleSpacing(SPACING.sm),
            borderRadius: DIMENSIONS.cardBorderRadius,
            marginRight: scaleSpacing(SPACING.sm),
            borderWidth: isSelected ? 0 : 1,
            borderColor: themeColors.border2,
          },
        ]}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.categoryText,
            {
              color: isSelected ? themeColors.white : themeColors.text,
              fontSize: scaleFont(13),
            },
          ]}
        >
          {category}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    // Padding applied inline
  },
  categoryPill: {
    // Padding, border radius, background, border, and margin applied inline
  },
  categoryText: {
    fontWeight: '600',
  },
});

export default CategorySelector;
