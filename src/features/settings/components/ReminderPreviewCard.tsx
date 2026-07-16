import React from 'react';
import { StyleSheet, View } from 'react-native';

import { font } from '@/src/config/theme';
import { Body } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { useResponsive } from '@/src/shared/utils/responsive';

interface ReminderPreviewCardProps {
  isLoading: boolean;
  title: string;
  summary: string;
  body: string;
  label: string;
  deliveryWindow: string;
}

const ReminderPreviewCard = ({
  isLoading,
  title,
  summary,
  body,
  label,
  deliveryWindow,
}: ReminderPreviewCardProps) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  return (
    <View
      style={[
        styles.card,
        {
          marginTop: scaleSpacing(theme.spacing.md),
          padding: scaleSpacing(theme.spacing.md),
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.input,
          borderColor: theme.colors.border2,
        },
      ]}
    >
      <Body
        style={[
          styles.kicker,
          {
            color: theme.colors.primary,
            fontSize: scaleFont(font.caption, 0.2),
          },
        ]}
      >
        TODAY&apos;S REMINDER PREVIEW
      </Body>
      <Body
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: scaleFont(font.body, 0.2),
          },
        ]}
      >
        {isLoading ? 'Loading reminder preview…' : title}
      </Body>
      <Body
        style={[
          styles.body,
          {
            color: theme.colors.text2,
            fontSize: scaleFont(font.caption, 0.2),
          },
        ]}
      >
        {isLoading
          ? 'We are gathering your latest signals to keep reminder language calm and useful.'
          : `${summary} ${body}`}
      </Body>
      {!isLoading && (
        <Body
          style={[
            styles.meta,
            {
              color: theme.colors.secondary,
              fontSize: scaleFont(font.caption, 0.2),
            },
          ]}
        >
          {label} • {deliveryWindow}
        </Body>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  kicker: {
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 6,
    fontWeight: '600',
  },
  body: {
    marginTop: 6,
    lineHeight: 18,
  },
  meta: {
    marginTop: 10,
    fontWeight: '500',
  },
});

export default ReminderPreviewCard;
