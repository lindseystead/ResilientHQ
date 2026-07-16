/**
 * Universal Screen Layout Component
 *
 * The single source of truth for all screen layouts across the app.
 * Handles safe areas, padding, scrolling, keyboard, and content width.
 *
 * Features:
 * - Automatic safe area handling
 * - Consistent horizontal padding (16px default)
 * - Unified vertical spacing
 * - Optional scroll with keyboard handling
 * - Max content width (600px) for large screens
 * - Status bar spacing
 * - Theme-based background
 */

import { useTheme } from '@/src/providers/ThemeProvider';
import { layout } from '@/src/config/theme';
import { useResponsive } from '@/src/shared/utils/responsive';
import { StatusBar } from 'expo-status-bar';
import React, { ReactNode, useContext } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackdrop from './AppBackdrop';

export interface ScreenLayoutProps {
  children: ReactNode;
  /**
   * Whether content is scrollable (default: true)
   * Set to false for custom scroll implementations (Chatbot, Journal, etc.)
   */
  scroll?: boolean;
  /**
   * Horizontal padding override (default: 16 from theme.spacing.md)
   */
  padding?: number;
  /**
   * Whether to pad bottom for FABs (default: false)
   * Adds extra bottom padding when true
   */
  safeBottom?: boolean;
  /**
   * Optional header component to render
   */
  header?: ReactNode;
  /**
   * Whether to apply safe area padding to top (default: true)
   */
  safeAreaTop?: boolean;
  /**
   * Whether to apply safe area padding to bottom (default: true)
   */
  safeAreaBottom?: boolean;
  /**
   * Whether to dismiss keyboard when scrolling (default: true)
   */
  keyboardDismissOnScroll?: boolean;
  /**
   * Custom container style
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Custom content style
   */
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Whether to animate entrance (default: true)
   */
  animated?: boolean;
  /**
   * Maximum content width (default: 600)
   * Set to 540 for auth screens
   */
  maxContentWidth?: number;
  /**
   * Whether to center content horizontally (default: true)
   */
  contentCentered?: boolean;
  /**
   * Whether to include bottom padding for a visible tab bar (default: true)
   */
  includeTabBarPadding?: boolean;
}

const MAX_CONTENT_WIDTH = layout.maxContentWidth;

const ScreenLayout: React.FC<ScreenLayoutProps> = ({
  children,
  scroll = true,
  padding,
  safeBottom = false,
  header,
  safeAreaTop = true,
  safeAreaBottom = true,
  keyboardDismissOnScroll = true,
  style,
  contentStyle,
  animated = true,
  maxContentWidth = MAX_CONTENT_WIDTH,
  contentCentered = true,
  includeTabBarPadding = true,
}) => {
  const { theme, mode } = useTheme();
  const { scaleSpacing, contentWidth, contentPadding } = useResponsive();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;

  // Use theme spacing.lg (16) as default padding
  const horizontalPadding =
    padding !== undefined ? scaleSpacing(padding) : scaleSpacing(theme.spacing.lg);

  // Calculate bottom padding - account for tab bar (always visible in tabs group)
  // Tab bar height: 60px base + safe area bottom (tab bar handles its own safe area)
  const tabBarBaseHeight = tabBarHeight;
  const baseBottomPadding = scaleSpacing(theme.spacing.lg); // Standard spacing above tab bar
  const safeAreaBottomPadding =
    safeAreaBottom && !includeTabBarPadding ? Math.max(insets.bottom, 0) : 0;
  const fabBottomPadding = safeBottom ? scaleSpacing(theme.spacing.md) : 0;
  // Total: base padding + optional tab bar height (tab bar safe area is handled by tab bar itself)
  const tabBarPadding = includeTabBarPadding ? tabBarBaseHeight : 0;
  const totalBottomPadding =
    baseBottomPadding + tabBarPadding + safeAreaBottomPadding + fabBottomPadding;

  // Screen transition animation: fade + slide-in from bottom
  const opacity = useSharedValue(animated ? 0 : 1);
  const translateY = useSharedValue(animated ? 20 : 0);

  React.useEffect(() => {
    if (animated) {
      opacity.value = withTiming(1, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(0, {
        duration: 350,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [animated, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  // Container style
  const containerStyle = [
    styles.container,
    {
      backgroundColor: theme.colors.background,
      paddingTop: safeAreaTop ? insets.top : 0,
    },
    animated && animatedStyle,
    style,
  ];

  // Content wrapper with max width for large screens
  const shouldConstrainWidth = contentWidth > maxContentWidth;
  const contentWrapperStyle: StyleProp<ViewStyle> = [
    styles.contentWrapper,
    {
      maxWidth: shouldConstrainWidth ? maxContentWidth : '100%',
      paddingHorizontal: shouldConstrainWidth ? contentPadding : horizontalPadding,
      alignSelf: (contentCentered ? 'center' : 'flex-start') as 'center' | 'flex-start' | 'auto',
    },
  ];

  // Scroll content style
  const scrollContentStyle = [
    styles.scrollContent,
    {
      paddingBottom: totalBottomPadding,
    },
    contentStyle,
  ];

  // Non-scroll content style
  const nonScrollContentStyle = [
    styles.nonScrollContent,
    {
      paddingBottom: totalBottomPadding,
    },
    contentStyle,
  ];

  // Render header if provided - respects maxContentWidth like content
  const headerElement = header ? (
    <View
      style={[
        styles.headerContainer,
        {
          paddingHorizontal: shouldConstrainWidth ? contentPadding : horizontalPadding,
          maxWidth: shouldConstrainWidth ? maxContentWidth : '100%',
          alignSelf: (contentCentered ? 'center' : 'flex-start') as
            | 'center'
            | 'flex-start'
            | 'auto',
          width: '100%',
        },
      ]}
    >
      {header}
    </View>
  ) : null;

  // Scrollable layout
  if (scroll) {
    return (
      <>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <Animated.View style={containerStyle}>
            <AppBackdrop />
            {headerElement}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={scrollContentStyle}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode={keyboardDismissOnScroll ? 'on-drag' : 'none'}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={false}
              scrollEventThrottle={16}
              contentInsetAdjustmentBehavior="automatic"
              automaticallyAdjustContentInsets={true}
              accessible={true}
              accessibilityLabel="Main content"
              accessibilityRole="none"
            >
              <View style={contentWrapperStyle}>{children}</View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </>
    );
  }

  // Non-scrollable layout (for custom scroll implementations)
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <Animated.View style={containerStyle}>
          <AppBackdrop />
          {headerElement}
          <View
            style={[contentWrapperStyle, nonScrollContentStyle]}
            accessible={true}
            accessibilityLabel="Main content"
          >
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  nonScrollContent: {
    flex: 1,
  },
});

export default ScreenLayout;
