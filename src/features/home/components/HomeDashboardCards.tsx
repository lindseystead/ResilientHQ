import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { spacing } from '@/src/config/theme';
import { Pressable, Row, Spacer, Text } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { useResponsive } from '@/src/shared/utils/responsive';
import type { DashboardFeatureItem, DashboardQuickAction } from '../constants/dashboard';

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor: string;
}

interface HomeProgressCardProps {
  totalToday: number;
  dailyGoal: number;
  progressPercent: number;
  progressMessage: string;
  traumaSafeMode?: boolean;
  disableAnimation?: boolean;
  onPress: () => void;
}

interface HomeQuickActionsProps {
  actions: DashboardQuickAction[];
  disableAnimation?: boolean;
  onPressAction: (route: string) => void;
}

interface HomeFeatureGridProps {
  features: DashboardFeatureItem[];
  disableAnimation?: boolean;
  onPressFeature: (route: string) => void;
}

interface ActionCardProps {
  action: DashboardQuickAction;
  index: number;
  disableAnimation?: boolean;
  onPress: () => void;
}

interface FeatureCardProps {
  feature: DashboardFeatureItem;
  index: number;
  disableAnimation?: boolean;
  onPress: () => void;
}

const ProgressRing = memo<ProgressRingProps>(
  ({ progress, size, strokeWidth, color, backgroundColor }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <Svg width={size} height={size}>
        <Circle
          stroke={backgroundColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
    );
  },
);

ProgressRing.displayName = 'ProgressRing';

const QuickActionCard = memo<ActionCardProps>(({ action, index, disableAnimation, onPress }) => {
  const { theme } = useTheme();
  const { scaleSpacing, scaleFont } = useResponsive();
  const quickActionGradient = theme.colors[action.gradientToken];

  return (
    <Animated.View
      entering={disableAnimation ? undefined : FadeInUp.duration(400).delay(100 + index * 60)}
      style={styles.quickActionWrapper}
    >
      <Pressable
        onPress={onPress}
        accessibilityLabel={`${action.label}. ${action.description}`}
        style={[
          styles.quickAction,
          {
            borderRadius: scaleSpacing(20),
            minHeight: scaleSpacing(130),
          },
        ]}
      >
        <LinearGradient
          colors={quickActionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: scaleSpacing(20) }]}
        />
        <View style={styles.quickActionContent}>
          <View
            style={[
              styles.iconCircle,
              {
                width: scaleSpacing(44),
                height: scaleSpacing(44),
                borderRadius: scaleSpacing(12),
                backgroundColor: theme.colors.overlayLight,
              },
            ]}
          >
            <Ionicons name={action.icon} size={scaleFont(22)} color={theme.colors.white} />
          </View>
          <Spacer size={12} />
          <Text variant="label" weight="700" color={theme.colors.white}>
            {action.label}
          </Text>
          <Text
            variant="caption"
            color={theme.colors.white}
            style={{ marginTop: 2, opacity: 0.85 }}
          >
            {action.description}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

QuickActionCard.displayName = 'QuickActionCard';

const FeatureCard = memo<FeatureCardProps>(({ feature, index, disableAnimation, onPress }) => {
  const { theme } = useTheme();
  const { scaleSpacing, scaleFont } = useResponsive();

  return (
    <Animated.View
      entering={disableAnimation ? undefined : FadeInUp.duration(400).delay(200 + index * 50)}
      style={styles.featureWrapper}
    >
      <Pressable
        onPress={onPress}
        accessibilityLabel={`${feature.title}. ${feature.subtitle}`}
        style={[
          styles.featureCard,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: scaleSpacing(16),
            padding: scaleSpacing(16),
            ...theme.elevation.medium,
          },
        ]}
      >
        <View
          style={[
            styles.featureIcon,
            {
              backgroundColor: `${feature.color}15`,
              width: scaleSpacing(40),
              height: scaleSpacing(40),
              borderRadius: scaleSpacing(10),
            },
          ]}
        >
          <Ionicons name={feature.icon} size={scaleFont(20)} color={feature.color} />
        </View>
        <Spacer size={10} />
        <Text variant="label" numberOfLines={1}>
          {feature.title}
        </Text>
        <Text variant="caption" muted numberOfLines={1} style={{ marginTop: 2 }}>
          {feature.subtitle}
        </Text>
      </Pressable>
    </Animated.View>
  );
});

FeatureCard.displayName = 'FeatureCard';

