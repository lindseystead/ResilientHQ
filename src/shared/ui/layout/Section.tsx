/**
 * Section Component
 *
 * Section header component with consistent styling.
 * Uses design tokens for typography and spacing.
 */

import { font } from '@/src/config/theme';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Title from '../typography/Title';

export interface SectionProps {
  title: string;
  children?: ReactNode;
  marginBottom?: number;
  marginTop?: number;
}

const Section: React.FC<SectionProps> = ({ title, children, marginBottom, marginTop = 0 }) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  // Use theme tokens for consistent spacing
  const defaultMarginBottom = theme.spacing.xl; // 24px standard section spacing
  const titleMarginBottom = theme.spacing.md; // 12px spacing below title
  const responsiveMarginBottom = scaleSpacing(
    marginBottom !== undefined ? marginBottom : defaultMarginBottom,
  );
  const responsiveMarginTop = scaleSpacing(marginTop);

  return (
    <View
      style={[
        styles.section,
        { marginBottom: responsiveMarginBottom, marginTop: responsiveMarginTop },
      ]}
    >
      <Title
        style={{
          fontSize: scaleFont(font.h2, 0.3),
          marginBottom: scaleSpacing(titleMarginBottom),
        }}
      >
        {title}
      </Title>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontWeight: '700',
    // Font size and margin applied inline
  },
});

export default Section;
