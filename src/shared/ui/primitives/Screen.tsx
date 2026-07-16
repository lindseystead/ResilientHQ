/**
 * Screen Component
 *
 * Simplified screen wrapper handling:
 * - Safe areas
 * - Scrolling
 * - Keyboard avoidance
 * - Max content width for tablets/web
 *
 * Replaces the complex ScreenLayout + ProtectedScreen pattern.
 */

import React, { memo, ReactNode } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/providers/ThemeProvider';
import Text from './Text';

export interface ScreenProps {
  children: ReactNode;
  /** Screen title (optional header) */
  title?: string;
  /** Screen subtitle */
  subtitle?: string;
  /** Enable scrolling (default: true) */
  scroll?: boolean;
  /** Horizontal padding (default: 16) */
  padding?: number;
  /** Center content with max width (for web/tablet) */
  centerContent?: boolean;
  /** Max content width */
  maxWidth?: number;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom style */
  style?: ViewStyle;
}

const Screen: React.FC<ScreenProps> = memo(
  ({
    children,
    title,
    subtitle,
    scroll = true,
    padding = 16,
    centerContent = true,
    maxWidth = 600,
    backgroundColor,
    style,
  }) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const header = title ? (
      <View style={[styles.header, { paddingHorizontal: padding }]}>
        <Text variant="h2">{title}</Text>
        {subtitle && (
          <Text variant="body" muted style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>
    ) : null;

    const content = (
      <View
        style={[
          styles.content,
          {
            paddingHorizontal: padding,
            maxWidth: centerContent ? maxWidth : '100%',
            alignSelf: centerContent ? 'center' : 'stretch',
            width: '100%',
          },
        ]}
      >
        {children}
      </View>
    );

    const containerStyle: ViewStyle = {
      flex: 1,
      backgroundColor: backgroundColor ?? theme.colors.background2,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    };

    if (scroll) {
      return (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[containerStyle, style]}>
            {header}
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {content}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      );
    }

    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[containerStyle, styles.flex, style]}>
          {header}
          {content}
        </View>
      </KeyboardAvoidingView>
    );
  },
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  subtitle: {
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
});

Screen.displayName = 'Screen';
export default Screen;
