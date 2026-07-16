/**
 * Error Banner Component
 *
 * Reusable error banner component for displaying error messages.
 * Uses the shared app theme.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/providers/ThemeProvider';
import { font, radius, spacing } from '@/src/config/theme';

export interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.error + '20',
        },
      ]}
    >
      <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
      <Text style={[styles.errorText, { color: theme.colors.error }]}>{message}</Text>
      {onDismiss && (
        <Ionicons name="close" size={18} color={theme.colors.error} style={styles.dismissIcon} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.sm,
    gap: spacing.sm,
    marginHorizontal: spacing.xl - spacing.xs,
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: font.labelSmall + 1,
    flex: 1,
    fontWeight: '500',
  },
  dismissIcon: {
    marginLeft: spacing.xs,
  },
});

export default ErrorBanner;
