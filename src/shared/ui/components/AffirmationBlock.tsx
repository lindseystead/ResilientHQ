/**
 * Shared Affirmation Block
 *
 * Reusable affirmation pattern used across multiple wellness surfaces.
 */

import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/providers/ThemeProvider';
import { font, spacing } from '@/src/config/theme';
import Button from './Button';
import Card from './Card';
import Body from '../typography/Body';

export interface AffirmationBlockProps {
  affirmation: string;
  isLoading: boolean;
  onRefresh: () => void;
}

const AffirmationBlock: React.FC<AffirmationBlockProps> = ({
  affirmation,
  isLoading,
  onRefresh,
}) => {
  const { theme } = useTheme();

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {
      // Silently fail if haptics are blocked or unavailable
    });
    onRefresh();
  };

  return (
    <Card>
      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <>
          <Body
            style={[styles.affirmationText, { color: theme.colors.primary, textAlign: 'center' }]}
          >
            &quot;{affirmation}&quot;
          </Body>

          <Button
            title="New Affirmation"
            onPress={handleRefresh}
            variant="secondary"
            style={styles.refreshButton}
          />
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  affirmationText: {
    fontSize: font.h4 + 2,
    fontStyle: 'italic',
    lineHeight: 30,
  },
  refreshButton: {
    marginTop: spacing.lg,
    alignSelf: 'center',
  },
});

export default AffirmationBlock;
