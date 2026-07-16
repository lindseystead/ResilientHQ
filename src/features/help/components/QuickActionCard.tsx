/**
 * Quick Action Card Component
 *
 * Reusable quick action card with icon and label.
 * Used in help screens for quick navigation to common actions.
 * Uses the shared app theme.
 */

import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/providers/ThemeProvider';
import { font, fontWeight } from '@/src/config/theme';

interface QuickActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ icon, label, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          padding: theme.spacing.xl - theme.spacing.xs,
          borderRadius: theme.radius.lg,
          marginBottom: theme.spacing.md,
          ...theme.elevation.medium,
        },
      ]}
      activeOpacity={0.8}
      accessibilityLabel={label}
      accessibilityHint="Tap to perform action"
    >
      <Ionicons name={icon} size={28} color={theme.colors.primary} />
      <Text style={[styles.label, { color: theme.colors.text, marginTop: theme.spacing.sm }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    // padding, borderRadius, marginBottom, and shadow applied inline via theme tokens
  },
  label: {
    fontSize: font.label,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    // marginTop applied inline via theme.spacing.sm
  },
});

export default QuickActionCard;
