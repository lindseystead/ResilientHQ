import React from 'react';
import { Switch } from 'react-native';

import { useTheme } from '@/src/shared/hooks';
import SettingsRow from './SettingsRow';

interface SettingsSwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  showDivider?: boolean;
}

const SettingsSwitchRow = ({
  label,
  description,
  value,
  onValueChange,
  disabled,
  showDivider = false,
}: SettingsSwitchRowProps) => {
  const { theme } = useTheme();

  return (
    <SettingsRow
      label={label}
      description={description}
      showDivider={showDivider}
      rightComponent={
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: theme.colors.border2, true: theme.colors.primary }}
          thumbColor={value ? theme.colors.primary : theme.colors.white}
        />
      }
    />
  );
};

export default SettingsSwitchRow;
