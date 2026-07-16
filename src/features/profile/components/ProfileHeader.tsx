/**
 * Profile Header Component
 *
 * Profile header with avatar, name, and level badge.
 * Includes animations and shared theming.
 */

import { ShimmerLoader } from '@/src/shared/ui';
import { useFadeAnimation } from '@/src/shared/hooks/animation/useFadeAnimation';
// useMicroInteraction removed — using direct press animation instead
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useTheme } from '@/src/providers/ThemeProvider';
import { font, fontWeight } from '@/src/config/theme';
import { getButtonAccessibility, getImageAccessibility } from '@/src/shared/utils/accessibility';
import { getInitials } from '@/src/shared/utils/format';
import { DIMENSIONS, SPACING, useResponsive } from '@/src/shared/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// GestureDetector removed — TouchableOpacity handles press interactions
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export interface ProfileHeaderProps {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
  level?: number;
  levelLabel?: string;
  onAvatarPress?: () => void;
  isLoading?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  photoURL,
  displayName,
  email,
  level = 1,
  levelLabel = 'Getting Started',
  onAvatarPress,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();

  // Animations
  const headerAnimation = useFadeAnimation({
    initialOpacity: 0,
    targetOpacity: 1,
    duration: 600,
    autoStart: true,
  });

  const glowOpacity = useSharedValue(0);
  const avatarScale = useSharedValue(1);
  const avatarResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (avatarResetTimeoutRef.current) {
        clearTimeout(avatarResetTimeoutRef.current);
      }
    };
  }, []);

  // Avatar press handler
  const handleAvatarPress = () => {
    impact('light');
    avatarScale.value = withSpring(0.95, {
      damping: 12,
      stiffness: 180,
      mass: 1,
      overshootClamping: false,
    });
    if (avatarResetTimeoutRef.current) {
      clearTimeout(avatarResetTimeoutRef.current);
    }
    avatarResetTimeoutRef.current = setTimeout(() => {
      avatarScale.value = withSpring(1, {
        damping: 12,
        stiffness: 180,
        mass: 1,
        overshootClamping: false,
      });
    }, 100);
    onAvatarPress?.();
  };

  // Glow animation
  React.useEffect(() => {
    glowOpacity.value = withDelay(
      300,
      withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.cubic) }),
    );
  }, [glowOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  // Avatar size
  const avatarSize = scaleSpacing(DIMENSIONS.avatarSizeLarge || 120);
  const avatarBorderRadius = avatarSize / 2;
  const initialsFontSize = scaleFont(avatarSize * 0.4);

  const avatarAccessibility = getImageAccessibility(
    displayName ? `${displayName}'s profile picture` : 'User profile picture',
  );

  const buttonAccessibility = getButtonAccessibility(
    'Edit avatar',
    'Double tap to change your profile picture',
  );

  return (
    <Animated.View style={[headerAnimation.animatedStyle, styles.container]}>
      <View style={styles.headerContent}>
        {/* Avatar with glow effect */}
        <View style={styles.avatarWrapper}>
          <Animated.View style={[glowStyle, styles.glowContainer]}>
            <View
              style={[
                styles.glowCircle,
                {
                  width: avatarSize + scaleSpacing(SPACING.xl),
                  height: avatarSize + scaleSpacing(SPACING.xl),
                  borderRadius: (avatarSize + scaleSpacing(SPACING.xl)) / 2,
                  backgroundColor: theme.colors.primary + '40',
                },
              ]}
            />
          </Animated.View>
          <Animated.View style={avatarAnimatedStyle}>
            <TouchableOpacity
              onPress={handleAvatarPress}
              activeOpacity={0.9}
              style={[
                styles.avatarContainer,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarBorderRadius,
                  ...theme.elevation.high,
                },
              ]}
              {...buttonAccessibility}
            >
              {isLoading ? (
                <ShimmerLoader
                  width={avatarSize}
                  height={avatarSize}
                  borderRadius={avatarBorderRadius}
                />
              ) : photoURL ? (
                <View style={styles.imageWrapper}>
                  <LinearGradient
                    colors={[theme.colors.primary + '20', 'transparent']}
                    style={[styles.imageGradient, { borderRadius: avatarBorderRadius }]}
                  />
                  <View
                    style={[
                      styles.avatarImage,
                      {
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: avatarBorderRadius,
                        backgroundColor: theme.colors.primary + '20',
                      },
                    ]}
                    {...avatarAccessibility}
                  />
                </View>
              ) : (
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={[
                    styles.avatarGradient,
                    {
                      width: avatarSize,
                      height: avatarSize,
                      borderRadius: avatarBorderRadius,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.initials,
                      {
                        fontSize: initialsFontSize,
                        color: theme.colors.white,
                      },
                    ]}
                  >
                    {displayName ? getInitials(displayName) : '?'}
                  </Text>
                </LinearGradient>
              )}
              {/* Edit badge */}
              <View
                style={[
                  styles.editBadge,
                  {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.white,
                    width: scaleSpacing(SPACING.xl),
                    height: scaleSpacing(SPACING.xl),
                    borderRadius: scaleSpacing(SPACING.xl) / 2,
                    borderWidth: 3,
                  },
                ]}
              >
                <Ionicons name="camera" size={scaleFont(font.label)} color={theme.colors.white} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Name and Level */}
        <View style={styles.nameSection}>
          <Text
            style={[
              styles.name,
              {
                color: theme.colors.text,
                fontSize: scaleFont(font.h2),
              },
            ]}
          >
            {displayName || email?.split('@')[0] || 'User'}
          </Text>
          {email && (
            <Text
              style={[
                styles.email,
                {
                  color: theme.colors.text2,
                  fontSize: scaleFont(font.label),
                },
              ]}
            >
              {email}
            </Text>
          )}
          {/* Level Badge */}
          <View
            style={[
              styles.levelBadge,
              {
                backgroundColor: theme.colors.primary + '20',
                paddingHorizontal: scaleSpacing(SPACING.md),
                paddingVertical: scaleSpacing(SPACING.xs),
                borderRadius: DIMENSIONS.cardBorderRadius,
                marginTop: scaleSpacing(SPACING.sm),
              },
            ]}
          >
            <Ionicons name="star" size={scaleFont(font.label)} color={theme.colors.primary} />
            <Text
              style={[
                styles.levelText,
                {
                  color: theme.colors.primary,
                  fontSize: scaleFont(font.caption),
                  marginLeft: scaleSpacing(SPACING.xs),
                },
              ]}
            >
              Resilience Level {level} — {levelLabel}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  glowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    // Size and border radius applied inline
  },
  avatarContainer: {
    overflow: 'hidden',
    // Size, border radius, and shadow applied inline
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  avatarImage: {
    // Size and border radius applied inline
  },
  avatarGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    // Size and border radius applied inline
  },
  initials: {
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // Size, border radius, and border width applied inline
  },
  nameSection: {
    alignItems: 'center',
  },
  name: {
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  email: {
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    // Padding, border radius, and background color applied inline
  },
  levelText: {
    fontWeight: fontWeight.semibold,
    // Font size, color, and margin applied inline
  },
});

export default ProfileHeader;
