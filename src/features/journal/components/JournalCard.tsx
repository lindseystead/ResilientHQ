/**
 * Journal Card Component
 *
 * Journal entry card with mood badge, date display, expand/collapse,
 * and edit/delete actions. Includes animations and shared theming.
 */

import React, { useState } from 'react';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { format } from 'date-fns';
import { useTheme } from '@/src/providers/ThemeProvider';
import { font, fontWeight } from '@/src/config/theme';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useResponsive, SPACING } from '@/src/shared/utils/responsive';
import { getButtonAccessibility } from '@/src/shared/utils/accessibility';
import { Card } from '@/src/shared/ui';
import { JournalEntry } from '@/src/features/journal/services/journal';
import { MOOD } from '@/src/config/constants';

export interface JournalCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entryId: string) => void;
}

const JournalCard: React.FC<JournalCardProps> = ({ entry, onEdit, onDelete }) => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();
  const [isExpanded, setIsExpanded] = useState(false);

  const height = useSharedValue(100);
  const opacity = useSharedValue(0.7);

  const moodColor = MOOD.colors[entry.mood];
  const moodEmoji = MOOD.emojis[entry.mood];
  const moodLabel = MOOD.labels[entry.mood];

  const entryDate = normalizeTimestamp(entry.timestamp);

  const toggleExpand = () => {
    impact('light');
    setIsExpanded(!isExpanded);
    height.value = withSpring(isExpanded ? 100 : 300, {
      damping: 12,
      stiffness: 180,
      mass: 1,
      overshootClamping: false,
    });
    opacity.value = withTiming(isExpanded ? 0.7 : 1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: height.value,
    opacity: opacity.value,
  }));

  const editAccessibility = getButtonAccessibility('Edit entry', 'Double tap to edit this entry');
  const deleteAccessibility = getButtonAccessibility(
    'Delete entry',
    'Double tap to delete this entry',
  );

  return (
    <Card
      variant="elevated"
      padding={scaleSpacing(SPACING.lg)}
      marginBottom={scaleSpacing(SPACING.lg)}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.moodBadge,
              {
                backgroundColor: moodColor + '20',
                width: scaleSpacing(SPACING.xxl),
                height: scaleSpacing(SPACING.xxl),
                borderRadius: scaleSpacing(SPACING.xxl) / 2,
                marginRight: scaleSpacing(SPACING.md),
              },
            ]}
          >
            <Text style={[styles.moodEmoji, { fontSize: scaleFont(font.h3) }]}>{moodEmoji}</Text>
          </View>
          <View style={styles.dateContainer}>
            <Text
              style={[
                styles.date,
                {
                  color: theme.colors.text,
                  fontSize: scaleFont(font.body),
                },
              ]}
            >
              {format(entryDate, 'MMMM d, yyyy')}
            </Text>
            <Text
              style={[
                styles.time,
                {
                  color: theme.colors.text2,
                  fontSize: scaleFont(font.caption),
                  marginTop: scaleSpacing(SPACING.xs),
                },
              ]}
            >
              {format(entryDate, 'h:mm a')} • {moodLabel}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onEdit(entry)}
            style={[
              {
                padding: scaleSpacing(SPACING.xs),
                marginRight: scaleSpacing(SPACING.sm),
              },
            ]}
            {...editAccessibility}
          >
            <Ionicons
              name="pencil-outline"
              size={scaleFont(font.h4)}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => entry.id && onDelete(entry.id)}
            style={[
              {
                padding: scaleSpacing(SPACING.xs),
              },
            ]}
            {...deleteAccessibility}
          >
            <Ionicons name="trash-outline" size={scaleFont(font.h4)} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Prompt */}
      <Text
        style={[
          styles.prompt,
          {
            color: moodColor,
            fontSize: scaleFont(font.bodySmall),
            marginTop: scaleSpacing(SPACING.md),
            marginBottom: scaleSpacing(SPACING.sm),
          },
        ]}
      >
        {entry.prompt}
      </Text>

      {/* Entry Text */}
      <Animated.View style={animatedStyle}>
        <Text
          style={[
            styles.entryText,
            {
              color: theme.colors.text,
              fontSize: scaleFont(font.body),
              lineHeight: scaleFont(24),
            },
          ]}
          numberOfLines={isExpanded ? undefined : 3}
        >
          {entry.entry}
        </Text>
      </Animated.View>

      {/* Expand/Collapse Button */}
      {entry.entry.length > 150 && (
        <TouchableOpacity
          onPress={toggleExpand}
          style={[
            styles.expandButton,
            {
              marginTop: scaleSpacing(SPACING.sm),
            },
          ]}
          {...getButtonAccessibility(
            isExpanded ? 'Collapse entry' : 'Expand entry',
            'Double tap to expand or collapse this entry',
          )}
        >
          <Text
            style={[
              styles.expandText,
              {
                color: theme.colors.primary,
                fontSize: scaleFont(font.caption),
              },
            ]}
          >
            {isExpanded ? 'Show Less' : 'Read More'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={scaleFont(font.body)}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moodBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    // Size, border radius, background, and margin applied inline
  },
  moodEmoji: {
    // Font size applied inline
  },
  dateContainer: {
    flex: 1,
  },
  date: {
    fontWeight: fontWeight.semibold,
  },
  time: {
    // Font size, color, and margin applied inline
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prompt: {
    fontWeight: fontWeight.semibold,
    fontStyle: 'italic',
    // Font size, color, and margins applied inline
  },
  entryText: {
    // Font size, color, and line height applied inline
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    // Margin applied inline
  },
  expandText: {
    fontWeight: fontWeight.semibold,
    marginRight: SPACING.xs,
  },
});

export default JournalCard;
