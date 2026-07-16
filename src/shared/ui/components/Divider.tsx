/**
 * Divider Component
 *
 * Reusable divider component for separating content sections.
 * Uses the shared app theme.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/src/providers/ThemeProvider';

export interface DividerProps {
  /**
   * Vertical margin (default: 10)
   */
  marginVertical?: number;
  /**
   * Horizontal margin (default: 0)
   */
  marginHorizontal?: number;
  /**
   * Custom style
   */
  style?: ViewStyle;
}

const Divider: React.FC<DividerProps> = ({ marginVertical = 10, marginHorizontal = 0, style }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: theme.colors.border2,
          marginVertical,
          marginHorizontal,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 1.3,
    opacity: 0.28,
  },
});

export default Divider;
