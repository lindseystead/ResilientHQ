/**
 * Personalization Card Component
 *
 * AI-generated bio summary, wellness insights, and self-care score.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useFadeAnimation } from '@/src/shared/hooks/animation/useFadeAnimation';
import { useResponsive, SPACING, DIMENSIONS } from '@/src/shared/utils/responsive';
import { getButtonAccessibility } from '@/src/shared/utils/accessibility';
import { Card } from '@/src/shared/ui';

export interface PersonalizationCardProps {
  bioSummary?: string;
  wellnessInsight?: string;
  selfCareScore?: number;
  aiBioEnabled?: boolean;
  onGenerateBio?: () => Promise<void>;
  isLoadingBio?: boolean;
}

const PersonalizationCard: React.FC<PersonalizationCardProps> = ({
  bioSummary,
  wellnessInsight,
  selfCareScore = 0,
  aiBioEnabled = true,
  onGenerateBio,
  isLoadingBio = false,
}) => {
  const { theme } = useTheme();
  const { impact } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();

  const cardAnimation = useFadeAnimation({
    initialOpacity: 0,
    targetOpacity: 1,
    duration: 600,
    delay: 400,
    autoStart: true,
  });

  const handleGenerateBio = async () => {
    impact('light');
    await onGenerateBio?.();
  };

  const scorePercentage = Math.min(selfCareScore, 100);
  const scoreColor =
    scorePercentage >= 70
      ? theme.colors.accent
      : scorePercentage >= 40
        ? theme.colors.primary
        : theme.colors.error;

  return (
    <Animated.View style={cardAnimation.animatedStyle}>
      <Card
        variant="elevated"
        padding={scaleSpacing(SPACING.xl)}
        marginBottom={scaleSpacing(SPACING.lg)}
      >
        {/* Self-Care Score Badge */}
        <View
          style={[
            styles.scoreBadge,
            {
              backgroundColor: scoreColor + '20',
              padding: scaleSpacing(SPACING.md),
              borderRadius: DIMENSIONS.cardBorderRadius,
              marginBottom: scaleSpacing(SPACING.lg),
            },
          ]}
        >
          <View style={styles.scoreRow}>
            <Ionicons name="heart" size={scaleFont(24)} color={scoreColor} />
            <View style={styles.scoreContent}>
              <Text
                style={[
                  styles.scoreLabel,
                  {
                    color: theme.colors.text2,
                    fontSize: scaleFont(12),
                  },
                ]}
              >
                Daily Self-Care Score
              </Text>
              <Text
                style={[
                  styles.scoreValue,
                  {
                    color: scoreColor,
                    fontSize: scaleFont(28),
                  },
                ]}
              >
                {scorePercentage}%
              </Text>
            </View>
          </View>
        </View>

        {/* AI Bio Summary */}
        <View style={styles.bioSection}>
          <View style={styles.bioHeader}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  fontSize: scaleFont(16),
                },
              ]}
            >
              {aiBioEnabled ? 'AI-Generated Bio Summary' : 'Bio Summary'}
            </Text>
            {aiBioEnabled && onGenerateBio ? (
              <TouchableOpacity
                onPress={handleGenerateBio}
                disabled={isLoadingBio}
                style={[
                  styles.generateButton,
                  {
                    backgroundColor: theme.colors.primary + '20',
                    paddingHorizontal: scaleSpacing(SPACING.md),
                    paddingVertical: scaleSpacing(SPACING.xs),
                    borderRadius: DIMENSIONS.cardBorderRadius,
                  },
                ]}
                {...getButtonAccessibility('Generate bio', 'Generate AI bio summary')}
              >
                {isLoadingBio ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={scaleFont(14)} color={theme.colors.primary} />
                    <Text
                      style={[
                        styles.generateButtonText,
                        {
                          color: theme.colors.primary,
                          fontSize: scaleFont(12),
                          marginLeft: scaleSpacing(SPACING.xs),
                        },
                      ]}
                    >
                      Generate with AI
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
          {bioSummary ? (
            <Text
              style={[
                styles.bioText,
                {
                  color: theme.colors.text2,
                  fontSize: scaleFont(14),
                  marginTop: scaleSpacing(SPACING.md),
                },
              ]}
            >
              {bioSummary}
            </Text>
          ) : (
            <Text
              style={[
                styles.bioPlaceholder,
                {
                  color: theme.colors.placeholder,
                  fontSize: scaleFont(14),
                  marginTop: scaleSpacing(SPACING.md),
                },
              ]}
            >
              {aiBioEnabled
                ? "Tap 'Generate with AI' to create a personalized bio summary."
                : 'AI bio generation is disabled in this build. You can still add a personal bio manually from Edit Profile.'}
            </Text>
          )}
        </View>

        {/* Wellness Insight */}
        {wellnessInsight && (
          <View
            style={[
              styles.insightSection,
              {
                marginTop: scaleSpacing(SPACING.lg),
                paddingTop: scaleSpacing(SPACING.lg),
                borderTopColor: theme.colors.border2,
                borderTopWidth: 1,
              },
            ]}
          >
            <View style={styles.insightHeader}>
              <Ionicons name="bulb-outline" size={scaleFont(20)} color={theme.colors.accent} />
              <Text
                style={[
                  styles.insightTitle,
                  {
                    color: theme.colors.text,
                    fontSize: scaleFont(14),
                    marginLeft: scaleSpacing(SPACING.sm),
                  },
                ]}
              >
                Wellness Insight
              </Text>
            </View>
            <Text
              style={[
                styles.insightText,
                {
                  color: theme.colors.text2,
                  fontSize: scaleFont(13),
                  marginTop: scaleSpacing(SPACING.sm),
                },
              ]}
            >
              {wellnessInsight}
            </Text>
          </View>
        )}
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  scoreBadge: {
    // Padding, border radius, and background color applied inline
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  scoreContent: {
    flex: 1,
  },
  scoreLabel: {
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  scoreValue: {
    fontWeight: '800',
  },
  bioSection: {
    // Styles applied inline
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    flex: 1,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // Padding, border radius, and background color applied inline
  },
  generateButtonText: {
    fontWeight: '600',
  },
  bioText: {
    lineHeight: 20,
  },
  bioPlaceholder: {
    fontStyle: 'italic',
  },
  insightSection: {
    // Margin, padding, and border applied inline
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightTitle: {
    fontWeight: '600',
  },
  insightText: {
    lineHeight: 18,
  },
});

export default PersonalizationCard;
