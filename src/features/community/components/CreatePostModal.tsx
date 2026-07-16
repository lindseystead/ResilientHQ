/**
 * Create Post Modal Component
 *
 * Post composer with mood tagging, category pills, and AI assist.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet, Button, MoodSelector } from '@/src/shared/ui';
import CategorySelector from './CategorySelector';
import { requestChatCompletion } from '@/src/domains/ai';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { useResponsive, SPACING, DIMENSIONS } from '@/src/shared/utils/responsive';
import { FEATURES, INPUT_LIMITS } from '@/src/config/constants';

const CATEGORIES = ['Mental Health', 'Self Care', 'Motivation', 'General', 'Support'];

export interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (category: string, content: string, mood?: number) => Promise<void>;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ visible, onClose, onSubmit }) => {
  const { theme } = useTheme();
  const { impact, notification } = useHaptics();
  const { scaleFont, scaleSpacing } = useResponsive();
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIAssisting, setIsAIAssisting] = useState(false);

  const handleAIAssist = useCallback(async () => {
    if (!FEATURES.aiCommunityAssistEnabled) {
      Alert.alert('AI Disabled', 'AI post assist is disabled in this build.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('No Content', 'Please write something first before using AI assist.');
      return;
    }

    setIsAIAssisting(true);
    impact('light');

    try {
      const prompt = `Rewrite this post in a more polite, supportive, and encouraging tone. Keep the same meaning but make it more positive:\n\n${content}`;
      const response = await requestChatCompletion([
        {
          role: 'system',
          content:
            'You are a helpful writing assistant that makes posts more supportive and encouraging.',
        },
        { role: 'user', content: prompt },
      ]);

      if (response.content && !response.error) {
        setContent(response.content);
        notification('success');
      } else {
        Alert.alert('Error', 'Failed to rewrite post. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Failed to rewrite post. Please try again.');
    } finally {
      setIsAIAssisting(false);
    }
  }, [content, impact, notification]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please write something before posting.');
      return;
    }

    setIsSubmitting(true);
    impact('medium');

    try {
      await onSubmit(selectedCategory, content.trim(), selectedMood ?? undefined);
      setContent('');
      setSelectedMood(null);
      onClose();
      notification('success');
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to create post. Please try again.';
      Alert.alert('Unable to Post', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Create Post" snapPoints={['90%']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding: scaleSpacing(SPACING.xl) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mood Selector */}
        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              {
                color: theme.colors.text,
                fontSize: scaleFont(16),
                marginBottom: scaleSpacing(SPACING.md),
              },
            ]}
          >
            How are you feeling? (Optional)
          </Text>
          <MoodSelector selectedMood={selectedMood} onMoodSelect={setSelectedMood} />
        </View>

        {/* Category Selector */}
        <View style={styles.section}>
          <Text
            style={[
              styles.label,
              {
                color: theme.colors.text,
                fontSize: scaleFont(16),
                marginBottom: scaleSpacing(SPACING.md),
              },
            ]}
          >
            Category
          </Text>
          <CategorySelector
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </View>

        {/* Content Input */}
        <View style={styles.section}>
          <View style={styles.inputHeader}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.text,
                  fontSize: scaleFont(16),
                },
              ]}
            >
              Your Post
            </Text>
            {FEATURES.aiCommunityAssistEnabled && content.trim().length > 0 && (
              <TouchableOpacity
                onPress={handleAIAssist}
                disabled={isAIAssisting}
                style={[
                  styles.aiButton,
                  {
                    backgroundColor: theme.colors.primary + '15',
                    paddingHorizontal: scaleSpacing(SPACING.sm),
                    paddingVertical: scaleSpacing(SPACING.xs),
                    borderRadius: DIMENSIONS.cardBorderRadius,
                  },
                ]}
              >
                <Ionicons name="sparkles" size={scaleFont(14)} color={theme.colors.primary} />
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
                  AI Assist
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.input,
                color: theme.colors.text,
                borderColor: theme.colors.border2,
                padding: scaleSpacing(SPACING.md),
                borderRadius: DIMENSIONS.cardBorderRadius,
                fontSize: scaleFont(15),
                minHeight: scaleSpacing(150),
              },
            ]}
            placeholder="Share your thoughts..."
            placeholderTextColor={theme.colors.placeholder}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            maxLength={INPUT_LIMITS.maxPostLength}
          />
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
            {content.length}/{INPUT_LIMITS.maxPostLength}
          </Text>
        </View>

        {/* Submit Button */}
        <Button
          title={isSubmitting ? 'Posting...' : 'Post'}
          onPress={handleSubmit}
          variant="primary"
          fullWidth
          loading={isSubmitting}
          disabled={!content.trim() || isSubmitting || isAIAssisting}
          style={styles.submitButton}
        />
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // Padding applied inline
  },
  section: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontWeight: '700',
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // Padding, border radius, and background applied inline
  },
  aiButtonText: {
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    // Padding, border radius, background, color, font size, and min height applied inline
  },
  charCount: {
    // Font size, color, and margin applied inline
  },
  submitButton: {
    marginTop: SPACING.lg,
  },
});

export default CreatePostModal;
