/**
 * Shared Mood Selector
 *
 * Reusable mood input used by journal, community, and any future
 * resilience flows that tag user sentiment.
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MOOD } from '@/src/config/constants';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { DIMENSIONS, SPACING, useResponsive } from '@/src/shared/utils/responsive';
import { getButtonAccessibility } from '@/src/shared/utils/accessibility';
import Text from '@/src/shared/ui/primitives/Text';

export interface MoodSelectorProps {
  selectedMood: number | null;
  onMoodSelect: (mood: number) => void;
}

type ThemeColors = ReturnType<typeof useTheme>['theme']['colors'];

interface MoodButtonProps {
  index: number;
  emoji: string;
  isSelected: boolean;
  onPress: (mood: number) => void;
  scaleFont: (value: number, factor?: number) => number;
  scaleSpacing: (value: number) => number;
  themeColors: ThemeColors;
}

const MoodButton: React.FC<MoodButtonProps> = ({
  index,
  emoji,
  isSelected,
  onPress,
  scaleFont,
  scaleSpacing,
  themeColors,
}) => {
  const moodColor = MOOD.colors[index];

  const buttonAccessibility = getButtonAccessibility(
    `Select ${MOOD.labels[index]} mood`,
    `Double tap to select ${MOOD.labels[index]} mood`,
  );

  return (
    <TouchableOpacity
      onPress={() => onPress(index)}
      activeOpacity={0.8}
      style={[
        styles.moodButton,
        {
          backgroundColor: isSelected ? `${moodColor}20` : themeColors.input,
          borderColor: isSelected ? moodColor : themeColors.border2,
          borderWidth: isSelected ? 2 : 1,
          padding: scaleSpacing(SPACING.md),
          borderRadius: DIMENSIONS.cardBorderRadius,
          minWidth: scaleSpacing(80),
        },
      ]}
      {...buttonAccessibility}
    >
      <Text style={[styles.moodEmoji, { fontSize: scaleFont(32) }]}>{emoji}</Text>
      <Text
        variant="caption"
        weight="600"
        style={[
          styles.moodLabel,
          {
            color: isSelected ? moodColor : themeColors.text2,
            fontSize: scaleFont(12),
            marginTop: scaleSpacing(SPACING.xs),
          },
        ]}
      >
        {MOOD.labels[index]}
      </Text>
    </TouchableOpacity>
  );
};

const MoodSelector: React.FC<MoodSelectorProps> = ({ selectedMood, onMoodSelect }) => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();

  const handleMoodPress = (mood: number) => {
    impact('light');
    onMoodSelect(mood);
  };

  return (
    <View style={styles.container}>
      {MOOD.emojis.map((emoji, index) => (
        <MoodButton
          key={index}
          index={index}
          emoji={emoji}
          isSelected={selectedMood === index}
          onPress={handleMoodPress}
          scaleFont={scaleFont}
          scaleSpacing={scaleSpacing}
          themeColors={theme.colors}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  moodButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {},
  moodLabel: {
    textAlign: 'center',
  },
});

export default MoodSelector;
