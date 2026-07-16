/**
 * Event Card Component
 *
 * Reusable component for displaying event items.
 * Uses the shared app theme.
 */

import { Avatar } from '@/src/shared/ui';
import { font, radius, spacing } from '@/src/config/theme';
import { useTheme } from '@/src/providers/ThemeProvider';
import { Event } from '@/src/domains/community';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { useResponsive } from '@/src/shared/utils/responsive';
import { format } from 'date-fns';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export interface EventCardProps {
  event: Event;
}

const EventCardComponent: React.FC<EventCardProps> = ({ event }) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();
  const eventDate = normalizeTimestamp(event.createdAt);

  return (
    <View
      style={[
        styles.eventCard,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: scaleSpacing(radius.lg),
          padding: scaleSpacing(spacing.lg),
          marginBottom: scaleSpacing(spacing.md),
          ...Platform.select({
            ios: {
              shadowColor: theme.colors.black,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
            },
            android: {
              elevation: 2,
            },
          }),
        },
      ]}
    >
      <Text
        style={[
          styles.eventContent,
          {
            color: theme.colors.text,
            fontSize: scaleFont(font.body, 0.3),
            lineHeight: scaleFont(font.body, 0.3) * 1.375, // 1.375 line height ratio
            marginBottom: scaleSpacing(spacing.md),
          },
        ]}
      >
        {event.content}
      </Text>
      <View style={styles.eventFooter}>
        <Avatar uri={event.authorAvatar} size={24} name={event.authorName} />
        <Text style={[styles.eventUser, { color: theme.colors.text2 }]}>
          {event.authorName} • {format(eventDate, 'MMM d')}
        </Text>
      </View>
    </View>
  );
};

const EventCard = React.memo(EventCardComponent);

const styles = StyleSheet.create({
  eventCard: {
    // borderRadius, padding, marginBottom applied inline with design tokens
  },
  eventContent: {
    // fontSize, lineHeight, marginBottom applied inline with design tokens
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  eventUser: {
    fontSize: font.labelSmall + 1,
  },
});

EventCard.displayName = 'EventCard';

export default EventCard;
