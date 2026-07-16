/**
 * ButtonGroup Component
 *
 * Flexible container for grouping buttons.
 * Supports vertical (stacked) and horizontal layouts.
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export interface ButtonGroupProps {
  /** Button components to render */
  children: ReactNode;
  /** Layout direction (default: 'vertical') */
  direction?: 'vertical' | 'horizontal';
  /** Gap between buttons (default: 12) */
  gap?: number;
  /** Margin top (default: 16) */
  marginTop?: number;
  /** Margin bottom (default: 0) */
  marginBottom?: number;
  /** Custom style */
  style?: ViewStyle;
}

const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  direction = 'vertical',
  gap = 12,
  marginTop = 16,
  marginBottom = 0,
  style,
}) => {
  return (
    <View
      style={[
        direction === 'horizontal' ? styles.horizontal : styles.vertical,
        { gap, marginTop, marginBottom },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  vertical: {
    flexDirection: 'column',
  },
  horizontal: {
    flexDirection: 'row',
  },
});

export default ButtonGroup;
