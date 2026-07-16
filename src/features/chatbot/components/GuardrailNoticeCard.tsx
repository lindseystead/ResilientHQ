import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { font } from '@/src/config/theme';
import { Button, Card } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { useResponsive } from '@/src/shared/utils/responsive';

interface GuardrailNoticeCardProps {
  message: string;
  onDismiss?: () => void;
}

const GuardrailNoticeCard = ({ message, onDismiss }: GuardrailNoticeCardProps) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  return (
    <View style={styles.container}>
      <Card variant="outlined" padding={scaleSpacing(theme.spacing.md)}>
        <Text
          style={[
            styles.text,
            {
              color: theme.colors.text,
              fontSize: scaleFont(font.label, 0.3),
            },
          ]}
        >
          {message}
        </Text>
        {onDismiss ? (
          <View style={styles.actions}>
            <Button title="Dismiss" variant="outline" size="small" onPress={onDismiss} />
          </View>
        ) : null}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  text: {
    lineHeight: 20,
  },
  actions: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
});

export default GuardrailNoticeCard;
