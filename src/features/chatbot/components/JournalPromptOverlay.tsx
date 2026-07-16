import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { font, spacing } from '@/src/config/theme';
import { Button, Card } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { withAlpha } from '@/src/shared/ui/theme/color';
import { useResponsive } from '@/src/shared/utils/responsive';

interface JournalPromptOverlayProps {
  visible: boolean;
  title: string;
  body: string;
  onDismiss: () => void;
  onSave: () => void;
}

const JournalPromptOverlay = ({
  visible,
  title,
  body,
  onDismiss,
  onSave,
}: JournalPromptOverlayProps) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  if (!visible) {
    return null;
  }

  return (
    <View
      style={[
        styles.overlay,
        {
          backgroundColor: withAlpha(theme.colors.black, 0.5),
          padding: scaleSpacing(theme.spacing.xl),
        },
      ]}
    >
      <Card variant="elevated" padding={scaleSpacing(theme.spacing.lg)}>
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: scaleFont(font.body, 0.3),
            },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.body,
            {
              color: theme.colors.text2,
              fontSize: scaleFont(14),
            },
          ]}
        >
          {body}
        </Text>
        <View style={styles.actions}>
          <Button title="Don't save this" variant="outline" onPress={onDismiss} size="small" />
          <Button title="Save" variant="primary" onPress={onSave} size="small" />
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // Background color and padding applied inline with theme values
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
});

export default JournalPromptOverlay;
