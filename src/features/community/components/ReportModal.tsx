/**
 * Report Modal Component
 *
 * Modal for reporting posts or comments with predefined reasons.
 */

import { useTheme } from '@/src/providers/ThemeProvider';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useResponsive, SPACING } from '@/src/shared/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
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
const SUCCESS_ICON_SIZE = SPACING.xxl + SPACING.xl + SPACING.xs;

const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment or bullying', icon: 'warning-outline' },
  { id: 'spam', label: 'Spam or misleading', icon: 'mail-outline' },
  { id: 'inappropriate', label: 'Inappropriate content', icon: 'eye-off-outline' },
  { id: 'misinformation', label: 'Misinformation', icon: 'information-circle-outline' },
  { id: 'harmful', label: 'Harmful or dangerous', icon: 'alert-circle-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
] as const;

export interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onReport: (reason: string) => Promise<void>;
  type?: 'post' | 'comment';
}

const ReportModal: React.FC<ReportModalProps> = ({ visible, onClose, onReport, type = 'post' }) => {
  const { theme } = useTheme();
  const { impact, notification } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  const typeLabel = type === 'post' ? 'post' : 'comment';

  React.useEffect(() => {
    if (visible) {
      setSelectedReason(null);
      setOtherReason('');
      setError(null);
      setSubmitted(false);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
    }
  }, [visible, opacity, scale]);

  const handleSelectReason = useCallback(
    (reasonId: string) => {
      impact('light');
      setSelectedReason(reasonId);
      setError(null);
    },
    [impact],
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedReason) {
      setError('Please select a reason for reporting');
      return;
    }

    const reason =
      selectedReason === 'other'
        ? otherReason.trim() || 'Other'
        : REPORT_REASONS.find((r) => r.id === selectedReason)?.label || selectedReason;

    if (selectedReason === 'other' && !otherReason.trim()) {
      setError('Please provide details for your report');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    impact('light');

    try {
      await onReport(reason);
      notification('success');
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit report';
      setError(message);
      notification('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedReason, otherReason, onReport, impact, notification]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View
          style={[styles.backdrop, backdropStyle, { backgroundColor: theme.colors.overlay }]}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        </Animated.View>

        <Animated.View
          style={[
            styles.modal,
            modalStyle,
            {
              backgroundColor: theme.colors.surface,
              maxHeight: '85%',
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border2 }]}>
            <TouchableOpacity
              onPress={onClose}
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
              Report {typeLabel}
            </Text>

            <View style={styles.headerButton} />
          </View>

          {submitted ? (
            /* Success State */
            <View style={[styles.successContainer, { padding: scaleSpacing(SPACING.xl) }]}>
              <View style={[styles.successIcon, { backgroundColor: theme.colors.success + '20' }]}>
                <Ionicons
                  name="checkmark-circle"
                  size={scaleFont(48)}
                  color={theme.colors.success}
                />
              </View>
              <Text
                style={[
                  styles.successTitle,
                  {
                    color: theme.colors.text,
                    fontSize: scaleFont(18),
                    marginTop: scaleSpacing(SPACING.lg),
                  },
                ]}
              >
                Report Submitted
              </Text>
              <Text
                style={[
                  styles.successMessage,
                  {
                    color: theme.colors.text2,
                    fontSize: scaleFont(14),
                    marginTop: scaleSpacing(SPACING.sm),
                  },
                ]}
              >
                Thank you for helping keep our community safe. We&apos;ll review this {typeLabel}{' '}
                shortly.
              </Text>
              <TouchableOpacity
                style={[
                  styles.doneButton,
                  {
                    backgroundColor: theme.colors.primary,
                    marginTop: scaleSpacing(SPACING.xl),
                    paddingVertical: scaleSpacing(SPACING.md),
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.doneButtonText,
                    {
                      color: theme.colors.white,
                      fontSize: scaleFont(16),
                    },
                  ]}
                >
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Report Form */
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={{ padding: scaleSpacing(SPACING.lg) }}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: theme.colors.text2,
                    fontSize: scaleFont(14),
                    marginBottom: scaleSpacing(SPACING.md),
                  },
                ]}
              >
                Why are you reporting this {typeLabel}?
              </Text>

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

              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonOption,
                    {
                      backgroundColor:
                        selectedReason === reason.id
                          ? theme.colors.primary + '15'
                          : theme.colors.input,
                      borderColor:
                        selectedReason === reason.id ? theme.colors.primary : theme.colors.border2,
                      padding: scaleSpacing(SPACING.md),
                      marginBottom: scaleSpacing(SPACING.sm),
                    },
                  ]}
                  onPress={() => handleSelectReason(reason.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={reason.icon as keyof typeof Ionicons.glyphMap}
                    size={scaleFont(22)}
                    color={selectedReason === reason.id ? theme.colors.primary : theme.colors.text2}
                  />
                  <Text
                    style={[
                      styles.reasonText,
                      {
                        color: theme.colors.text,
                        fontSize: scaleFont(15),
                        marginLeft: scaleSpacing(SPACING.md),
                      },
                    ]}
                  >
                    {reason.label}
                  </Text>
                  {selectedReason === reason.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={scaleFont(22)}
                      color={theme.colors.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}

              {selectedReason === 'other' && (
                <TextInput
                  style={[
                    styles.otherInput,
                    {
                      backgroundColor: theme.colors.input,
                      color: theme.colors.text,
                      fontSize: scaleFont(15),
                      padding: scaleSpacing(SPACING.md),
                      marginBottom: scaleSpacing(SPACING.md),
                    },
                  ]}
                  value={otherReason}
                  onChangeText={setOtherReason}
                  placeholder="Please describe the issue..."
                  placeholderTextColor={theme.colors.text2}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: selectedReason ? theme.colors.error : theme.colors.border2,
                    paddingVertical: scaleSpacing(SPACING.md),
                    marginTop: scaleSpacing(SPACING.md),
                  },
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting || !selectedReason}
                activeOpacity={0.7}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text
                    style={[
                      styles.submitButtonText,
                      {
                        color: selectedReason ? theme.colors.white : theme.colors.text2,
                        fontSize: scaleFont(16),
                      },
                    ]}
                  >
                    Submit Report
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </Animated.View>
      </View>
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
  scrollView: {
    // Styles applied inline
  },
  subtitle: {
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SPACING.sm,
  },
  errorText: {
    flex: 1,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SPACING.md,
    borderWidth: 1,
  },
  reasonText: {
    flex: 1,
    fontWeight: '500',
  },
  checkIcon: {
    marginLeft: SPACING.sm,
  },
  otherInput: {
    borderRadius: SPACING.md,
    minHeight: 100,
    lineHeight: 22,
  },
  submitButton: {
    borderRadius: SPACING.md,
    alignItems: 'center',
  },
  submitButtonText: {
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    width: SUCCESS_ICON_SIZE,
    height: SUCCESS_ICON_SIZE,
    borderRadius: SUCCESS_ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontWeight: '600',
  },
  successMessage: {
    textAlign: 'center',
    lineHeight: 20,
  },
  doneButton: {
    borderRadius: SPACING.md,
    width: '100%',
    alignItems: 'center',
  },
  doneButtonText: {
    fontWeight: '600',
  },
});

export default ReportModal;
