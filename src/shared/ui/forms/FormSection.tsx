/**
 * Form Section Component
 *
 * Form wrapper for auth screens (login, signup, reset password).
 * Provides consistent card styling, padding, and elevation.
 */

import { radius, spacing } from '@/src/config/theme';
import { useResponsive } from '@/src/shared/utils/responsive';
import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Card from '../components/Card';

export interface FormSectionProps {
  children: ReactNode;
  style?: object;
}

const FormSection: React.FC<FormSectionProps> = ({ children, style }) => {
  const { scaleSpacing } = useResponsive();

  return (
    <Card
      variant="elevated"
      style={[
        styles.formCard,
        {
          padding: scaleSpacing(spacing.xl),
          borderRadius: scaleSpacing(radius.lg),
        },
        style,
      ]}
    >
      {children}
    </Card>
  );
};

const styles = StyleSheet.create({
  formCard: {
    width: '100%',
    // Padding and borderRadius applied inline
  },
});

export default FormSection;
