/**
 * Tutorial Card Component
 *
 * Reusable tutorial card with icon, title, and description.
 * Used in help screens to display tutorial information.
 * Uses the shared app theme.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/providers/ThemeProvider';
import { withAlpha } from '@/src/shared/ui/theme/color';
import { font, radius, spacing } from '@/src/config/theme';

interface TutorialCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}

const TutorialCard: React.FC<TutorialCardProps> = ({ icon, title, description, onPress }) => {
  const { theme } = useTheme();
  const cardShadowStyle = Platform.select({
    ios: {
      shadowColor: theme.colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: `0 2px 6px ${withAlpha(theme.colors.black, 0.08)}`,
    },
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadowStyle]}
      activeOpacity={0.8}
      accessibilityLabel={title}
      accessibilityHint={description}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
        <Ionicons name={icon} size={24} color={theme.colors.primary} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.text2 }]}>{description}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: spacing.lg + spacing.xs / 2,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: font.bodyLarge,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    fontSize: font.bodySmall,
    lineHeight: 20,
  },
});

export default TutorialCard;
