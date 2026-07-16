/**
 * Premium Features Card Component
 *
 * Monetization card with upgrade prompt and premium feature highlights.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useFadeAnimation } from '@/src/shared/hooks/animation/useFadeAnimation';
import { useResponsive, SPACING, DIMENSIONS } from '@/src/shared/utils/responsive';
import { getButtonAccessibility } from '@/src/shared/utils/accessibility';
import { Card } from '@/src/shared/ui';

export interface PremiumFeaturesCardProps {
  isPremium?: boolean;
  onUpgrade?: () => void;
}

type PremiumFeature = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const PremiumFeaturesCard: React.FC<PremiumFeaturesCardProps> = ({
  isPremium = false,
  onUpgrade,
}) => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();

  const cardAnimation = useFadeAnimation({
    initialOpacity: 0,
    targetOpacity: 1,
    duration: 600,
    delay: 600,
    autoStart: true,
  });

  // Premium badge pulse animation
  const badgeScale = useSharedValue(1);
  React.useEffect(() => {
    if (isPremium) {
      badgeScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.cubic) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.cubic) }),
        ),
        -1,
        true,
      );
    }
  }, [isPremium, badgeScale]);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const premiumFeatures: PremiumFeature[] = [
    { icon: 'sparkles', label: 'Custom Themes' },
    { icon: 'color-palette', label: 'Custom Avatars' },
    { icon: 'analytics', label: 'Advanced Insights' },
    { icon: 'infinite', label: 'Unlimited AI Chats' },
  ];

  if (isPremium) {
    return (
      <Animated.View style={cardAnimation.animatedStyle}>
        <Card
          variant="elevated"
          padding={scaleSpacing(SPACING.xl)}
          marginBottom={scaleSpacing(SPACING.lg)}
        >
          <LinearGradient
            colors={[theme.colors.primary + '20', theme.colors.secondary + '10']}
            style={[
              styles.premiumBadge,
              {
                padding: scaleSpacing(SPACING.md),
                borderRadius: DIMENSIONS.cardBorderRadius,
                marginBottom: scaleSpacing(SPACING.md),
              },
            ]}
          >
            <Animated.View style={badgeAnimatedStyle}>
              <Ionicons name="star" size={scaleFont(24)} color={theme.colors.primary} />
            </Animated.View>
            <Text
              style={[
                styles.premiumText,
                {
                  color: theme.colors.primary,
                  fontSize: scaleFont(16),
                  marginLeft: scaleSpacing(SPACING.sm),
                },
              ]}
            >
              ResilientHQ+ Member
            </Text>
          </LinearGradient>
          <Text
            style={[
              styles.premiumDescription,
              {
                color: theme.colors.text2,
                fontSize: scaleFont(13),
              },
            ]}
          >
            Thank you for being a premium member! Enjoy all exclusive features.
          </Text>
        </Card>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={cardAnimation.animatedStyle}>
      <Card
        variant="elevated"
        padding={scaleSpacing(SPACING.xl)}
        marginBottom={scaleSpacing(SPACING.lg)}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={[
            styles.upgradeHeader,
            {
              padding: scaleSpacing(SPACING.lg),
              borderRadius: DIMENSIONS.cardBorderRadius,
              marginBottom: scaleSpacing(SPACING.lg),
            },
          ]}
        >
          <Ionicons name="star" size={scaleFont(32)} color={theme.colors.white} />
          <Text
            style={[
              styles.upgradeTitle,
              {
                color: theme.colors.white,
                fontSize: scaleFont(20),
                marginTop: scaleSpacing(SPACING.sm),
              },
            ]}
          >
            Upgrade to ResilientHQ+
          </Text>
          <Text
            style={[
              styles.upgradeSubtitle,
              {
                color: theme.colors.white,
                fontSize: scaleFont(13),
                marginTop: scaleSpacing(SPACING.xs),
                opacity: 0.9,
              },
            ]}
          >
            Unlock premium features and support your wellness journey
          </Text>
        </LinearGradient>

        <View style={styles.featuresList}>
          {premiumFeatures.map((feature, index) => (
            <View
              key={feature.label}
              style={[
                styles.featureItem,
                {
                  marginBottom: index < premiumFeatures.length - 1 ? scaleSpacing(SPACING.md) : 0,
                },
              ]}
            >
              <Ionicons name={feature.icon} size={scaleFont(20)} color={theme.colors.primary} />
              <Text
                style={[
                  styles.featureLabel,
                  {
                    color: theme.colors.text,
                    fontSize: scaleFont(14),
                    marginLeft: scaleSpacing(SPACING.sm),
                  },
                ]}
              >
                {feature.label}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => {
            impact('medium');
            onUpgrade?.();
          }}
          style={[
            styles.upgradeButton,
            {
              backgroundColor: theme.colors.primary,
              paddingVertical: scaleSpacing(SPACING.md),
              borderRadius: DIMENSIONS.cardBorderRadius,
              marginTop: scaleSpacing(SPACING.lg),
            },
          ]}
          {...getButtonAccessibility('Upgrade to premium', 'Unlock premium features')}
        >
          <Text
            style={[
              styles.upgradeButtonText,
              {
                color: theme.colors.white,
                fontSize: scaleFont(16),
                fontWeight: '700',
              },
            ]}
          >
            Upgrade Now
          </Text>
        </TouchableOpacity>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    // Padding, border radius, and background applied inline
  },
  premiumText: {
    fontWeight: '700',
  },
  premiumDescription: {
    lineHeight: 18,
  },
  upgradeHeader: {
    alignItems: 'center',
    // Padding, border radius, and background applied inline
  },
  upgradeTitle: {
    fontWeight: '800',
  },
  upgradeSubtitle: {
    textAlign: 'center',
  },
  featuresList: {
    // Styles applied inline
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // Margin applied inline
  },
  featureLabel: {
    fontWeight: '500',
  },
  upgradeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    // Padding, border radius, and background applied inline
  },
  upgradeButtonText: {
    // Font size, color, and weight applied inline
  },
});

export default PremiumFeaturesCard;
