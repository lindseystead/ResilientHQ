/**
 * Unified Screen Header Component
 *
 * Consistent header design across all screens.
 * Features:
 * - Centered title (or left-aligned with optional right actions)
 * - Optional subtitle
 * - Optional left back button
 * - Optional right actions
 * - Optional gradient background
 * - Height: 56-64
 * - PaddingHorizontal: spacing.md (16)
 */

import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import { radius, spacing } from '@/src/config/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /**
   * Show back button (default: false)
   */
  showBack?: boolean;
  /**
   * Back button handler (default: router.back())
   */
  onBack?: () => void;
  /**
   * Right action button
   */
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    accessibilityLabel?: string;
  };
  /**
   * Use gradient background (default: false)
   */
  gradient?: boolean;
  /**
   * Gradient colors (default: theme primary/secondary)
   */
  gradientColors?: [string, string];
  /**
   * Title alignment (default: 'left')
   */
  titleAlign?: 'left' | 'center';
  /**
   * Margin bottom (default: theme.spacing.lg = 20)
   */
  marginBottom?: number;
  /**
   * Title font size override (default: 28, responsive)
   */
  titleSize?: number;
  /**
   * Subtitle font size override (default: 16, responsive)
   */
  subtitleSize?: number;
  /**
   * Spacing between title and subtitle (default: theme.spacing.xs)
   */
  spacing?: number;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  gradient = false,
  gradientColors,
  titleAlign = 'left',
  marginBottom,
  titleSize,
  subtitleSize,
  spacing,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  };

  // Responsive values
  const headerHeight = scaleSpacing(56);
  const headerPaddingHorizontal = scaleSpacing(theme.spacing.md);
  const titleFontSize = titleSize !== undefined ? scaleFont(titleSize, 0.3) : scaleFont(28, 0.3);
  const subtitleFontSize =
    subtitleSize !== undefined ? scaleFont(subtitleSize, 0.3) : scaleFont(16, 0.3);
  const iconSize = scaleFont(24, 0.3);
  const responsiveMarginBottom =
    marginBottom !== undefined ? scaleSpacing(marginBottom) : scaleSpacing(theme.spacing.lg);
  const subtitleMarginTop =
    spacing !== undefined ? scaleSpacing(spacing) : scaleSpacing(theme.spacing.xs);

  const headerContent = (
    <View
      style={[
        styles.header,
        {
          marginBottom: responsiveMarginBottom,
        },
      ]}
    >
      <View
        style={[
          styles.headerShell,
          {
            minHeight: headerHeight,
            paddingHorizontal: headerPaddingHorizontal,
            paddingVertical: scaleSpacing(theme.spacing.md),
            borderRadius: scaleSpacing(theme.radius.xl),
            backgroundColor: gradient ? 'transparent' : theme.colors.surfaceGlass,
            borderColor: gradient ? 'transparent' : theme.colors.cardStroke,
            ...(!gradient ? theme.elevation.low : {}),
          },
        ]}
      >
        <View style={styles.headerContent}>
          {/* Left: Back button */}
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={[
                styles.backButton,
                {
                  padding: scaleSpacing(theme.spacing.sm),
                  marginRight: scaleSpacing(theme.spacing.sm),
                },
              ]}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={iconSize} color={theme.colors.text} />
            </TouchableOpacity>
          )}

          {/* Center/Left: Title and subtitle */}
          <View
            style={[
              styles.titleContainer,
              { flex: 1 },
              titleAlign === 'center' && styles.titleContainerCenter,
            ]}
          >
            <Text
              style={[
                styles.title,
                {
                  color: gradient ? theme.colors.white : theme.colors.text,
                  fontSize: titleFontSize,
                  textAlign: titleAlign,
                },
              ]}
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: gradient ? theme.colors.white : theme.colors.text2,
                    fontSize: subtitleFontSize,
                    marginTop: subtitleMarginTop,
                    textAlign: titleAlign,
                  },
                ]}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {/* Right: Action button */}
          {rightAction && (
            <TouchableOpacity
              onPress={rightAction.onPress}
              style={[
                styles.rightAction,
                {
                  padding: scaleSpacing(theme.spacing.sm),
                  marginLeft: scaleSpacing(theme.spacing.sm),
                },
              ]}
              activeOpacity={0.7}
              accessibilityLabel={rightAction.accessibilityLabel}
              accessibilityRole="button"
            >
              <Ionicons
                name={rightAction.icon}
                size={iconSize}
                color={gradient ? theme.colors.white : theme.colors.text2}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  // Wrap with gradient if needed
  if (gradient) {
    return (
      <LinearGradient
        colors={gradientColors || theme.colors.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientWrapper}
      >
        {headerContent}
      </LinearGradient>
    );
  }

  return headerContent;
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
  },
  headerShell: {
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
  },
  gradientWrapper: {
    width: '100%',
    borderRadius: radius['2xl'],
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    // padding and marginRight applied inline with theme tokens
  },
  titleContainer: {
    flex: 1,
  },
  titleContainerCenter: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
  },
  subtitle: {
    fontWeight: '400',
  },
  rightAction: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
});

export default ScreenHeader;
