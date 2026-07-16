/**
 * Settings Row Component
 *
 * Reusable row component for settings options with label and control.
 * Uses centralized design tokens for consistent spacing and typography.
 */

import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Body } from '@/src/shared/ui';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';

export interface SettingsRowProps {
  label: string;
  description?: string;
  children?: ReactNode;
  onPress?: () => void;
  rightComponent?: ReactNode;
  showDivider?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  description,
  children,
  onPress,
  rightComponent,
  showDivider = false,
}) => {
  const { theme } = useTheme();
  const { scaleSpacing, scaleFont } = useResponsive();

  return (
    <>
      <View
        style={[
          styles.row,
          onPress && styles.pressableRow,
          {
            paddingVertical: scaleSpacing(theme.spacing.md),
            borderBottomColor: showDivider ? theme.colors.border2 : 'transparent',
          },
        ]}
        onTouchEnd={onPress}
      >
        <View style={[styles.leftContent, { marginRight: scaleSpacing(theme.spacing.md) }]}>
          <Body style={{ fontSize: scaleFont(16, 0.3), fontWeight: '500' }}>{label}</Body>
          {description && (
            <Body
              style={{
                fontSize: scaleFont(13, 0.3),
                marginTop: scaleSpacing(theme.spacing.xs),
                color: theme.colors.text2,
              }}
            >
              {description}
            </Body>
          )}
        </View>
        <View style={styles.rightContent}>{rightComponent || children}</View>
      </View>
      {showDivider && (
        <View
          style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: theme.colors.border2,
            marginVertical: scaleSpacing(theme.spacing.xs),
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0,
  },
  pressableRow: {
    // Pressable styling handled inline
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
});

export default SettingsRow;
