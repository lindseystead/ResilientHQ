/**
 * Edit Post Modal Component
 *
 * Modal for editing existing posts or comments.
 * Reuses styling patterns from CreatePostModal.
 */

import { useTheme } from '@/src/providers/ThemeProvider';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useResponsive, SPACING } from '@/src/shared/utils/responsive';
import { INPUT_LIMITS } from '@/src/config/constants';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const MODAL_INSET = SPACING.lg + SPACING.xs;
const MODAL_RADIUS = SPACING.xl - SPACING.xs;
const HEADER_CONTROL_SIZE = SPACING.xl + SPACING.lg;
const SAVE_BUTTON_MIN_WIDTH = SPACING.xxl + SPACING.xl + SPACING.xs;

export interface EditPostModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
  initialContent: string;
  type?: 'post' | 'comment';
  title?: string;
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  visible,
  onClose,
  onSave,
  initialContent,
  type = 'post',
  title,
}) => {
  const { theme } = useTheme();
  const { impact, notification } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();

  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  const maxLength = type === 'post' ? INPUT_LIMITS.maxPostLength : INPUT_LIMITS.maxCommentLength;
  const typeLabel = type === 'post' ? 'Post' : 'Comment';

  useEffect(() => {
    if (visible) {
      setContent(initialContent);
      setError(null);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
    }
  }, [visible, initialContent, opacity, scale]);

  const handleClose = useCallback(() => {
    if (content.trim() !== initialContent.trim() && content.trim().length > 0) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ],
      );
    } else {
      onClose();
    }
  }, [content, initialContent, onClose]);

  const handleSave = useCallback(async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setError(`${typeLabel} cannot be empty`);
      return;
    }

    if (trimmedContent === initialContent.trim()) {
      onClose();
      return;
    }

    setIsSaving(true);
    setError(null);
    impact('light');

    try {
      await onSave(trimmedContent);
      notification('success');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to update ${type}`;
      setError(message);
      notification('error');
    } finally {
      setIsSaving(false);
    }
  }, [content, initialContent, onSave, onClose, impact, notification, type, typeLabel]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const hasChanges = content.trim() !== initialContent.trim();
  const isValid = content.trim().length > 0 && content.length <= maxLength;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[styles.backdrop, backdropStyle, { backgroundColor: theme.colors.overlay }]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modal,
            modalStyle,
            {
              backgroundColor: theme.colors.surface,
              maxHeight: '80%',
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border2 }]}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={scaleFont(24)} color={theme.colors.text2} />
            </TouchableOpacity>

            <Text
              style={[
                styles.headerTitle,
                {
                  color: theme.colors.text,
                  fontSize: scaleFont(17),
                },
              ]}
            >
              {title || `Edit ${typeLabel}`}
            </Text>

            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.saveButton,
                {
                  backgroundColor:
                    hasChanges && isValid ? theme.colors.primary : theme.colors.border2,
                  paddingHorizontal: scaleSpacing(SPACING.md),
                  paddingVertical: scaleSpacing(SPACING.xs),
                },
              ]}
              disabled={isSaving || !hasChanges || !isValid}
              activeOpacity={0.7}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text
                  style={[
                    styles.saveButtonText,
                    {
                      color: hasChanges && isValid ? theme.colors.white : theme.colors.text2,
                      fontSize: scaleFont(14),
                    },
                  ]}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={[styles.content, { padding: scaleSpacing(SPACING.lg) }]}>
            {error && (
              <View
                style={[
                  styles.errorContainer,
                  {
                    backgroundColor: theme.colors.error + '15',
                    padding: scaleSpacing(SPACING.sm),
                    marginBottom: scaleSpacing(SPACING.md),
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={scaleFont(18)} color={theme.colors.error} />
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: theme.colors.error,
                      fontSize: scaleFont(14),
                      marginLeft: scaleSpacing(SPACING.xs),
                    },
                  ]}
                >
                  {error}
                </Text>
              </View>
            )}

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.input,
                  color: theme.colors.text,
                  fontSize: scaleFont(16),
                  padding: scaleSpacing(SPACING.md),
                  minHeight: type === 'post' ? 150 : 100,
                },
              ]}
              value={content}
              onChangeText={setContent}
              placeholder={`Edit your ${type}...`}
              placeholderTextColor={theme.colors.text2}
              multiline
              textAlignVertical="top"
              maxLength={maxLength}
              autoFocus
            />

            <View style={[styles.footer, { marginTop: scaleSpacing(SPACING.sm) }]}>
              <Text
                style={[
                  styles.charCount,
                  {
                    color:
                      content.length > maxLength * 0.9 ? theme.colors.warning : theme.colors.text2,
                    fontSize: scaleFont(12),
                  },
                ]}
              >
                {content.length}/{maxLength}
              </Text>

              {hasChanges && (
                <Text
                  style={[
                    styles.editedLabel,
                    {
                      color: theme.colors.primary,
                      fontSize: scaleFont(12),
                    },
                  ]}
                >
                  Modified
                </Text>
              )}
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: MODAL_INSET,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    width: '100%',
    borderRadius: MODAL_RADIUS,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: HEADER_CONTROL_SIZE,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    borderRadius: SPACING.lg,
    minWidth: SAVE_BUTTON_MIN_WIDTH,
    alignItems: 'center',
  },
  saveButtonText: {
    fontWeight: '600',
  },
  content: {
    // Padding applied inline
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SPACING.sm,
  },
  errorText: {
    flex: 1,
  },
  input: {
    borderRadius: SPACING.md,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontWeight: '500',
  },
  editedLabel: {
    fontWeight: '500',
  },
});

export default EditPostModal;
