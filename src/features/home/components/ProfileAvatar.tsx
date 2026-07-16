/**
 * Profile Avatar Component
 *
 * Reusable profile avatar with photo URL support and gradient placeholder with initials.
 * Includes a loading shimmer, haptic feedback, and shared theming.
 * Fully integrated with responsive utilities, accessibility, and theme system.
 */

import { ROUTES } from '@/src/config/navigation';
import { useTypedNavigation } from '@/src/shared/hooks';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useTheme } from '@/src/providers/ThemeProvider';
import { withAlpha } from '@/src/shared/ui/theme/color';
import {
  ACCESSIBILITY_HINTS,
  getButtonAccessibility,
  getImageAccessibility,
} from '@/src/shared/utils/accessibility';
import { getInitials } from '@/src/shared/utils/format';
import { DIMENSIONS, SPACING, useResponsive } from '@/src/shared/utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export interface ProfileAvatarProps {
  photoURL?: string | null;
  displayName?: string | null;
  size?: number;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ photoURL, displayName, size }) => {
  const { theme } = useTheme();
  const navigation = useTypedNavigation();
  const { impact } = useHaptics();
  const { scaleSpacing, scaleFont } = useResponsive();

  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Responsive avatar size
  const avatarSize = size || scaleSpacing(DIMENSIONS.avatarSize);
  const avatarBorderRadius = avatarSize / 2;

  // Shimmer animation for loading
  const shimmerTranslateX = useSharedValue(-avatarSize);
  const shimmerOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (imageLoading) {
      shimmerTranslateX.value = withRepeat(
        withSequence(
          withTiming(avatarSize * 2, {
            duration: 1500,
            easing: Easing.linear,
          }),
          withTiming(-avatarSize, {
            duration: 0,
          }),
        ),
        -1,
        false,
      );
      shimmerOpacity.value = withRepeat(
        withSequence(withTiming(0.6, { duration: 750 }), withTiming(0.3, { duration: 750 })),
        -1,
        true,
      );
    } else {
      shimmerTranslateX.value = -avatarSize;
      shimmerOpacity.value = 0;
    }
  }, [imageLoading, avatarSize, shimmerTranslateX, shimmerOpacity]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslateX.value }],
    opacity: shimmerOpacity.value,
  }));

  const handlePress = () => {
    impact('light');
    navigation.push(ROUTES.profile);
  };

  const handleImageLoadStart = () => {
    setImageLoading(true);
    setImageError(false);
  };

  const handleImageLoadEnd = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Responsive font size for initials
  const initialsFontSize = scaleFont(avatarSize * 0.4, 0.3);

  // Theme-based shadow
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: scaleSpacing(SPACING.sm),
    },
    android: {
      elevation: 4,
    },
  });

  const buttonAccessibility = getButtonAccessibility(
    'Go to profile',
    ACCESSIBILITY_HINTS.backButton,
  );

  const imageAccessibility = getImageAccessibility('Profile picture');

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[styles.container, shadowStyle]}
      {...buttonAccessibility}
    >
      {photoURL && !imageError ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: photoURL }}
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarBorderRadius,
              },
              shadowStyle,
            ]}
            resizeMode="cover"
            onLoadStart={handleImageLoadStart}
            onLoadEnd={handleImageLoadEnd}
            onError={handleImageError}
            {...imageAccessibility}
          />
          {imageLoading && (
            <View
              style={[
                styles.loadingOverlay,
                {
                  backgroundColor: withAlpha(theme.colors.black, 0.3),
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarBorderRadius,
                },
              ]}
            >
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    backgroundColor: withAlpha(theme.colors.white, 0.3),
                    width: avatarSize * 0.5,
                    height: avatarSize,
                  },
                  shimmerStyle,
                ]}
              />
            </View>
          )}
        </View>
      ) : (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={[
            styles.avatar,
            styles.gradientAvatar,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarBorderRadius,
            },
            shadowStyle,
          ]}
        >
          <Text
            style={[
              styles.initials,
              {
                fontSize: initialsFontSize,
                color: theme.colors.white,
                fontWeight: '700',
                letterSpacing: 0.5,
              },
            ]}
          >
            {displayName ? getInitials(displayName) : '?'}
          </Text>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // Shadow applied inline
  },
  imageContainer: {
    position: 'relative',
  },
  avatar: {
    // Size, border radius, and shadow applied inline
  },
  gradientAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    // Font size and color applied inline
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // Size and border radius applied inline
  },
  shimmer: {
    position: 'absolute',
    // Size applied inline
  },
});

export default ProfileAvatar;
