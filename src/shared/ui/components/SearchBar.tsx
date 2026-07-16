/**
 * Search Bar Component
 *
 * Reusable search input component with consistent styling.
 * Uses theme tokens and responsive scaling.
 */

import { font } from '@/src/config/theme';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive } from '@/src/shared/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.input,
          borderRadius: theme.radius.lg,
          paddingHorizontal: scaleSpacing(theme.spacing.md),
          paddingVertical: scaleSpacing(theme.spacing.sm),
        },
      ]}
    >
      <Ionicons
        name="search-outline"
        size={scaleFont(font.body, 0.3)}
        color={theme.colors.text2}
        style={{ marginRight: scaleSpacing(theme.spacing.sm) }}
      />
      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.text,
            fontSize: scaleFont(font.body, 0.3),
            flex: 1,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear}>
          <Ionicons
            name="close-circle"
            size={scaleFont(font.body, 0.3)}
            color={theme.colors.text2}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
  },
});

export default SearchBar;
