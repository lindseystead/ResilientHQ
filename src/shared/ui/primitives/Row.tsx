/**
 * Row Component
 *
 * Horizontal flexbox layout helper.
 */

import React, { memo, ReactNode } from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

export interface RowProps extends ViewProps {
  children: ReactNode;
  /** Horizontal alignment */
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  /** Vertical alignment */
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  /** Gap between children */
  gap?: number;
  /** Wrap items */
  wrap?: boolean;
}

const Row: React.FC<RowProps> = memo(
  ({
    children,
    align = 'center',
    justify = 'flex-start',
    gap = 0,
    wrap = false,
    style,
    ...props
  }) => (
    <View
      style={[
        styles.row,
        {
          alignItems: align,
          justifyContent: justify,
          gap,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  ),
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});

Row.displayName = 'Row';
export default Row;
