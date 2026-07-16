/**
 * Section Title Component
 *
 * Thin wrapper around the shared text primitive.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { font, fontWeight } from '@/src/config/theme';
import { useTheme } from '@/src/providers/ThemeProvider';
import BaseText, { TextProps as BaseTextProps } from '../primitives/Text';

export type SectionTitleProps = Omit<BaseTextProps, 'variant'>;

const SectionTitle: React.FC<SectionTitleProps> = ({ style, ...props }) => {
  const { theme } = useTheme();

  return (
    <BaseText
      variant="h3"
      style={[styles.sectionTitle, { marginBottom: theme.spacing.lg }, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: font.h4 + 2,
    lineHeight: 28,
    fontWeight: fontWeight.semibold,
    letterSpacing: -0.2,
  },
});

export default SectionTitle;
