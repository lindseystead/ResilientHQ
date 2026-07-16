/**
 * Header With Logo Component
 *
 * Reusable header component for auth screens with logo, title, and subtitle.
 * Ensures consistent spacing and styling across all auth screens.
 * Uses the shared app theme.
 */

import { useTheme } from '@/src/providers/ThemeProvider';
import { SPACING, useResponsive } from '@/src/shared/utils/responsive';
import { radius } from '@/src/config/theme';
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

export interface HeaderWithLogoProps {
  logoSource: ImageSourcePropType;
  title: string;
  subtitle: string;
  subtitlePaddingHorizontal?: number;
}

const HeaderWithLogo: React.FC<HeaderWithLogoProps> = ({
  logoSource,
  title,
  subtitle,
  subtitlePaddingHorizontal,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  return (
    <View style={styles.header}>
      <View
        style={[
          styles.logoBadge,
          {
            backgroundColor: theme.colors.surface,
            shadowColor: theme.colors.primary,
            marginBottom: scaleSpacing(SPACING.lg),
          },
        ]}
      >
        <Image
          style={styles.logo}
          source={logoSource}
          resizeMode="contain"
          accessibilityLabel="ResilientHQ logo"
        />
      </View>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: scaleFont(32, 0.3),
            marginBottom: scaleSpacing(SPACING.sm),
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          {
            color: theme.colors.text2,
            paddingHorizontal: subtitlePaddingHorizontal,
            fontSize: scaleFont(16, 0.3),
            marginBottom: 0, // Remove bottom margin, let parent handle spacing
          },
        ]}
      >
        {subtitle}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
  },
  logoBadge: {
    width: 112,
    height: 112,
    borderRadius: radius['3xl'],
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // marginBottom applied inline
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 12,
  },
  logo: {
    width: 92,
    height: 92,
  },
  title: {
    // fontSize and marginBottom applied inline
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    // fontSize and marginBottom applied inline
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default HeaderWithLogo;
