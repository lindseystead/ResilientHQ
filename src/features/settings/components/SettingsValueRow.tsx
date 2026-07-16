import React from 'react';

import { font } from '@/src/config/theme';
import { Body } from '@/src/shared/ui';
import { useTheme } from '@/src/shared/hooks';
import { useResponsive } from '@/src/shared/utils/responsive';
import SettingsRow from './SettingsRow';

interface SettingsValueRowProps {
  label: string;
  value: string;
  description?: string;
  onPress: () => void;
  showDivider?: boolean;
  emphasize?: boolean;
}

const SettingsValueRow = ({
  label,
  value,
  description,
  onPress,
  showDivider = false,
  emphasize = false,
}: SettingsValueRowProps) => {
  const { theme } = useTheme();
  const { scaleFont } = useResponsive();

  return (
    <SettingsRow
      label={label}
      description={description}
      onPress={onPress}
      showDivider={showDivider}
      rightComponent={
        <Body
          style={{
            flex: 1,
            textAlign: 'right',
            fontSize: scaleFont(font.label, 0.3),
            color: emphasize ? theme.colors.secondary : theme.colors.text2,
            textTransform: 'capitalize',
            fontWeight: emphasize ? '600' : '400',
          }}
        >
          {value}
        </Body>
      }
    />
  );
};

export default SettingsValueRow;
