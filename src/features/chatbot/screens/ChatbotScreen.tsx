/**
 * Chatbot Screen
 *
 * AI-assisted mental health chat with:
 * - Mood-adaptive UI
 * - Streaming responses
 * - Suggested prompts
 * - Auto journal creation
 * - Chat summarization
 * - Breathing/grounding mode
 * - Enhanced animations and interactions
 *
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

import { font, spacing } from '@/src/config/theme';
import { getDeviceSafetyContext, resolveCrisisSupportRouting } from '@/src/domains/ai';
import { useAISettings } from '@/src/providers/AISettingsProvider';
import { useTraumaSafeMode } from '@/src/providers/TraumaSafeModeProvider';
import { useAuth, useErrorHandler, useTheme } from '@/src/shared/hooks';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { announceScreenChange } from '@/src/shared/utils/accessibility';
import { useResponsive } from '@/src/shared/utils/responsive';

import {
  AnimatedMessageBubble,
  BreathingExercise,
  ChatComposer,
  ChatbotHeader,
  CrisisSupportSheet,
  GuardrailNoticeCard,
  GroundingExercise,
  JournalPromptOverlay,
} from '../components';
import { BottomSheet, EmptyState, ErrorBanner, ProtectedScreen } from '@/src/shared/ui';
import { TEXT } from '@/src/config/text';
import { useChatPipeline } from '../hooks/useChatPipeline';
import { useChatSessionPreferences } from '../hooks/useChatSessionPreferences';
import { useChatSupport } from '../hooks/useChatSupport';
import { MAX_INPUT_LENGTH } from '../constants/chatbot';
import { TAB_BAR_HEIGHT } from '@/src/config/layout';
import type { HomeStackParamList } from '@/src/navigation/types';

type ChatbotScreenRouteProp = RouteProp<HomeStackParamList, 'Chatbot'>;

const ChatbotScreen: React.FC = () => {
  const route = useRoute<ChatbotScreenRouteProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { traumaSafeMode } = useTraumaSafeMode();
  const { settings: aiSettings, isLoading: isAISettingsLoading } = useAISettings();
  const { impact, notification } = useHaptics();
  const handleError = useErrorHandler();
  const { scaleFont, scaleSpacing, insets } = useResponsive();
  const privateSessionRequested = route.params?.privateSession === true;

  // Chat pipeline
  const {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    guardrailNotice,
    showCrisisSupport,
    memoryEnabled,
    setMemoryEnabled,
    sendMessage,
    loadHistory,
    clearChat,
    generateSummary,
    clearGuardrailNotice,
    dismissCrisisSupport,
  } = useChatPipeline(user, {
    traumaSafeMode,
    defaultMemoryEnabled: aiSettings.chatMemoryEnabledByDefault,
  });

  const [inputText, setInputText] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { promptsPaused, setPromptsPaused, markSessionCustomized, resetHistoryLoadState } =
    useChatSessionPreferences({
      user,
      isAISettingsLoading,
      chatMemoryEnabledByDefault: aiSettings.chatMemoryEnabledByDefault,
      promptSuggestionsEnabledByDefault: aiSettings.promptSuggestionsEnabledByDefault,
      privateSessionRequested,
      memoryEnabled,
      loadHistory,
      setMemoryEnabled,
    });
  const {
    moodGradient,
    chatExperience,
    suggestedPrompts,
    showGroundingModal,
    groundingMode,
    currentStep,
    showSummary,
    summaryText,
    showJournalPrompt,
    reviewMessageForJournalPrompt,
    dismissJournalPrompt,
    handleCreateJournal,
    handleGenerateSummary,
    closeSummary,
    handleStartBreathing,
    handleStartGrounding,
    closeGroundingModal,
    advanceBreathingStep,
    advanceGroundingStep,
  } = useChatSupport({
    user,
    traumaSafeMode,
    promptsPaused,
    onNotifySuccess: () => notification('success'),
    onHandleError: (caughtError, options) =>
      handleError(caughtError, { context: options?.context ?? 'Chat support action' }),
    onGenerateSummary: generateSummary,
  });
  const crisisSupportRouting = useMemo(
    () => resolveCrisisSupportRouting(getDeviceSafetyContext()),
    [],
  );

  useEffect(() => {
    if (promptsPaused) {
      dismissJournalPrompt();
    }
  }, [dismissJournalPrompt, promptsPaused]);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    requestAnimationFrame(() => {
      scrollTimeoutRef.current = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
  }, []);

  // Memoize messages to prevent unnecessary re-renders
  const memoizedMessages = useMemo(() => messages, [messages]);

  useEffect(() => {
    if (memoizedMessages.length > 0 && !isLoadingHistory) {
      scrollToBottom();
    }
  }, [memoizedMessages.length, isLoadingHistory, scrollToBottom]);

  useEffect(() => {
    const lastUserMessage = memoizedMessages.filter((m) => m.role === 'user').pop();
    if (!lastUserMessage) {
      return;
    }

    reviewMessageForJournalPrompt(lastUserMessage.id, lastUserMessage.content);
  }, [memoizedMessages, reviewMessageForJournalPrompt]);

  // Handle send
  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    // Prevent duplicate sends - check both isLoading and streaming state
    if (!trimmed || isLoading) return;

    if (trimmed.length > MAX_INPUT_LENGTH) {
      handleError(new Error(`Messages must be ${MAX_INPUT_LENGTH} characters or less.`), {
        alertTitle: 'Message Too Long',
        context: 'Chatbot input validation',
      });
      return;
    }

    impact('light');
    setInputText('');
    await sendMessage(trimmed, {
      useStreaming: true,
    });
    notification('success');
  }, [inputText, isLoading, sendMessage, impact, notification, handleError]);

  // Handle prompt chip press
  const handlePromptPress = useCallback(
    (prompt: string) => {
      impact('light');
      setInputText(prompt);
    },
    [impact],
  );

  const handleClearDraft = useCallback(() => {
    setInputText('');
    dismissJournalPrompt();
    impact('light');
  }, [dismissJournalPrompt, impact]);

  // Handle long press on message (copy)
  const handleMessageLongPress = useCallback(
    (content: string) => {
      Clipboard.setString(content);
      notification('success');
      // Success feedback via haptic, no alert needed
    },
    [notification],
  );

  const renderMessageItem = useCallback(
    ({ item, index }: { item: (typeof memoizedMessages)[number]; index: number }) => (
      <AnimatedMessageBubble
        message={item.content}
        isUser={item.role === 'user'}
        timestamp={item.timestamp}
        isTyping={item.isTyping}
        onLongPress={() => handleMessageLongPress(item.content)}
        index={index}
      />
    ),
    [handleMessageLongPress],
  );

  const handleClearChatPress = useCallback(() => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear all messages?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          resetHistoryLoadState();
          clearChat();
          impact('medium');
        },
      },
    ]);
  }, [clearChat, impact, resetHistoryLoadState]);

  const handleOpenSupportLink = useCallback(
    async (url: string, context: string) => {
      try {
        await Linking.openURL(url);
      } catch (error) {
        handleError(error, { context });
      }
    },
    [handleError],
  );

  const handleStartCrisisGrounding = useCallback(() => {
    dismissCrisisSupport();
    handleStartGrounding();
  }, [dismissCrisisSupport, handleStartGrounding]);
  const mapCrisisAction = useCallback(
    (action: { label: string; url: string } | undefined, context: string) =>
      action
        ? {
            label: action.label,
            onPress: () => handleOpenSupportLink(action.url, context),
          }
        : undefined,
    [handleOpenSupportLink],
  );

  const handleToggleMemory = useCallback(() => {
    markSessionCustomized();
    setMemoryEnabled(!memoryEnabled);
    impact('light');
  }, [impact, markSessionCustomized, memoryEnabled, setMemoryEnabled]);

  const handleTogglePrompts = useCallback(() => {
    markSessionCustomized();
    setPromptsPaused((currentValue) => !currentValue);
    impact('light');
  }, [impact, markSessionCustomized, setPromptsPaused]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Announce screen change
  useEffect(() => {
    announceScreenChange('AI Chatbot');
  }, []);

  const chatBottomPadding =
    TAB_BAR_HEIGHT + Math.max(insets.bottom, scaleSpacing(theme.spacing.sm));

  return (
    <ProtectedScreen
      title={TEXT.chatbot}
      subtitle="Mental Health Support"
      requireAuth={true}
      showHeader={false}
      scroll={false}
      safeAreaTop={true}
      safeAreaBottom={true}
      includeTabBarPadding={false}
      style={styles.container}
    >
      <View style={[styles.chatContainer, { paddingBottom: chatBottomPadding }]}>
        <ChatbotHeader
          moodGradient={moodGradient}
          suggestedPrompts={suggestedPrompts}
          title={chatExperience.headerTitle}
          subtitle={chatExperience.headerSubtitle}
          groundingLabel={chatExperience.groundingLabel}
          memoryEnabled={memoryEnabled}
          promptsPaused={promptsPaused}
          onGenerateSummary={handleGenerateSummary}
          onClearChat={handleClearChatPress}
          onToggleMemory={handleToggleMemory}
          onTogglePrompts={handleTogglePrompts}
          onStartGrounding={handleStartBreathing}
          onPromptPress={handlePromptPress}
        />

        {/* Error Banner */}
        {error && <ErrorBanner message={error} />}
        {!memoryEnabled && (
          <GuardrailNoticeCard
            message={
              privateSessionRequested
                ? 'Private session is on. New messages stay in this session only, are not saved, and prompts stay paused.'
                : 'Conversation memory is off. New messages stay in this session and are not saved.'
            }
          />
        )}
        {guardrailNotice && (
          <GuardrailNoticeCard message={guardrailNotice} onDismiss={clearGuardrailNotice} />
        )}

        {/* Messages List */}
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={memoizedMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={[
              styles.messagesContainer,
              { paddingBottom: scaleSpacing(theme.spacing.xl) },
            ]}
            scrollEnabled={true}
            nestedScrollEnabled={false}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={Platform.OS === 'android'}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
            updateCellsBatchingPeriod={50}
            scrollEventThrottle={16}
            inverted={false}
            accessible={true}
            accessibilityLabel="Chat messages"
            ListEmptyComponent={
              <EmptyState icon="chatbubbles-outline" message="Start a conversation" />
            }
          />
        )}

        <ChatComposer
          inputText={inputText}
          maxLength={MAX_INPUT_LENGTH}
          isLoading={isLoading}
          isLoadingHistory={isLoadingHistory}
          bottomPadding={scaleSpacing(theme.spacing.sm)}
          showClearDraft={inputText.trim().length > 0}
          onChangeText={setInputText}
          onClearDraft={handleClearDraft}
          onSend={handleSend}
        />
      </View>

      {/* Grounding Modal */}
      <BottomSheet
        visible={showGroundingModal}
        onClose={closeGroundingModal}
        title={groundingMode === 'breathing' ? 'Breathing Exercise' : '5-4-3-2-1 Grounding'}
        snapPoints={['60%']}
      >
        {groundingMode === 'breathing' ? (
          <BreathingExercise currentStep={currentStep} onStepComplete={advanceBreathingStep} />
        ) : (
          <GroundingExercise currentStep={currentStep} onStepComplete={advanceGroundingStep} />
        )}
      </BottomSheet>

      <BottomSheet
        visible={showCrisisSupport}
        onClose={dismissCrisisSupport}
        title="Crisis Support"
        snapPoints={['65%']}
      >
        <CrisisSupportSheet
          bodyText={crisisSupportRouting.bodyText}
          primaryCallAction={mapCrisisAction(
            crisisSupportRouting.primaryCallAction,
            'Opening regional crisis phone support',
          )}
          primaryTextAction={mapCrisisAction(
            crisisSupportRouting.primaryTextAction,
            'Opening regional crisis text support',
          )}
          emergencyAction={mapCrisisAction(
            crisisSupportRouting.emergencyAction,
            'Opening emergency services support',
          )}
          directoryAction={
            mapCrisisAction(
              crisisSupportRouting.directoryAction,
              'Opening international crisis hotline directory',
            ) ?? {
              label: 'Find Local Hotline',
              onPress: () =>
                handleOpenSupportLink(
                  'https://findahelpline.com',
                  'Opening international crisis hotline directory',
                ),
            }
          }
          onStartGrounding={handleStartCrisisGrounding}
          onDismiss={dismissCrisisSupport}
        />
      </BottomSheet>

      {/* Summary Modal */}
      <BottomSheet
        visible={showSummary}
        onClose={closeSummary}
        title="Conversation Summary"
        snapPoints={['70%']}
      >
        <View style={styles.summaryContainer}>
          {summaryText ? (
            <Text
              style={[
                styles.summaryText,
                { color: theme.colors.text, fontSize: scaleFont(font.bodySmall, 0.3) },
              ]}
            >
              {summaryText}
            </Text>
          ) : (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          )}
        </View>
      </BottomSheet>

      <JournalPromptOverlay
        visible={showJournalPrompt}
        title={chatExperience.journalPromptTitle}
        body={chatExperience.journalPromptBody}
        onDismiss={dismissJournalPrompt}
        onSave={handleCreateJournal}
      />
    </ProtectedScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
  },
  summaryContainer: {
    padding: spacing.lg,
  },
  summaryText: {
    lineHeight: 24,
  },
});

export default ChatbotScreen;
