/**
 * Daily Check-In Card
 *
 * Home-dashboard card for a short, structured resilience check-in.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '@/src/config/theme';
import { type DailyResilienceCheckIn, type ResilienceCheckInSignal } from '@/src/domains/wellbeing';
import { Pressable, Text } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { withAlpha } from '@/src/shared/ui/theme/color';
import { useResponsive } from '@/src/shared/utils/responsive';

export interface DailyCheckInCardProps {
  checkIn: DailyResilienceCheckIn;
  onPress: () => void;
}

const STATUS_ICON: Record<ResilienceCheckInSignal['status'], keyof typeof Ionicons.glyphMap> = {
  restore: 'shield-outline',
  steady: 'pulse-outline',
  strong: 'sparkles-outline',
};

const STATUS_COLOR = (
  status: ResilienceCheckInSignal['status'],
  colors: ReturnType<typeof useTheme>['theme']['colors'],
): string => {
  switch (status) {
    case 'restore':
      return colors.warning;
    case 'steady':
      return colors.primary;
    case 'strong':
      return colors.success;
    default:
      return colors.primary;
  }
};

const DailyCheckInCard: React.FC<DailyCheckInCardProps> = ({ checkIn, onPress }) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${checkIn.title}. ${checkIn.summary}. ${checkIn.primaryActionLabel}.`}
      style={[
        styles.card,
        {
          backgroundColor:
            theme.mode === 'dark'
              ? withAlpha(theme.colors.success, 0.1)
              : withAlpha(theme.colors.success, 0.06),
          borderColor:
            theme.mode === 'dark'
              ? withAlpha(theme.colors.success, 0.25)
              : withAlpha(theme.colors.success, 0.14),
          borderRadius: scaleSpacing(20),
          padding: scaleSpacing(20),
          marginBottom: scaleSpacing(24),
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text
            variant="caption"
            weight="700"
            style={[styles.kicker, { color: theme.colors.success }]}
          >
            DAILY CHECK-IN
          </Text>
          <Text variant="h4" style={{ marginTop: scaleSpacing(4) }}>
            {checkIn.title}
          </Text>
          <Text variant="body" muted style={{ marginTop: scaleSpacing(4) }}>
            {checkIn.summary}
          </Text>
        </View>
        <View
          style={[
            styles.headerIcon,
            {
              backgroundColor: `${theme.colors.success}18`,
              width: scaleSpacing(48),
              height: scaleSpacing(48),
              borderRadius: scaleSpacing(14),
            },
          ]}
        >
          <Ionicons name="leaf-outline" size={scaleFont(22)} color={theme.colors.success} />
        </View>
      </View>

      <View style={styles.signalList}>
        {checkIn.signals.map((signal) => {
          const accent = STATUS_COLOR(signal.status, theme.colors);

          return (
            <View key={signal.id} style={styles.signalRow}>
              <View
                style={[
                  styles.signalIcon,
                  {
                    backgroundColor: `${accent}18`,
                    borderRadius: scaleSpacing(10),
                    width: scaleSpacing(34),
                    height: scaleSpacing(34),
                  },
                ]}
              >
                <Ionicons name={STATUS_ICON[signal.status]} size={scaleFont(16)} color={accent} />
              </View>
              <View style={styles.signalCopy}>
                <Text variant="label" numberOfLines={1}>
                  {signal.label}
                </Text>
                <Text
                  variant="caption"
                  muted
                  numberOfLines={2}
                  style={{ marginTop: scaleSpacing(2) }}
                >
                  {signal.prompt}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: scaleSpacing(16),
            padding: scaleSpacing(14),
          },
        ]}
      >
        <View style={styles.footerCopy}>
          <Text variant="label" color={theme.colors.primary}>
            {checkIn.primaryActionLabel}
          </Text>
          <Text variant="caption" muted style={{ marginTop: scaleSpacing(2) }}>
            {checkIn.actionReason}
          </Text>
          <Text
            variant="caption"
            weight="600"
            style={{ marginTop: scaleSpacing(8), color: theme.colors.text2 }}
          >
            {checkIn.completionLabel}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={scaleFont(18)}
          color={theme.colors.text2}
          style={styles.chevron}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerCopy: {
    flex: 1,
    marginRight: spacing.md,
  },
  kicker: {
    letterSpacing: 0.6,
  },
  headerIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalList: {
    gap: spacing.md,
    marginTop: 16,
    marginBottom: 16,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  signalIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  signalCopy: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerCopy: {
    flex: 1,
  },
  chevron: {
    marginLeft: spacing.md,
  },
});

export default DailyCheckInCard;
