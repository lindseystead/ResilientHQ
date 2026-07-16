/**
 * Mood Filter Chips Component
 *
 * Reusable mood filter selector for journal entries.
 * Displays mood emojis as filterable chips with selected state.
 */

import { MOOD } from '@/src/config/constants';
import { font } from '@/src/config/theme';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface MoodFilterChipsProps {
  selectedMood: number | null;
  onSelectMood: (mood: number | null) => void;
}

const MoodFilterChips: React.FC<MoodFilterChipsProps> = ({ selectedMood, onSelectMood }) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  return (
    <View style={styles.filterRow}>
      <Text
        style={[
          styles.filterLabel,
          {
            color: theme.colors.text2,
            fontSize: scaleFont(font.labelSmall, 0.3),
            marginRight: scaleSpacing(theme.spacing.sm),
          },
        ]}
      >
        Filter by Mood:
      </Text>
      <TouchableOpacity
        onPress={() => onSelectMood(null)}
        style={[
          styles.filterChip,
          {
            backgroundColor: selectedMood === null ? theme.colors.primary : theme.colors.input,
            paddingHorizontal: scaleSpacing(theme.spacing.md),
            paddingVertical: scaleSpacing(theme.spacing.xs),
            borderRadius: theme.radius.lg,
            marginRight: scaleSpacing(theme.spacing.xs),
          },
        ]}
      >
        <Text
          style={[
            styles.filterChipText,
            {
              color: selectedMood === null ? theme.colors.white : theme.colors.text,
              fontSize: scaleFont(font.captionSmall, 0.3),
            },
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      {MOOD.emojis.map((emoji, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => onSelectMood(selectedMood === index ? null : index)}
          style={[
            styles.filterChip,
            {
              backgroundColor: selectedMood === index ? MOOD.colors[index] : theme.colors.input,
              paddingHorizontal: scaleSpacing(theme.spacing.sm),
              paddingVertical: scaleSpacing(theme.spacing.xs),
              borderRadius: theme.radius.lg,
              marginRight: scaleSpacing(theme.spacing.xs),
            },
          ]}
        >
          <Text style={[styles.filterEmoji, { fontSize: scaleFont(14) }]}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterLabel: {
    fontWeight: '500',
  },
  filterChip: {
    // Styles applied inline
  },
  filterChipText: {
    fontWeight: '600',
  },
  filterEmoji: {
    // Font size applied inline
  },
});

export default MoodFilterChips;
