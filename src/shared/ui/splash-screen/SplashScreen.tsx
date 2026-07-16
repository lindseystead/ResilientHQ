/**
 * Splash Screen Component
 *
 * Wellness-style splash screen with app branding and loading animation.
 * Features animated logo entrance, loading indicator, and smooth transitions.
 * Fully white background matching the app visual system.
 * Navigation is handled by the root index route.
 * Uses the shared app theme.
 */

import { useTheme } from '@/src/providers/ThemeProvider';
import { font, radius, spacing } from '@/src/config/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Responsive, centered logo sizing
const vh = SCREEN_HEIGHT;
// Logo should take up 40–45% of screen height depending on device
const LOGO_SIZE = Math.min(vh * 0.42, 320);
const MIN_LOGO_SIZE = 180; // Prevents being too small on short screens
const FINAL_LOGO_SIZE = Math.max(LOGO_SIZE, MIN_LOGO_SIZE);

// Motivational taglines that rotate
const TAGLINES = [
  'Your mental wellness hub',
  'Building resilience, one day at a time',
  'Empowering your journey',
  'Wellness starts here',
];

/**
 * Splash Screen Component
 * Features animated logo entrance, loading indicator, and smooth transitions
 * Handles navigation after animation completes
 */
const SplashScreen: React.FC = () => {
  const { theme } = useTheme();
  const colors = theme.colors;

  // Animation values
  const logoScale = useSharedValue(0.75); // Start from 0.75 for zoom-in effect
  const logoOpacity = useSharedValue(0);
  const logoRotation = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(20);
  const loadingDot1 = useSharedValue(0.3);
  const loadingDot2 = useSharedValue(0.3);
  const loadingDot3 = useSharedValue(0.3);
  const pulseScale = useSharedValue(1);

  // Note: Haptic feedback removed from mount to avoid browser warnings
  // Browsers block vibrate API until user interaction

  // Logo entrance animation - scale + fade + subtle rotation
  // Animation shared values are stable and don't need to be in dependencies
  useEffect(() => {
    // Logo animations with staggered timing
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));

    // Zoom-in animation
    logoScale.value = withDelay(
      200,
      withSpring(1, {
        damping: 12,
        stiffness: 180,
        mass: 1,
        overshootClamping: false,
      }),
    );

    logoRotation.value = withDelay(
      200,
      withSpring(0, {
        damping: 12,
        stiffness: 180,
        mass: 1,
        overshootClamping: false,
      }),
    );

    // Tagline animation
    taglineOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    taglineTranslateY.value = withDelay(
      600,
      withSpring(0, {
        damping: 12,
        stiffness: 180,
        mass: 1,
        overshootClamping: false,
      }),
    );

    // Loading dots animation - pulsing sequence
    const createDotAnimation = (delay: number) => {
      return withDelay(
        delay,
        withRepeat(
          withSequence(withTiming(1, { duration: 600 }), withTiming(0.3, { duration: 600 })),
          -1,
          false,
        ),
      );
    };

    loadingDot1.value = createDotAnimation(1000);
    loadingDot2.value = createDotAnimation(1200);
    loadingDot3.value = createDotAnimation(1400);

    // Subtle pulse animation for logo
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1,
      true,
    );

    // Navigation is handled by RootNavigator based on auth state
    // No navigation logic needed here
  }, [
    loadingDot1,
    loadingDot2,
    loadingDot3,
    logoOpacity,
    logoRotation,
    logoScale,
    pulseScale,
    taglineOpacity,
    taglineTranslateY,
  ]);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value * pulseScale.value },
      {
        rotate: `${interpolate(
          logoRotation.value,
          [-10, 0],
          [(-10 * Math.PI) / 180, 0],
          Extrapolate.CLAMP,
        )}rad`,
      },
    ],
    opacity: logoOpacity.value,
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const loadingDot1Style = useAnimatedStyle(() => ({
    opacity: loadingDot1.value,
    transform: [{ scale: loadingDot1.value }],
  }));

  const loadingDot2Style = useAnimatedStyle(() => ({
    opacity: loadingDot2.value,
    transform: [{ scale: loadingDot2.value }],
  }));

  const loadingDot3Style = useAnimatedStyle(() => ({
    opacity: loadingDot3.value,
    transform: [{ scale: loadingDot3.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      {/* Main content */}
      <View style={styles.content}>
        {/* Logo animations */}
        <Animated.View
          style={[styles.logoContainer, logoAnimatedStyle, { shadowColor: colors.primary }]}
        >
          <View style={styles.logoCropContainer}>
            <Image
              style={styles.logo}
              source={require('@/src/assets/images/app_logo.png')}
              resizeMode="cover"
              accessibilityLabel="ResilientHQ Logo"
            />
          </View>
        </Animated.View>

        {/* App name */}
        <Text style={[styles.appName, { color: colors.text }]}>ResilientHQ</Text>

        {/* Tagline with fade-in animation */}
        <Animated.View style={taglineAnimatedStyle}>
          <Text style={[styles.tagline, { color: colors.primary }]}>{TAGLINES[0]}</Text>
        </Animated.View>

        {/* Loading indicator */}
        <Animated.View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDot,
              loadingDot1Style,
              { backgroundColor: colors.primary, shadowColor: colors.primary },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              loadingDot2Style,
              { backgroundColor: colors.primary, shadowColor: colors.primary },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              loadingDot3Style,
              { backgroundColor: colors.primary, shadowColor: colors.primary },
            ]}
          />
        </Animated.View>
      </View>

      {/* Decorative elements - subtle wellness icons */}
      <View style={styles.decorativeContainer}>
        <Ionicons
          name="leaf-outline"
          size={24}
          color={`${colors.primary}20`}
          style={styles.decorativeIcon}
        />
        <Ionicons
          name="heart-outline"
          size={20}
          color={`${colors.secondary}20`}
          style={[styles.decorativeIcon, styles.decorativeIconRight]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        // iOS specific styles
      },
      android: {
        // Android specific styles
      },
    }),
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logoCropContainer: {
    width: FINAL_LOGO_SIZE,
    height: FINAL_LOGO_SIZE,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '120%',
    height: '120%',
  },
  appName: {
    fontSize: font.h1,
    fontWeight: '800',
    marginTop: -spacing.sm,
    marginBottom: 0,
    letterSpacing: -0.5,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif-medium',
      },
    }),
  },
  tagline: {
    fontSize: font.body,
    fontWeight: '500',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    letterSpacing: 0.3,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'sans-serif',
      },
    }),
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: radius.xs,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  decorativeContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    zIndex: 0,
  },
  decorativeIcon: {
    opacity: 0.4,
  },
  decorativeIconRight: {
    alignSelf: 'flex-end',
  },
});

export default SplashScreen;
