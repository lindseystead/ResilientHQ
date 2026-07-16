import React from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';

import { useTheme } from '@/src/shared/hooks';
import SettingsRow from './SettingsRow';

interface SettingsActionRowProps {
  label: string;
  description?: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  showDivider?: boolean;
}

const SettingsActionRow = ({
  label,
  description,
  onPress,
  isLoading = false,
  disabled = false,
  showDivider = false,
}: SettingsActionRowProps) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || isLoading}>
      <SettingsRow
        label={label}
        description={description}
        showDivider={showDivider}
        rightComponent={
          isLoading ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null
        }
      />
    </TouchableOpacity>
  );
};

export default SettingsActionRow;
