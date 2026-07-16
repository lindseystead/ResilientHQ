/**
 * Chat Composer
 *
 * Input area for composing and sending chat messages.
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { font } from '@/src/config/theme';
import { useFadeAnimation } from '@/src/shared/hooks/animation/useFadeAnimation';
import { useTheme } from '@/src/shared/hooks';
import { getButtonAccessibility } from '@/src/shared/utils/accessibility';
import { SPACING, useResponsive } from '@/src/shared/utils/responsive';

interface ChatComposerProps {
  inputText: string;
  maxLength: number;
  isLoading: boolean;
  isLoadingHistory: boolean;
  bottomPadding: number;
  showClearDraft?: boolean;
  onChangeText: (text: string) => void;
  onClearDraft?: () => void;
  onSend: () => void;
}

const ChatComposer: React.FC<ChatComposerProps> = ({
  inputText,
  maxLength,
  isLoading,
  isLoadingHistory,
  bottomPadding,
  showClearDraft = false,
  onChangeText,
  onClearDraft,
  onSend,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing, insets } = useResponsive();
  const inputAnimation = useFadeAnimation({
    initialOpacity: 0,
    targetOpacity: 1,
    duration: 400,
    delay: 200,
    autoStart: true,
  });

  return (
    <Animated.View
      style={[
        inputAnimation.animatedStyle,
        styles.inputContainer,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border2,
          paddingBottom: Math.max(insets.bottom, bottomPadding),
        },
      ]}
    >
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.colors.border2,
              backgroundColor: theme.colors.input,
              color: theme.colors.text,
              fontSize: scaleFont(font.bodySmall, 0.3),
              paddingHorizontal: scaleSpacing(theme.spacing.md),
              paddingVertical: scaleSpacing(theme.spacing.sm),
              borderRadius: theme.radius.md,
            },
          ]}
          placeholder="Type your message..."
          placeholderTextColor={theme.colors.placeholder}
          value={inputText}
          onChangeText={onChangeText}
          multiline
          maxLength={maxLength}
          editable={!isLoading && !isLoadingHistory}
          onSubmitEditing={onSend}
        />
        {showClearDraft && onClearDraft ? (
          <TouchableOpacity
            onPress={onClearDraft}
            style={[
              styles.clearButton,
              {
                backgroundColor: theme.colors.input,
                borderColor: theme.colors.border2,
              },
            ]}
            {...getButtonAccessibility('Clear this topic', 'Clear your current unsent draft')}
          >
            <Ionicons
              name="close-outline"
              size={scaleFont(font.body, 0.3)}
              color={theme.colors.text2}
            />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          onPress={onSend}
          style={[
            styles.sendButton,
            {
              backgroundColor:
                inputText.trim() && !isLoading && !isLoadingHistory
                  ? theme.colors.primary
                  : theme.colors.disabled,
            },
          ]}
          disabled={!inputText.trim() || isLoading || isLoadingHistory}
          {...getButtonAccessibility('Send message', 'Send your message')}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.white} size="small" />
          ) : (
            <Ionicons name="send" size={scaleFont(font.body, 0.3)} color={theme.colors.white} />
          )}
        </TouchableOpacity>
      </View>
      {inputText.length > 0 && (
        <Text
          style={[
            styles.charCount,
            { color: theme.colors.text2, fontSize: scaleFont(font.captionSmall, 0.3) },
          ]}
        >
          {inputText.length}/{maxLength}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    borderTopWidth: 1,
    padding: SPACING.md,
    paddingTop: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    width: 48,
    height: 48,
    borderRadius: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  charCount: {
    textAlign: 'right',
    marginTop: SPACING.sm - SPACING.xs / 2,
  },
});

export default ChatComposer;
