/**
 * Crisis Support Sheet
 *
 * Presents urgent support actions when the chatbot detects high-risk language.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing } from '@/src/config/theme';
import { Button, Card } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { useResponsive } from '@/src/shared/utils/responsive';

interface CrisisSheetAction {
  label: string;
  onPress: () => void;
}

interface CrisisSupportSheetProps {
  bodyText: string;
  primaryCallAction?: CrisisSheetAction;
  primaryTextAction?: CrisisSheetAction;
  emergencyAction?: CrisisSheetAction;
  directoryAction: CrisisSheetAction;
  onStartGrounding: () => void;
  onDismiss: () => void;
}

const CrisisSupportSheet: React.FC<CrisisSupportSheetProps> = ({
  bodyText,
  primaryCallAction,
  primaryTextAction,
  emergencyAction,
  directoryAction,
  onStartGrounding,
  onDismiss,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  return (
    <View style={styles.container}>
      <Card variant="outlined" padding={scaleSpacing(theme.spacing.lg)} marginBottom={0}>
        <Text style={[styles.title, { color: theme.colors.text, fontSize: scaleFont(20, 0.3) }]}>
          Immediate Support
        </Text>
        <Text style={[styles.body, { color: theme.colors.text2, fontSize: scaleFont(14, 0.3) }]}>
          {bodyText}
        </Text>
        {(primaryCallAction || primaryTextAction) && (
          <View style={styles.primaryActions}>
            {primaryCallAction && (
              <Button
                title={primaryCallAction.label}
                variant="danger"
                onPress={primaryCallAction.onPress}
                fullWidth={true}
              />
            )}
            {primaryTextAction && (
              <Button
                title={primaryTextAction.label}
                variant="primary"
                onPress={primaryTextAction.onPress}
                fullWidth={true}
              />
            )}
          </View>
        )}
        <View style={styles.secondaryActions}>
          {emergencyAction && (
            <Button
              title={emergencyAction.label}
              variant="outline"
              onPress={emergencyAction.onPress}
              size="small"
              fullWidth={true}
            />
          )}
          <Button
            title={directoryAction.label}
            variant="outline"
            onPress={directoryAction.onPress}
            size="small"
            fullWidth={true}
          />
          <Button
            title="Grounding"
            variant="secondary"
            onPress={onStartGrounding}
            size="small"
            fullWidth={true}
          />
          <Button
            title="Dismiss"
            variant="outline"
            onPress={onDismiss}
            size="small"
            fullWidth={true}
          />
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  title: {
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  body: {
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  primaryActions: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  secondaryActions: {
    gap: spacing.sm + spacing.xs / 2,
  },
});

export default CrisisSupportSheet;
