/**
 * Empty Text Component
 *
 * Thin wrapper around the shared text primitive.
 */

import React from 'react';
import BaseText, { TextProps as BaseTextProps } from '../primitives/Text';
import { StyleSheet } from 'react-native';

export type EmptyTextProps = Omit<BaseTextProps, 'variant'>;

const EmptyText: React.FC<EmptyTextProps> = ({ style, muted, ...props }) => (
  <BaseText variant="body" muted={muted ?? true} style={[styles.empty, style]} {...props} />
);

const styles = StyleSheet.create({
  empty: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default EmptyText;
