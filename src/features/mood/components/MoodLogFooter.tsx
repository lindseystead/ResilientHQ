/**
 * Mood Log Footer Component
 *
 * Footer section for MoodLogScreen showing wellness tips, resources, and journal button.
 */

import { Body, Button, Card, SectionTitle, TipItem } from '@/src/shared/ui';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export interface MoodLogFooterProps {
  onResourcePress: (phoneNumber: string, resourceName: string) => void;
  onJournalPress: () => void;
}

const MoodLogFooter: React.FC<MoodLogFooterProps> = ({ onResourcePress, onJournalPress }) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  return (
    <View>
      {/* Wellness Tips */}
      <Card>
        <SectionTitle>Wellness Tips</SectionTitle>
        <TipItem icon="cafe-outline" text="Take regular breaks to recharge." />
        <TipItem icon="heart-outline" text="Practice deep breathing exercises." />
        <TipItem icon="people-outline" text="Stay connected with friends and family." />
      </Card>

      {/* Resources */}
      <Card>
        <SectionTitle>Resources</SectionTitle>
        <View style={styles.cardContainer}>
          <TouchableOpacity
            onPress={() => onResourcePress('1 (800) 784-2433', 'Mental Health Hotline')}
            style={[
              styles.resourceButton,
              {
                borderColor: theme.colors.border2,
                padding: scaleSpacing(theme.spacing.md),
                borderRadius: theme.radius.lg,
                marginBottom: scaleSpacing(theme.spacing.md),
              },
            ]}
            activeOpacity={0.7}
          >
            <Body style={[styles.resourceText, { fontSize: scaleFont(16, 0.3) }]}>
              Mental Health Hotline
            </Body>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onResourcePress('1 (877) 520-3267', 'Support Groups')}
            style={[
              styles.resourceButton,
              {
                borderColor: theme.colors.border2,
                padding: scaleSpacing(theme.spacing.md),
                borderRadius: theme.radius.lg,
              },
            ]}
            activeOpacity={0.7}
          >
            <Body style={[styles.resourceText, { fontSize: scaleFont(16, 0.3) }]}>
              Support Groups
            </Body>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Journal Button */}
      <Button title="Go to Journal" onPress={onJournalPress} variant="secondary" fullWidth />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    // gap replaced with marginBottom
  },
  resourceButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  resourceText: {
    fontWeight: '500',
  },
});

export default MoodLogFooter;
