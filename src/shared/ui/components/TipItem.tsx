/**
 * Tip Item Component
 *
 * Reusable component for displaying tips with icon and text.
 * Used across multiple screens for wellness tips, advice, etc.
 * Uses the shared app theme.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/providers/ThemeProvider';
import { font, spacing } from '@/src/config/theme';

export interface TipItemProps {
  /**
   * Icon name from Ionicons
   */
  icon: keyof typeof Ionicons.glyphMap;
  /**
   * Tip text content
   */
  text: string;
  /**
   * Icon size (default: 20)
   */
  iconSize?: number;
  /**
   * Icon color (default: theme primary)
   */
  iconColor?: string;
  /**
   * Custom container style
   */
  style?: ViewStyle;
  /**
   * Custom text style
   */
  textStyle?: TextStyle;
}

const TipItemComponent: React.FC<TipItemProps> = ({
  icon,
  text,
  iconSize = 20,
  iconColor,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={iconSize} color={iconColor || theme.colors.primary} />
      <Text style={[styles.text, { color: theme.colors.text }, textStyle]}>{text}</Text>
    </View>
  );
};

const TipItem = React.memo(TipItemComponent);
TipItem.displayName = 'TipItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom removed - handled by parent Card
  },
  text: {
    fontSize: font.body,
    marginLeft: spacing.md,
    flex: 1,
    lineHeight: 22,
  },
});

export default TipItem;