export const HomeProgressCard = ({
  totalToday,
  dailyGoal,
  progressPercent,
  progressMessage,
  traumaSafeMode,
  disableAnimation,
  onPress,
}: HomeProgressCardProps) => {
  const { theme } = useTheme();
  const { scaleSpacing } = useResponsive();
  const primaryCardBackground =
    theme.mode === 'dark' ? `${theme.colors.primary}1F` : `${theme.colors.primary}10`;
  const primaryCardBorder =
    theme.mode === 'dark' ? `${theme.colors.primary}40` : `${theme.colors.primary}20`;
  const primaryRingBackground =
    theme.mode === 'dark' ? `${theme.colors.primary}33` : `${theme.colors.primary}26`;

  return (
    <Animated.View entering={disableAnimation ? undefined : FadeInUp.duration(400).delay(50)}>
      <Pressable
        onPress={onPress}
        style={[
          styles.progressCard,
          {
            backgroundColor: primaryCardBackground,
            borderRadius: scaleSpacing(20),
            padding: scaleSpacing(20),
            marginBottom: scaleSpacing(24),
            borderWidth: 1,
            borderColor: primaryCardBorder,
          },
        ]}
      >
        <View style={styles.progressContent}>
          <View style={styles.progressText}>
            <Text variant="caption" weight="600" color={theme.colors.primary} style={styles.kicker}>
              {traumaSafeMode ? "TODAY'S RHYTHM" : "TODAY'S PROGRESS"}
            </Text>
            <Text variant="h3" style={{ marginTop: 4 }}>
              {totalToday} of {dailyGoal} activities
            </Text>
            <Text variant="body" muted style={{ marginTop: 4 }}>
              {progressMessage}
            </Text>
          </View>
          <View style={styles.progressRing}>
            <ProgressRing
              progress={progressPercent}
              size={scaleSpacing(64)}
              strokeWidth={scaleSpacing(6)}
              color={theme.colors.primary}
              backgroundColor={primaryRingBackground}
            />
            <Text
              variant="label"
              weight="700"
              color={theme.colors.primary}
              style={styles.progressPercent}
            >
              {Math.round(progressPercent)}%
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const HomeQuickActions = ({
  actions,
  disableAnimation,
  onPressAction,
}: HomeQuickActionsProps) => (
  <Row gap={12} style={styles.quickActionsRow}>
    {actions.map((action, index) => (
      <QuickActionCard
        key={action.id}
        action={action}
        index={index}
        disableAnimation={disableAnimation}
        onPress={() => onPressAction(action.route)}
      />
    ))}
  </Row>
);

export const PrivateSessionCard = ({
  disableAnimation,
  onPress,
}: {
  disableAnimation?: boolean;
  onPress: () => void;
}) => {
  const { theme } = useTheme();
  const { scaleSpacing, scaleFont } = useResponsive();
  const privateCardBorder =
    theme.mode === 'dark' ? `${theme.colors.border2}40` : `${theme.colors.border2}30`;
  const privateIconBackground =
    theme.mode === 'dark' ? `${theme.colors.success}2E` : `${theme.colors.success}1F`;

  return (
    <Animated.View entering={disableAnimation ? undefined : FadeInUp.duration(300).delay(140)}>
      <Pressable
        onPress={onPress}
        accessibilityLabel="Start private session. Opens chat without memory or prompt suggestions."
        style={[
          styles.privateSessionCard,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: scaleSpacing(16),
            padding: scaleSpacing(16),
            marginBottom: scaleSpacing(24),
            borderWidth: 1,
            borderColor: privateCardBorder,
          },
        ]}
      >
        <View
          style={[
            styles.privateSessionIcon,
            {
              backgroundColor: privateIconBackground,
              width: scaleSpacing(40),
              height: scaleSpacing(40),
              borderRadius: scaleSpacing(12),
            },
          ]}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={scaleFont(20)}
            color={theme.colors.success}
          />
        </View>
        <View style={styles.privateSessionCopy}>
          <Text variant="label">Start private session</Text>
          <Text variant="caption" muted style={{ marginTop: scaleSpacing(4) }}>
            Open chat with memory off and prompts paused for this session.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={scaleFont(18)} color={theme.colors.text2} />
      </Pressable>
    </Animated.View>
  );
};

export const HomeFeatureGrid = ({
  features,
  disableAnimation,
  onPressFeature,
}: HomeFeatureGridProps) => (
  <View style={styles.featuresGrid}>
    {features.map((feature, index) => (
      <FeatureCard
        key={feature.id}
        feature={feature}
        index={index}
        disableAnimation={disableAnimation}
        onPress={() => onPressFeature(feature.route)}
      />
    ))}
  </View>
);

export const HomeSettingsLink = ({
  disableAnimation,
  onPress,
}: {
  disableAnimation?: boolean;
  onPress: () => void;
}) => {
  const { theme } = useTheme();
  const { scaleSpacing, scaleFont } = useResponsive();

  return (
    <Animated.View entering={disableAnimation ? undefined : FadeIn.duration(300).delay(400)}>
      <Pressable
        onPress={onPress}
        style={[
          styles.settingsLink,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: scaleSpacing(16),
            padding: scaleSpacing(16),
            marginTop: scaleSpacing(8),
            marginBottom: scaleSpacing(24),
            ...theme.elevation.low,
          },
        ]}
      >
        <Row gap={12} style={{ flex: 1 }}>
          <View
            style={[
              styles.settingsIcon,
              {
                backgroundColor: theme.colors.input,
                width: scaleSpacing(40),
                height: scaleSpacing(40),
                borderRadius: scaleSpacing(10),
              },
            ]}
          >
            <Ionicons name="settings-outline" size={scaleFont(18)} color={theme.colors.text2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label">Settings</Text>
            <Text variant="caption" muted>
              Preferences & account
            </Text>
          </View>
        </Row>
        <Ionicons name="chevron-forward" size={scaleFont(18)} color={theme.colors.text2} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  progressCard: {},
  progressContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    flex: 1,
    marginRight: 16,
  },
  kicker: {
    letterSpacing: 0.5,
  },
  progressRing: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    position: 'absolute',
  },
  quickActionsRow: {
    marginBottom: 24,
  },
  quickActionWrapper: {
    flex: 1,
    minWidth: 100,
    maxWidth: 200,
  },
  quickAction: {
    overflow: 'hidden',
    padding: spacing.lg,
  },
  quickActionContent: {
    position: 'relative',
    zIndex: 1,
  },
  iconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privateSessionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  privateSessionCopy: {
    flex: 1,
    marginRight: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  featureWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  featureCard: {},
  featureIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
