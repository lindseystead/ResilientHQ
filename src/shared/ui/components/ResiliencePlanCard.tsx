/**
 * Resilience Plan Card
 *
 * A structured, high-signal card for showing a user's next best
 * resilience-building actions.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import Card from './Card';
import Body from '../typography/Body';
import Caption from '../typography/Caption';
import Title from '../typography/Title';

export interface ResiliencePlanCardProps {
  title: string;
  summary: string;
  focus: string;
  steps: string[];
  reflectionPrompt: string;
  encouragement: string;
  icon: string;
  tone: 'baseline' | 'support' | 'steady' | 'growth';
  supportNote?: string;
  isLoading?: boolean;
}

const toneToColorKey: Record<ResiliencePlanCardProps['tone'], 'primary' | 'secondary' | 'accent'> =
  {
    baseline: 'primary',
    support: 'secondary',
    steady: 'accent',
    growth: 'primary',
  };

const ResiliencePlanCard: React.FC<ResiliencePlanCardProps> = ({
  title,
  summary,
  focus,
  steps,
  reflectionPrompt,
  encouragement,
  icon,
  tone,
  supportNote,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();
  const accentColor = theme.colors[toneToColorKey[tone]];

  if (isLoading) {
    return (
      <Card accessibilityLabel="Loading resilience plan">
        <ActivityIndicator size="small" color={accentColor} />
      </Card>
    );
  }

  return (
    <Card accessibilityLabel="Personalized resilience plan">
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${accentColor}18`,
              width: scaleSpacing(60),
              height: scaleSpacing(60),
              borderRadius: scaleSpacing(30),
              marginRight: scaleSpacing(theme.spacing.md),
            },
          ]}
        >
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={scaleFont(28)}
            color={accentColor}
          />
        </View>

        <View style={styles.headerCopy}>
          <Caption
            style={[
              styles.eyebrow,
              {
                color: accentColor,
                marginBottom: scaleSpacing(theme.spacing.xs),
              },
            ]}
          >
            Your resilience plan
          </Caption>
          <Title
            style={[
              styles.title,
              {
                marginBottom: scaleSpacing(theme.spacing.xs),
              },
            ]}
          >
            {title}
          </Title>
          <Body muted>{summary}</Body>
        </View>
      </View>

      <View
        style={[
          styles.focusBand,
          {
            backgroundColor: `${accentColor}10`,
            borderColor: `${accentColor}25`,
            borderRadius: scaleSpacing(theme.radius.md),
            padding: scaleSpacing(theme.spacing.md),
            marginTop: scaleSpacing(theme.spacing.lg),
          },
        ]}
      >
        <Caption
          style={[
            styles.focusLabel,
            {
              color: accentColor,
              marginBottom: scaleSpacing(theme.spacing.xs),
            },
          ]}
        >
          Focus now
        </Caption>
        <Body>{focus}</Body>
      </View>

      <View style={{ marginTop: scaleSpacing(theme.spacing.lg) }}>
        {steps.map((step, index) => (
          <View
            key={`${index}-${step}`}
            style={[
              styles.stepRow,
              {
                marginBottom: index === steps.length - 1 ? 0 : scaleSpacing(theme.spacing.sm),
              },
            ]}
          >
            <View
              style={[
                styles.stepBadge,
                {
                  backgroundColor: accentColor,
                  width: scaleSpacing(22),
                  height: scaleSpacing(22),
                  borderRadius: scaleSpacing(11),
                  marginRight: scaleSpacing(theme.spacing.sm),
                },
              ]}
            >
              <Caption style={[styles.stepBadgeText, { color: theme.colors.white }]}>
                {`${index + 1}`}
              </Caption>
            </View>
            <Body style={styles.stepText}>{step}</Body>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.reflectionBlock,
          {
            marginTop: scaleSpacing(theme.spacing.lg),
            paddingTop: scaleSpacing(theme.spacing.md),
            borderTopColor: theme.colors.border2,
          },
        ]}
      >
        <Caption
          style={[
            styles.sectionLabel,
            {
              marginBottom: scaleSpacing(theme.spacing.xs),
            },
          ]}
        >
          Reflection prompt
        </Caption>
        <Body style={styles.reflectionPrompt}>{reflectionPrompt}</Body>

        <Caption
          style={[
            styles.sectionLabel,
            {
              marginTop: scaleSpacing(theme.spacing.md),
              marginBottom: scaleSpacing(theme.spacing.xs),
            },
          ]}
        >
          Reminder
        </Caption>
        <Body muted>{encouragement}</Body>

        {supportNote ? (
          <View
            style={[
              styles.supportNote,
              {
                backgroundColor: theme.colors.errorLight,
                borderRadius: scaleSpacing(theme.radius.md),
                padding: scaleSpacing(theme.spacing.md),
                marginTop: scaleSpacing(theme.spacing.md),
              },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={scaleFont(18)} color={theme.colors.error} />
            <Body
              style={[
                styles.supportNoteText,
                {
                  color: theme.colors.error,
                  marginLeft: scaleSpacing(theme.spacing.sm),
                },
              ]}
            >
              {supportNote}
            </Body>
          </View>
        ) : null}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    lineHeight: 30,
  },
  focusBand: {
    borderWidth: 1,
  },
  focusLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
  },
  reflectionBlock: {
    borderTopWidth: 1,
  },
  sectionLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  reflectionPrompt: {
    fontStyle: 'italic',
  },
  supportNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  supportNoteText: {
    flex: 1,
  },
});

export default ResiliencePlanCard;
