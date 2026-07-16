/**
 * Settings Section Component
 *
 * Reusable section wrapper for settings groups.
 */

import React, { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Card, SectionTitle } from '@/src/shared/ui';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';

export interface SettingsSectionProps {
  title: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children, style }) => {
  const { theme } = useTheme();
  const { scaleSpacing } = useResponsive();

  return (
    <Card style={style}>
      <SectionTitle style={{ marginBottom: scaleSpacing(theme.spacing.md) }}>{title}</SectionTitle>
      {children}
    </Card>
  );
};

export default SettingsSection;
