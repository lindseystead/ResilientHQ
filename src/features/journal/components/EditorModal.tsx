/**
 * Editor Modal Component
 *
 * Journaling editor with autosave, draft restore, markdown rendering,
 * AI assist features, and mood-adaptive styling.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive, SPACING } from '@/src/shared/utils/responsive';
import { getButtonAccessibility } from '@/src/shared/utils/accessibility';
import { BottomSheet, Button } from '@/src/shared/ui';
import { FEATURES, MOOD, INPUT_LIMITS } from '@/src/config/constants';
import { useJournalAiAssist } from '../hooks';
import { renderMarkdown } from '../utils/editorMarkdown';

const DRAFT_KEY = '@journal_draft';
const AUTOSAVE_INTERVAL = 4000; // 4 seconds

export interface EditorModalProps {
  visible: boolean;
  onClose: () => void;
  selectedMood: number | null;
  selectedPrompt: string;
  entryText: string;
  onEntryTextChange: (text: string) => void;
  onSave: () => Promise<void>;
  allowPersistentSave?: boolean;
  onTogglePersistentSave?: (nextValue: boolean) => void;
  saveActionLabel?: string;
  isSaving?: boolean;
  isEditing?: boolean;
}

const EditorModal: React.FC<EditorModalProps> = ({
  visible,
  onClose,
  selectedMood,
  selectedPrompt,
  entryText,
  onEntryTextChange,
  onSave,
  allowPersistentSave = true,
  onTogglePersistentSave,
  saveActionLabel = 'Save Entry',
  isSaving = false,
  isEditing = false,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();
  const [showPreview, setShowPreview] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { isAIAssisting, rewriteSofter, getInsight, shortenEntry } = useJournalAiAssist({
    entryText,
    onEntryTextChange,
  });
  const showAiAssist = FEATURES.aiJournalAnalysisEnabled && entryText.trim().length > 0;

  const moodColor = selectedMood !== null ? MOOD.colors[selectedMood] : theme.colors.primary;

  // Autosave draft
  useEffect(() => {
    if (visible && allowPersistentSave && entryText.trim().length > 0) {
      autosaveTimerRef.current = setInterval(async () => {
        try {
          await AsyncStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({
              mood: selectedMood,
              prompt: selectedPrompt,
              text: entryText,
              timestamp: Date.now(),
            }),
          );
        } catch {
          // Silently fail
        }
      }, AUTOSAVE_INTERVAL);
    }

    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [allowPersistentSave, visible, entryText, selectedMood, selectedPrompt]);

  // Restore draft on open
  useEffect(() => {
    if (visible && !isEditing && allowPersistentSave) {
      const restoreDraft = async () => {
        try {
          const draft = await AsyncStorage.getItem(DRAFT_KEY);
          if (draft) {
            const parsed = JSON.parse(draft);
            // Only restore if draft is less than 24 hours old
            if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
              onEntryTextChange(parsed.text);
            }
          }
        } catch {
          // Silently fail
        }
      };
      restoreDraft();
    }
  }, [allowPersistentSave, visible, isEditing, onEntryTextChange]);

  useEffect(() => {
    if (!allowPersistentSave) {
      void AsyncStorage.removeItem(DRAFT_KEY).catch(() => undefined);
    }
  }, [allowPersistentSave]);

  // Clear draft on save
  const handleSave = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
      await onSave();
    } catch {
      await onSave();
    }
  }, [onSave]);

  const headerGradient =
    selectedMood !== null
      ? [moodColor, moodColor + 'DD']
      : [theme.colors.primary, theme.colors.secondary];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Edit Entry' : 'New Journal Entry'}
      snapPoints={['90%']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scaleSpacing(SPACING.xl) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mood-Adaptive Header */}
        <LinearGradient
          colors={headerGradient as [string, string, ...string[]]}
          style={[
            styles.headerGradient,
            {
              padding: scaleSpacing(SPACING.lg),
              borderRadius: theme.radius.lg, // Use theme token
              marginBottom: scaleSpacing(SPACING.lg),
            },
          ]}
        >
          {selectedMood !== null && (
            <View style={styles.moodHeader}>
              <Text style={[styles.moodEmoji, { fontSize: scaleFont(32) }]}>
                {MOOD.emojis[selectedMood]}
              </Text>
              <Text
                style={[
                  styles.moodLabel,
                  {
                    color: theme.colors.white,
                    fontSize: scaleFont(16),
                    marginLeft: scaleSpacing(SPACING.sm),
                  },
                ]}
              >
                {MOOD.labels[selectedMood]}
              </Text>
            </View>
          )}
          <Text
            style={[
              styles.promptText,
              {
                color: theme.colors.white,
                fontSize: scaleFont(15),
                marginTop: scaleSpacing(SPACING.sm),
                opacity: 0.95,
              },
            ]}
          >
            {selectedPrompt || 'Select a prompt to begin'}
          </Text>
        </LinearGradient>

        {/* Entry Text Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Text
              style={[
                styles.inputLabel,
                {
                  color: theme.colors.text,
                  fontSize: scaleFont(16),
                },
              ]}
            >
              Your Entry
            </Text>
            <TouchableOpacity
              onPress={() => setShowPreview(!showPreview)}
              style={[
                styles.previewButton,
                {
                  backgroundColor: theme.colors.input,
                  paddingHorizontal: scaleSpacing(SPACING.sm),
                  paddingVertical: scaleSpacing(SPACING.xs),
                  borderRadius: theme.radius.lg, // Use theme token
                },
              ]}
            >
              <Text
                style={[
                  styles.previewButtonText,
                  {
                    color: theme.colors.primary,
                    fontSize: scaleFont(12),
                  },
                ]}
              >
                {showPreview ? 'Edit' : 'Preview'}
              </Text>
            </TouchableOpacity>
          </View>

          {showPreview ? (
            <View
              style={[
                styles.previewContainer,
                {
                  backgroundColor: theme.colors.input,
                  padding: scaleSpacing(SPACING.md),
                  borderRadius: theme.radius.lg, // Use theme token
                  minHeight: scaleSpacing(200),
                },
              ]}
            >
              <Text
                style={[
                  styles.previewText,
                  {
                    color: theme.colors.text,
                    fontSize: scaleFont(15),
                    lineHeight: scaleFont(22),
                  },
                ]}
              >
                {renderMarkdown(entryText)}
              </Text>
            </View>
          ) : (
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.input,
                  color: theme.colors.text,
                  borderColor: theme.colors.border2,
                  padding: scaleSpacing(SPACING.md),
                  borderRadius: theme.radius.lg, // Use theme token
                  fontSize: scaleFont(15),
                  minHeight: scaleSpacing(200),
                },
              ]}
              placeholder="Write your thoughts here..."
              placeholderTextColor={theme.colors.placeholder}
              value={entryText}
              onChangeText={onEntryTextChange}
              multiline
              textAlignVertical="top"
              maxLength={INPUT_LIMITS.maxJournalEntryLength}
            />
          )}

          <Text
            style={[
              styles.charCount,
              {
                color: theme.colors.text2,
                fontSize: scaleFont(11),
                marginTop: scaleSpacing(SPACING.xs),
                textAlign: 'right',
              },
            ]}
          >
            {entryText.length}/{INPUT_LIMITS.maxJournalEntryLength}
          </Text>
        </View>

        {!isEditing && onTogglePersistentSave ? (
          <View style={styles.privacySection}>
            <Text
              style={[
                styles.privacyLabel,
                {
                  color: theme.colors.text2,
                  fontSize: scaleFont(12),
                  marginBottom: scaleSpacing(SPACING.sm),
                },
              ]}
            >
              Privacy
            </Text>
            <TouchableOpacity
              onPress={() => onTogglePersistentSave(!allowPersistentSave)}
              style={[
                styles.privacyToggle,
                {
                  backgroundColor: theme.colors.input,
                  borderColor: theme.colors.border2,
                  borderRadius: theme.radius.lg,
                  padding: scaleSpacing(SPACING.md),
                },
              ]}
              {...getButtonAccessibility(
                allowPersistentSave ? 'Save to journal history' : 'Do not save this reflection',
                allowPersistentSave
                  ? 'Keep this entry in your journal history'
                  : 'Keep this reflection only in the current session',
              )}
            >
              <View style={styles.privacyCopy}>
                <View style={styles.privacyTitleRow}>
                  <Ionicons
                    name={allowPersistentSave ? 'save-outline' : 'shield-checkmark-outline'}
                    size={scaleFont(16)}
                    color={allowPersistentSave ? theme.colors.primary : theme.colors.success}
                  />
                  <Text
                    style={[
                      styles.privacyTitle,
                      {
                        color: theme.colors.text,
                        fontSize: scaleFont(13),
                        marginLeft: scaleSpacing(SPACING.xs),
                      },
                    ]}
                  >
                    {allowPersistentSave ? 'Save to journal history' : 'Do not save this'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.privacyBody,
                    {
                      color: theme.colors.text2,
                      fontSize: scaleFont(12),
                      marginTop: scaleSpacing(SPACING.xs),
                    },
                  ]}
                >
                  {allowPersistentSave
                    ? 'This entry can be restored from drafts and will appear in your journal history.'
                    : 'This reflection stays in this session only. Draft restore is off and nothing will be stored when you finish.'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* AI Assist Buttons */}
        {showAiAssist && (
          <View style={styles.aiSection}>
            <Text
              style={[
                styles.aiLabel,
                {
                  color: theme.colors.text2,
                  fontSize: scaleFont(12),
                  marginBottom: scaleSpacing(SPACING.sm),
                },
              ]}
            >
              AI Assist
            </Text>
            <View style={styles.aiButtons}>
              <TouchableOpacity
                onPress={rewriteSofter}
                disabled={isAIAssisting}
                style={[
                  styles.aiButton,
                  {
                    backgroundColor: theme.colors.primary + '15',
                    padding: scaleSpacing(SPACING.sm),
                    borderRadius: theme.radius.lg, // Use theme token
                    marginRight: scaleSpacing(SPACING.sm),
                  },
                ]}
                {...getButtonAccessibility('Rewrite softer', 'Make entry more compassionate')}
              >
                <Ionicons name="heart-outline" size={scaleFont(16)} color={theme.colors.primary} />
                <Text
                  style={[
                    styles.aiButtonText,
                    {
                      color: theme.colors.primary,
                      fontSize: scaleFont(12),
                      marginLeft: scaleSpacing(SPACING.xs),
                    },
                  ]}
                >
                  Softer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={getInsight}
                disabled={isAIAssisting}
                style={[
                  styles.aiButton,
                  {
                    backgroundColor: theme.colors.accent + '15',
                    padding: scaleSpacing(SPACING.sm),
                    borderRadius: theme.radius.lg, // Use theme token
                    marginRight: scaleSpacing(SPACING.sm),
                  },
                ]}
                {...getButtonAccessibility('Get insight', 'Get AI insight about entry')}
              >
                <Ionicons name="bulb-outline" size={scaleFont(16)} color={theme.colors.accent} />
                <Text
                  style={[
                    styles.aiButtonText,
                    {
                      color: theme.colors.accent,
                      fontSize: scaleFont(12),
                      marginLeft: scaleSpacing(SPACING.xs),
                    },
                  ]}
                >
                  Insight
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={shortenEntry}
                disabled={isAIAssisting}
                style={[
                  styles.aiButton,
                  {
                    backgroundColor: theme.colors.secondary + '15',
                    padding: scaleSpacing(SPACING.sm),
                    borderRadius: theme.radius.lg, // Use theme token
                  },
                ]}
                {...getButtonAccessibility('Shorten', 'Make entry more concise')}
              >
                <Ionicons
                  name="contract-outline"
                  size={scaleFont(16)}
                  color={theme.colors.secondary}
                />
                <Text
                  style={[
                    styles.aiButtonText,
                    {
                      color: theme.colors.secondary,
                      fontSize: scaleFont(12),
                      marginLeft: scaleSpacing(SPACING.xs),
                    },
                  ]}
                >
                  Shorten
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Save Button */}
        {selectedMood !== null && selectedPrompt && entryText.trim() && (
          <Button
            title={isSaving ? 'Saving...' : saveActionLabel}
            onPress={handleSave}
            variant="primary"
            fullWidth
            loading={isSaving}
            disabled={isSaving || isAIAssisting}
            style={[
              {
                marginTop: scaleSpacing(SPACING.lg),
                backgroundColor: moodColor,
              },
            ]}
          />
        )}
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  headerGradient: {
    // Padding, border radius, and margin applied inline
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    // Font size applied inline
  },
  moodLabel: {
    fontWeight: '700',
  },
  promptText: {
    fontWeight: '500',
    lineHeight: 22,
  },
  inputSection: {
    // Styles applied inline
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  inputLabel: {
    fontWeight: '700',
  },
  previewButton: {
    // Padding, border radius, and background applied inline
  },
  previewButtonText: {
    fontWeight: '600',
  },
  previewContainer: {
    // Padding, border radius, background, and min height applied inline
  },
  previewText: {
    // Font size, color, and line height applied inline
  },
  textInput: {
    borderWidth: 1,
    // Padding, border radius, background, color, font size, and min height applied inline
  },
  charCount: {
    // Font size, color, and margin applied inline
  },
  aiSection: {
    marginTop: SPACING.lg,
  },
  privacySection: {
    marginTop: SPACING.lg,
  },
  privacyLabel: {
    fontWeight: '500',
  },
  privacyToggle: {
    borderWidth: 1,
  },
  privacyCopy: {
    flex: 1,
  },
  privacyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyTitle: {
    fontWeight: '700',
  },
  privacyBody: {
    lineHeight: 18,
  },
  aiLabel: {
    fontWeight: '500',
  },
  aiButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // Padding, border radius, background, and margin applied inline
  },
  aiButtonText: {
    fontWeight: '600',
  },
});

export default EditorModal;
