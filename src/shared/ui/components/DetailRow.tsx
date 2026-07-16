/**
 * Detail Row Component
 *
 * Reusable component for displaying label/value pairs.
 * Used in profile screens and detail views.
 * Uses the shared app theme.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/src/providers/ThemeProvider';
import { font, spacing } from '@/src/config/theme';

export interface DetailRowProps {
  /**
   * Label text
   */
  label: string;
  /**
   * Value text
   */
  value: string | number | undefined;
  /**
   * Placeholder text when value is empty (default: 'Not set')
   */
  placeholder?: string;
  /**
   * Whether to show bottom border (default: true)
   */
  showBorder?: boolean;
  /**
   * Custom container style
   */
  style?: ViewStyle;
  /**
   * Custom label style
   */
  labelStyle?: TextStyle;
  /**
   * Custom value style
   */
  valueStyle?: TextStyle;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  placeholder = 'Not set',
  showBorder = true,
  style,
  labelStyle,
  valueStyle,
}) => {
  const { theme } = useTheme();
  const displayValue = value !== undefined && value !== '' ? String(value) : placeholder;

  return (
    <View
      style={[styles.container, showBorder && { borderBottomColor: theme.colors.border2 }, style]}
    >
      <Text style={[styles.label, { color: theme.colors.text2 }, labelStyle]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text }, valueStyle]} numberOfLines={2}>
        {displayValue}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: font.label,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: font.body,
    fontWeight: '400',
    lineHeight: 22,
  },
});

export default DetailRow;
