/**
 * Input Component
 *
 * Reusable text input component with theme integration and consistent styling.
 * Uses the shared app theme.
 */

import { useTheme } from '@/src/providers/ThemeProvider';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { font, fontWeight, layout } from '@/src/config/theme';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: object;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  style,
  ...textInputProps
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Ensure error is a non-empty string
  const hasError = Boolean(error && typeof error === 'string' && error.trim().length > 0);
  const hasLabel = Boolean(label && typeof label === 'string' && label.trim().length > 0);

  // Focus animation: subtle border color shift and glow
  const borderColorAnim = useSharedValue(theme.colors.border2);
  const borderWidthAnim = useSharedValue(1);

  React.useEffect(() => {
    if (isFocused && !hasError) {
      borderColorAnim.value = withTiming(theme.colors.primary, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      borderWidthAnim.value = withTiming(2, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
    } else if (hasError) {
      borderColorAnim.value = withTiming(theme.colors.error, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      borderWidthAnim.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      borderColorAnim.value = withTiming(theme.colors.border2, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
      borderWidthAnim.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [
    isFocused,
    hasError,
    theme.colors.primary,
    theme.colors.error,
    theme.colors.border2,
    borderColorAnim,
    borderWidthAnim,
  ]);

  const animatedInputStyle = useAnimatedStyle(
    () => ({
      borderColor: borderColorAnim.value,
      borderWidth: borderWidthAnim.value,
    }),
    [],
  );

  return (
    <View style={[styles.container, { marginBottom: theme.spacing.lg }, containerStyle]}>
      {hasLabel && (
        <Text style={[styles.label, { color: theme.colors.text, marginBottom: theme.spacing.sm }]}>
          {label}
        </Text>
      )}
      <AnimatedTextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input,
            color: theme.colors.text,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.md,
            borderRadius: theme.radius.md, // Use theme token
          },
          animatedInputStyle,
          style,
        ]}
        placeholderTextColor={theme.colors.placeholder}
        accessibilityRole="none"
        accessibilityLabel={label || textInputProps.placeholder || 'Text input'}
        onFocus={(e) => {
          setIsFocused(true);
          textInputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          textInputProps.onBlur?.(e);
        }}
        {...textInputProps}
      />
      {hasError && (
        <Text
          style={[styles.errorText, { color: theme.colors.error, marginTop: theme.spacing.xs }]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

// Styles that need theme values are applied inline
const styles = StyleSheet.create({
  container: {
    // marginBottom handled inline via theme.spacing
  },
  label: {
    fontSize: font.label,
    fontWeight: fontWeight.semibold,
    // marginBottom handled inline via theme.spacing
  },
  input: {
    borderWidth: 1,
    fontSize: font.body,
    minHeight: layout.touchTargetComfortable,
    // borderRadius and padding applied inline
  },
  errorText: {
    fontSize: font.caption,
    fontWeight: fontWeight.medium,
    // marginTop applied inline
  },
});

export default Input;
