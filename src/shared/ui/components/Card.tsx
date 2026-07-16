/**
 * Standardized Card Component
 *
 * Unified card design across the entire app.
 * Standards:
 * - corner radius follows the theme card token
 * - default/elevated padding follows theme spacing tokens
 * - default spacing below cards follows theme spacing tokens
 * - backgroundColor: theme.colors.surface
 * - shadow: theme.elevation.medium (elevated: theme.elevation.high)
 */

import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export interface CardProps {
  children: ReactNode;
  /**
   * Card variant (default: 'default')
   * - default: standard card with md shadow
   * - elevated: prominent card with lg shadow and 20px padding
   * - outlined: card with border, no shadow
   */
  variant?: 'default' | 'elevated' | 'outlined';
  /**
   * Padding override (default: 16 for default, 20 for elevated)
   */
  padding?: number;
  /**
   * Margin bottom override (default: 20 from theme.spacing.lg)
   */
  marginBottom?: number;
  /**
   * Custom style
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;
}

const CardComponent: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding,
  marginBottom,
  style,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const { scaleSpacing } = useResponsive();

  // Standard values
  const defaultPadding = theme.spacing.lg; // 16px for all variants
  const standardMarginBottom = theme.spacing.xl; // 24px between cards

  // Apply responsive scaling
  const cardPadding = padding !== undefined ? scaleSpacing(padding) : scaleSpacing(defaultPadding);
  const cardMarginBottom =
    marginBottom !== undefined ? scaleSpacing(marginBottom) : scaleSpacing(standardMarginBottom);
  const cardBorderRadius = scaleSpacing(theme.radius.xl); // Use theme token

  // Get shadow style
  const shadowStyle =
    variant === 'outlined' ? {} : theme.elevation[variant === 'elevated' ? 'high' : 'medium'];
  const backgroundColor =
    variant === 'outlined'
      ? theme.colors.surface2
      : variant === 'elevated'
        ? theme.colors.surface
        : theme.colors.surfaceGlass;
  const borderColor = variant === 'outlined' ? theme.colors.border2 : theme.colors.cardStroke;

  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'summary' : undefined}
      style={[
        styles.card,
        {
          backgroundColor,
          padding: cardPadding,
          marginBottom: cardMarginBottom,
          borderRadius: cardBorderRadius,
          borderWidth: 1,
          borderColor,
          ...shadowStyle,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
  },
});

const Card = React.memo(CardComponent);
Card.displayName = 'Card';

export default Card;
