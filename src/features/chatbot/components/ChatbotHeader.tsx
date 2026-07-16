/**
 * Chatbot Header
 *
 * Mood-adaptive header for the chatbot with action controls and prompt chips.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { font, layout } from '@/src/config/theme';
import { useTraumaSafeMode } from '@/src/providers/TraumaSafeModeProvider';
import { useFadeAnimation } from '@/src/shared/hooks/animation/useFadeAnimation';
import { useTheme } from '@/src/shared/hooks';
import { withAlpha } from '@/src/shared/ui/theme/color';
import { getButtonAccessibility } from '@/src/shared/utils/accessibility';
import { DIMENSIONS, SPACING, useResponsive } from '@/src/shared/utils/responsive';
import { AI_DISCLOSURE_NOTICE } from '../constants/chatbot';

interface ChatbotHeaderProps {
  moodGradient: string[];
  suggestedPrompts: string[];
  title: string;
  subtitle: string;
  groundingLabel: string;
  memoryEnabled: boolean;
  promptsPaused: boolean;
  onGenerateSummary: () => void;
  onClearChat: () => void;
  onToggleMemory: () => void;
  onTogglePrompts: () => void;
  onStartGrounding: () => void;
  onPromptPress: (prompt: string) => void;
}

const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({
  moodGradient,
  suggestedPrompts,
  title,
  subtitle,
  groundingLabel,
  memoryEnabled,
  promptsPaused,
  onGenerateSummary,
  onClearChat,
  onToggleMemory,
  onTogglePrompts,
  onStartGrounding,
  onPromptPress,
}) => {
  const { theme } = useTheme();
  const { traumaSafeMode } = useTraumaSafeMode();
  const { scaleFont, scaleSpacing } = useResponsive();
  const headerAnimation = useFadeAnimation({
    initialOpacity: traumaSafeMode ? 1 : 0,
    targetOpacity: 1,
    duration: traumaSafeMode ? 0 : 600,
    autoStart: true,
  });

  return (
    <Animated.View
      style={[headerAnimation.animatedStyle, { paddingTop: scaleSpacing(theme.spacing.lg) }]}
    >
      <LinearGradient
        colors={moodGradient as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          {
            paddingBottom: scaleSpacing(theme.spacing.md),
            paddingHorizontal: scaleSpacing(theme.spacing.xl),
          },
        ]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: withAlpha(theme.colors.white, 0.2) },
              ]}
            >
              <Ionicons name="sparkles" size={scaleFont(font.h3, 0.3)} color={theme.colors.white} />
            </View>
            <View style={styles.headerText}>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.white, fontSize: scaleFont(font.h3, 0.3) },
                ]}
              >
                {title}
              </Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: theme.colors.accent }]} />
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: theme.colors.white, fontSize: scaleFont(font.labelSmall, 0.3) },
                  ]}
                >
                  {subtitle}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={onToggleMemory}
              style={[styles.headerButton, { backgroundColor: withAlpha(theme.colors.white, 0.2) }]}
              {...getButtonAccessibility(
                memoryEnabled ? 'Turn conversation memory off' : 'Turn conversation memory on',
                memoryEnabled
                  ? 'Keep new messages in this session only'
                  : 'Allow new messages to be saved for this session',
              )}
            >
              <Ionicons
                name={memoryEnabled ? 'save-outline' : 'eye-off-outline'}
                size={scaleFont(font.body, 0.3)}
                color={theme.colors.white}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onTogglePrompts}
              style={[styles.headerButton, { backgroundColor: withAlpha(theme.colors.white, 0.2) }]}
              {...getButtonAccessibility(
                promptsPaused ? 'Resume prompts' : 'Pause prompts',
                promptsPaused
                  ? 'Show suggested prompts again'
                  : 'Pause suggested prompts and proactive nudges',
              )}
            >
              <Ionicons
                name={promptsPaused ? 'play-outline' : 'pause-outline'}
                size={scaleFont(font.body, 0.3)}
                color={theme.colors.white}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onGenerateSummary}
              style={[styles.headerButton, { backgroundColor: withAlpha(theme.colors.white, 0.2) }]}
              {...getButtonAccessibility('Generate summary', 'Summarize this conversation')}
            >
              <Ionicons
                name="document-text-outline"
                size={scaleFont(font.body, 0.3)}
                color={theme.colors.white}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClearChat}
              style={[styles.headerButton, { backgroundColor: withAlpha(theme.colors.white, 0.2) }]}
              {...getButtonAccessibility('Clear chat', 'Delete all messages')}
            >
              <Ionicons
                name="trash-outline"
                size={scaleFont(font.body, 0.3)}
                color={theme.colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text
          accessibilityRole="text"
          style={[
            styles.disclosure,
            { color: theme.colors.white, fontSize: scaleFont(font.caption, 0.3) },
          ]}
        >
          {AI_DISCLOSURE_NOTICE}
        </Text>

        <TouchableOpacity
          onPress={onStartGrounding}
          style={[styles.groundingButton, { backgroundColor: withAlpha(theme.colors.white, 0.25) }]}
          {...getButtonAccessibility(groundingLabel, 'Start a calming exercise')}
        >
          <Ionicons
            name="leaf-outline"
            size={scaleFont(font.bodySmall, 0.3)}
            color={theme.colors.white}
          />
          <Text
            style={[
              styles.groundingButtonText,
              { color: theme.colors.white, fontSize: scaleFont(font.label, 0.3) },
            ]}
          >
            {groundingLabel}
          </Text>
        </TouchableOpacity>

        {suggestedPrompts.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.promptsContainer}
            contentContainerStyle={styles.promptsContent}
          >
            {suggestedPrompts.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                onPress={() => onPromptPress(prompt)}
                style={[
                  styles.promptChip,
                  { backgroundColor: withAlpha(theme.colors.white, 0.25) },
                ]}
                {...getButtonAccessibility(prompt, 'Use this prompt')}
              >
                <Text
                  style={[
                    styles.promptText,
                    { color: theme.colors.white, fontSize: scaleFont(font.label, 0.3) },
                  ]}
                >
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: DIMENSIONS.cardBorderRadius,
    borderBottomRightRadius: DIMENSIONS.cardBorderRadius,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: SPACING.xs,
  },
  headerSubtitle: {
    opacity: 0.9,
  },
  disclosure: {
    opacity: 0.85,
    marginBottom: SPACING.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: layout.touchTargetMin / 2,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  groundingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: DIMENSIONS.cardBorderRadius,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  groundingButtonText: {
    fontWeight: '600',
  },
  promptsContainer: {
    marginTop: SPACING.sm,
  },
  promptsContent: {
    gap: SPACING.sm,
    paddingRight: SPACING.xl,
  },
  promptChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: DIMENSIONS.cardBorderRadius,
    marginRight: SPACING.sm,
  },
  promptText: {
    fontWeight: '500',
  },
});

export default ChatbotHeader;
