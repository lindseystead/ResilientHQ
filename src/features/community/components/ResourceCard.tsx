/**
 * Resource Card Component
 *
 * Reusable component for displaying resource items.
 * Uses the shared app theme.
 */

import { Avatar } from '@/src/shared/ui';
import { font, radius, spacing } from '@/src/config/theme';
import { useTheme } from '@/src/providers/ThemeProvider';
import { Resource } from '@/src/domains/community';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { useResponsive } from '@/src/shared/utils/responsive';
import { format } from 'date-fns';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export interface ResourceCardProps {
  resource: Resource;
}

const ResourceCardComponent: React.FC<ResourceCardProps> = ({ resource }) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();
  const resourceDate = normalizeTimestamp(resource.createdAt);

  return (
    <View
      style={[
        styles.resourceCard,
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
          styles.resourceContent,
          {
            color: theme.colors.text,
            fontSize: scaleFont(font.body, 0.3),
            lineHeight: scaleFont(font.body, 0.3) * 1.375, // 1.375 line height ratio
            marginBottom: scaleSpacing(spacing.md),
          },
        ]}
      >
        {resource.content}
      </Text>
      <View style={styles.resourceFooter}>
        <Avatar uri={resource.authorAvatar} size={24} name={resource.authorName} />
        <Text style={[styles.resourceUser, { color: theme.colors.text2 }]}>
          {resource.authorName} • {format(resourceDate, 'MMM d')}
        </Text>
      </View>
    </View>
  );
};

const ResourceCard = React.memo(ResourceCardComponent);

const styles = StyleSheet.create({
  resourceCard: {
    // borderRadius, padding, marginBottom applied inline with design tokens
  },
  resourceContent: {
    // fontSize, lineHeight, marginBottom applied inline with design tokens
  },
  resourceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resourceUser: {
    fontSize: font.labelSmall + 1,
  },
});

ResourceCard.displayName = 'ResourceCard';

export default ResourceCard;
