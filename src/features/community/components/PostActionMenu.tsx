/**
 * Post Action Menu Component
 *
 * Bottom sheet menu for post/comment actions (edit, delete, report).
 * Shows different options based on ownership.
 */

import { useTheme } from '@/src/providers/ThemeProvider';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useResponsive, SPACING } from '@/src/shared/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, forwardRef, useImperativeHandle } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

export interface PostActionMenuRef {
  open: () => void;
  close: () => void;
}

export interface PostActionMenuProps {
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  type?: 'post' | 'comment';
}

const PostActionMenuComponent = forwardRef<PostActionMenuRef, PostActionMenuProps>(
  ({ isOwner, onEdit, onDelete, onReport, type = 'post' }, ref) => {
    const { theme } = useTheme();
    const { impact } = useHaptics();
    const { scaleFont, scaleSpacing } = useResponsive();

    const [visible, setVisible] = React.useState(false);
    const translateY = useSharedValue(300);
    const opacity = useSharedValue(0);

    const open = useCallback(() => {
      setVisible(true);
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
    }, [opacity, translateY]);

    const close = useCallback(() => {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(300, { duration: 200 }, () => {
        runOnJS(setVisible)(false);
      });
    }, [opacity, translateY]);

    useImperativeHandle(ref, () => ({ open, close }), [open, close]);

    const handleAction = useCallback(
      (action: () => void) => {
        impact('light');
        close();
        setTimeout(() => action(), 200);
      },
      [close, impact],
    );

    const backdropStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    const sheetStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const typeLabel = type === 'post' ? 'Post' : 'Comment';

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={styles.container}>
          <Animated.View
            style={[styles.backdrop, backdropStyle, { backgroundColor: theme.colors.overlay }]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              sheetStyle,
              {
                backgroundColor: theme.colors.surface,
                paddingBottom: scaleSpacing(SPACING.xl) + 20,
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: theme.colors.border2 }]} />

            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.text,
                  fontSize: scaleFont(16),
                  marginBottom: scaleSpacing(SPACING.md),
                },
              ]}
            >
              {typeLabel} Options
            </Text>

            {isOwner && (
              <>
                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor: theme.colors.input,
                      marginBottom: scaleSpacing(SPACING.sm),
                      padding: scaleSpacing(SPACING.md),
                    },
                  ]}
                  onPress={() => onEdit && handleAction(onEdit)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={scaleFont(22)}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: theme.colors.text,
                        fontSize: scaleFont(16),
                        marginLeft: scaleSpacing(SPACING.md),
                      },
                    ]}
                  >
                    Edit {typeLabel}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.option,
                    {
                      backgroundColor: theme.colors.input,
                      marginBottom: scaleSpacing(SPACING.sm),
                      padding: scaleSpacing(SPACING.md),
                    },
                  ]}
                  onPress={() => onDelete && handleAction(onDelete)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={scaleFont(22)} color={theme.colors.error} />
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: theme.colors.error,
                        fontSize: scaleFont(16),
                        marginLeft: scaleSpacing(SPACING.md),
                      },
                    ]}
                  >
                    Delete {typeLabel}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {!isOwner && (
              <TouchableOpacity
                style={[
                  styles.option,
                  {
                    backgroundColor: theme.colors.input,
                    marginBottom: scaleSpacing(SPACING.sm),
                    padding: scaleSpacing(SPACING.md),
                  },
                ]}
                onPress={() => onReport && handleAction(onReport)}
                activeOpacity={0.7}
              >
                <Ionicons name="flag-outline" size={scaleFont(22)} color={theme.colors.warning} />
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: theme.colors.text,
                      fontSize: scaleFont(16),
                      marginLeft: scaleSpacing(SPACING.md),
                    },
                  ]}
                >
                  Report {typeLabel}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: theme.colors.background,
                  marginTop: scaleSpacing(SPACING.sm),
                  padding: scaleSpacing(SPACING.md),
                  borderWidth: 1,
                  borderColor: theme.colors.border2,
                },
              ]}
              onPress={close}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.cancelText,
                  {
                    color: theme.colors.text,
                    fontSize: scaleFont(16),
                  },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
  },
);

PostActionMenuComponent.displayName = 'PostActionMenu';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: SPACING.xs / 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SPACING.md,
  },
  optionText: {
    fontWeight: '500',
  },
  cancelButton: {
    borderRadius: SPACING.md,
    alignItems: 'center',
  },
  cancelText: {
    fontWeight: '600',
  },
});

export default PostActionMenuComponent;
