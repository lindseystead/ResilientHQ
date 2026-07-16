/**
 * Highlights Card Component
 *
 * Reusable card component for displaying today's highlights (mood logs, journal entries).
 * Uses Card component for consistent styling.
 */

import { Card, Label, Subtitle } from '@/src/shared/ui';
import { font, radius } from '@/src/config/theme';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export interface HighlightsCardProps {
  moodLogsCount: number;
  journalEntriesCount: number;
}

const HighlightsCard: React.FC<HighlightsCardProps> = ({ moodLogsCount, journalEntriesCount }) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  return (
    <Card variant="elevated">
      <View
        style={styles.content}
        accessible={true}
        accessibilityLabel={`Today's highlights: ${moodLogsCount} mood ${moodLogsCount === 1 ? 'log' : 'logs'}, ${journalEntriesCount} journal ${journalEntriesCount === 1 ? 'entry' : 'entries'}`}
      >
        <View style={styles.item}>
          <View
            style={[
              styles.icon,
              {
                backgroundColor: theme.colors.primary + '20',
                width: scaleSpacing(theme.spacing['3xl']),
                height: scaleSpacing(theme.spacing['3xl']),
                borderRadius: scaleSpacing(radius.md),
                marginRight: scaleSpacing(theme.spacing.md),
              },
            ]}
          >
            <Ionicons
              name="happy-outline"
              size={scaleFont(font.bodySmall, 0.3)}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.text}>
            <Subtitle
              style={{
                fontSize: scaleFont(font.h2, 0.3),
                fontWeight: '700',
              }}
            >
              {moodLogsCount}
            </Subtitle>
            <Label style={{ marginTop: scaleSpacing(theme.spacing.xs) }}>
              Mood {moodLogsCount === 1 ? 'Log' : 'Logs'}
            </Label>
          </View>
        </View>
        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme.colors.border2,
              width: scaleSpacing(2),
              height: scaleSpacing(theme.spacing['3xl']),
            },
          ]}
        />
        <View style={styles.item}>
          <View
            style={[
              styles.icon,
              {
                backgroundColor: theme.colors.accent + '20',
                width: scaleSpacing(theme.spacing['3xl']),
                height: scaleSpacing(theme.spacing['3xl']),
                borderRadius: scaleSpacing(radius.md),
                marginRight: scaleSpacing(theme.spacing.md),
              },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={scaleFont(font.bodySmall, 0.3)}
              color={theme.colors.accent}
            />
          </View>
          <View style={styles.text}>
            <Subtitle
              style={{
                fontSize: scaleFont(font.h2, 0.3),
                fontWeight: '700',
              }}
            >
              {journalEntriesCount}
            </Subtitle>
            <Label style={{ marginTop: scaleSpacing(theme.spacing.xs) }}>
              Journal {journalEntriesCount === 1 ? 'Entry' : 'Entries'}
            </Label>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  divider: {
    // Styles applied inline
  },
});

export default HighlightsCard;
