/**
 * Prompt Carousel Component
 *
 * Horizontal scrollable prompt carousel with snap-to-center, animated scale,
 * and haptic feedback. Mood-adaptive accent colors.
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';
import { font, fontWeight } from '@/src/config/theme';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useResponsive, SPACING, DIMENSIONS } from '@/src/shared/utils/responsive';
import { getButtonAccessibility } from '@/src/shared/utils/accessibility';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_SPACING = SPACING.md;

// Prompt Card Component (extracted to avoid hooks in map)
const PromptCard: React.FC<{
  prompt: string;
  index: number;
  scrollX: ReturnType<typeof useSharedValue<number>>;
  isSelected: boolean;
  moodColor: string;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
  scaleFont: (size: number, factor?: number) => number;
  scaleSpacing: (size: number) => number;
}> = ({
  prompt,
  index,
  scrollX,
  isSelected,
  moodColor,
  onPress,
  theme,
  scaleFont,
  scaleSpacing,
}) => {
  const inputRange = [
    (index - 1) * (CARD_WIDTH + CARD_SPACING),
    index * (CARD_WIDTH + CARD_SPACING),
    (index + 1) * (CARD_WIDTH + CARD_SPACING),
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scaleValue = interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], Extrapolate.CLAMP);
    const opacityValue = interpolate(scrollX.value, inputRange, [0.6, 1, 0.6], Extrapolate.CLAMP);
    return {
      transform: [{ scale: scaleValue }],
      opacity: opacityValue,
    };
  });

  const buttonAccessibility = getButtonAccessibility(
    `Select prompt: ${prompt}`,
    `Double tap to select this journaling prompt`,
  );

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: CARD_WIDTH,
          marginRight: CARD_SPACING,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[
          styles.promptCard,
          {
            backgroundColor: isSelected ? moodColor + '15' : theme.colors.surface,
            borderColor: isSelected ? moodColor : theme.colors.border2,
            borderWidth: isSelected ? 2 : 1,
            padding: scaleSpacing(SPACING.lg),
            borderRadius: DIMENSIONS.cardBorderRadius,
          },
        ]}
        {...buttonAccessibility}
      >
        <Text
          style={[
            styles.promptText,
            {
              color: isSelected ? moodColor : theme.colors.text,
              fontSize: scaleFont(font.body),
            },
          ]}
        >
          {prompt}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export interface PromptCarouselProps {
  prompts: string[];
  selectedPrompt: string | null;
  onPromptSelect: (prompt: string) => void;
  moodColor?: string;
}

const PromptCarousel: React.FC<PromptCarouselProps> = ({
  prompts,
  selectedPrompt,
  onPromptSelect,
  moodColor,
}) => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handlePromptPress = (prompt: string) => {
    impact('light');
    onPromptSelect(prompt);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  if (prompts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <AnimatedScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate="fast"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: scaleSpacing(SPACING.xl) },
        ]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {prompts.map((prompt, index) => (
          <PromptCard
            key={index}
            prompt={prompt}
            index={index}
            scrollX={scrollX}
            isSelected={selectedPrompt === prompt}
            moodColor={moodColor || theme.colors.primary}
            onPress={() => handlePromptPress(prompt)}
            theme={theme}
            scaleFont={scaleFont}
            scaleSpacing={scaleSpacing}
          />
        ))}
      </AnimatedScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  scrollContent: {
    alignItems: 'center',
    // Padding applied inline
  },
  promptCard: {
    // Padding, border radius, background, border, and shadow applied inline
  },
  promptText: {
    lineHeight: 24,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    // Font size and color applied inline
  },
});

export default PromptCarousel;
