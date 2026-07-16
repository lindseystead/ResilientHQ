/**
 * Chat Pipeline Hook
 *
 * Production-grade chat message handling with streaming support, race condition prevention,
 * and Firestore integration. Separates business logic from UI components.
 *
 * Features:
 * - Prevents stale state closures using refs
 * - Robust streaming error handling
 * - Proper cleanup of streaming messages
 * - Firestore persistence
 */

import { isOpenAIConfigured } from '@/src/config/api.config';
import {
  createUserSafetyIdentifier,
  getChatHistory,
  requestChatCompletion,
  saveAssistantMessage,
  saveUserMessage,
  StreamCallbacks,
  streamChatCompletion,
} from '@/src/domains/ai';
import { logger } from '@/src/shared/utils/debug';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildCrisisSupportMessage,
  buildGuardrailNotice,
  sanitizeChatText,
} from '../utils/guardrails';
import {
  ChatMessageWithId,
  StreamSendOptions,
  TYPING_MESSAGE_ID,
  UseChatPipelineOptions,
  WELCOME_MESSAGE_ID,
} from './chatPipeline.models';
import {
  buildChatRequestMessages,
  buildConversationTranscript,
  createWelcomeMessage,
  formatHistoryMessages,
} from './chatPipeline.utils';

export const useChatPipeline = (
  user: import('firebase/auth').User | null,
  pipelineOptions?: UseChatPipelineOptions,
) => {
  const [messages, setMessages] = useState<ChatMessageWithId[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [guardrailNotice, setGuardrailNotice] = useState<string | null>(null);
  const [showCrisisSupport, setShowCrisisSupport] = useState<boolean>(false);
  const [memoryEnabled, setMemoryEnabledState] = useState<boolean>(
    () => pipelineOptions?.defaultMemoryEnabled ?? !(pipelineOptions?.traumaSafeMode ?? false),
  );

  // Refs to prevent stale closures
  const messagesRef = useRef<ChatMessageWithId[]>([]);
  const streamingMessageIdRef = useRef<string | null>(null);
  const streamAbortControllerRef = useRef<AbortController | null>(null);
  const isStreamingRef = useRef<boolean>(false);
  const streamingContentRef = useRef<string>('');
  const streamingFrameRef = useRef<number | null>(null);
  const localIdCounterRef = useRef(0);

  const isAbortError = useCallback((error: unknown) => {
    if (error && typeof error === 'object' && 'name' in error) {
      const name =
        typeof (error as { name?: unknown }).name === 'string'
          ? ((error as { name?: string }).name as string)
          : '';
      if (name === 'AbortError') {
        return true;
      }
    }

    if (error instanceof Error) {
      const lowered = error.message.toLowerCase();
      return lowered.includes('abort') || lowered.includes('aborted');
    }

    return false;
  }, []);

  const abortActiveStream = useCallback(() => {
    const activeController = streamAbortControllerRef.current;
    if (activeController && !activeController.signal.aborted) {
      activeController.abort();
    }

    streamAbortControllerRef.current = null;
    isStreamingRef.current = false;
  }, []);

  const getLocalId = useCallback((prefix: 'user' | 'assistant' | 'history') => {
    const next = localIdCounterRef.current;
    localIdCounterRef.current += 1;
    return `${prefix}-${Date.now()}-${next}`;
  }, []);

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    return () => {
      abortActiveStream();

      if (streamingFrameRef.current !== null) {
        cancelAnimationFrame(streamingFrameRef.current);
        streamingFrameRef.current = null;
      }
    };
  }, [abortActiveStream]);

  // Add welcome message
  const addWelcomeMessage = useCallback(() => {
    setMessages([createWelcomeMessage(pipelineOptions?.traumaSafeMode)]);
  }, [pipelineOptions?.traumaSafeMode]);

  useEffect(() => {
    if (!user) {
      setIsLoadingHistory(false);
      return;
    }

    if (!memoryEnabled && messagesRef.current.length === 0) {
      addWelcomeMessage();
      setIsLoadingHistory(false);
    }
  }, [addWelcomeMessage, memoryEnabled, user]);

  const setMemoryEnabled = useCallback((nextValue: boolean, options?: { announce?: boolean }) => {
    setMemoryEnabledState(nextValue);

    if (options?.announce === false) {
      return;
    }

    setGuardrailNotice(
      nextValue
        ? 'Conversation memory is on. New messages can be saved for this session.'
        : 'Conversation memory is off. New messages stay in this session and will not be saved.',
    );
  }, []);

  // Load chat history (ONLY from Firestore, never calls OpenAI)
  const loadHistory = useCallback(async () => {
    if (!user) {
      setIsLoadingHistory(false);
      return;
    }

    if (!memoryEnabled) {
      if (messagesRef.current.length === 0) {
        addWelcomeMessage();
      }
      setIsLoadingHistory(false);
      return;
    }

    try {
      setIsLoadingHistory(true);
      // Only loads from Firestore - no OpenAI calls
      const history = await getChatHistory(user, 50);

      if (history.length > 0) {
        const existingMessages = messagesRef.current.filter(
          (msg) => msg.id !== TYPING_MESSAGE_ID && msg.id !== WELCOME_MESSAGE_ID,
        );
        setMessages(formatHistoryMessages(history, existingMessages));
      } else {
        addWelcomeMessage();
      }
    } catch (err) {
      logger.error('Error loading chat history', err);
      addWelcomeMessage();
    } finally {
      setIsLoadingHistory(false);
    }
  }, [addWelcomeMessage, memoryEnabled, user]);

  // Remove typing indicator
  const removeTypingIndicator = useCallback(() => {
    setMessages((prev) => prev.filter((msg) => msg.id !== TYPING_MESSAGE_ID));
  }, []);

  // Add typing indicator
  const addTypingIndicator = useCallback(() => {
    setMessages((prev) => {
      // Don't add if already exists
      if (prev.some((msg) => msg.id === TYPING_MESSAGE_ID)) {
        return prev;
      }
      const typingMessage: ChatMessageWithId = {
        id: TYPING_MESSAGE_ID,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isTyping: true,
      };
      return [...prev, typingMessage];
    });
  }, []);

  // Clean up streaming message on error or abort
  const cleanupStreamingMessage = useCallback((messageId: string | null) => {
    if (!messageId) return;

    setMessages((prev) => {
      const filtered = prev.filter((msg) => msg.id !== messageId);
      // Also ensure no streaming flags remain
      return filtered.map((msg) => {
        if (msg.isStreaming) {
          return { ...msg, isStreaming: false };
        }
        return msg;
      });
    });

    streamingMessageIdRef.current = null;
    isStreamingRef.current = false;
    streamingContentRef.current = '';
    if (streamingFrameRef.current !== null) {
      cancelAnimationFrame(streamingFrameRef.current);
      streamingFrameRef.current = null;
    }
  }, []);

  // Send message with streaming support
  const sendMessage = useCallback(
    async (userMessage: string, options?: StreamSendOptions) => {
      const trimmedInput = userMessage.trim();

      // Safeguard: Prevent duplicate calls
      if (!trimmedInput || isLoading || !user) {
        return;
      }

      if (!isOpenAIConfigured()) {
        setError('AI service is not configured.');
        return;
      }

      // Cancel any ongoing stream by cleaning up the previous streaming message
      if (streamingMessageIdRef.current) {
        const activeStreamMessageId = streamingMessageIdRef.current;
        abortActiveStream();
        cleanupStreamingMessage(activeStreamMessageId);
      }

      // Step 1: Add user message
      const safetyAssessment = sanitizeChatText(trimmedInput);
      const sanitizedInput = safetyAssessment.sanitizedContent;
      const nextGuardrailNotice = buildGuardrailNotice(safetyAssessment);

      const userMsg: ChatMessageWithId = {
        id: getLocalId('user'),
        role: 'user',
        content: trimmedInput,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);
      setGuardrailNotice(nextGuardrailNotice);

      // Save user message to Firestore (fire and forget)
      if (memoryEnabled) {
        saveUserMessage(user, sanitizedInput).catch((err) => {
          logger.error('Failed to save user message to Firestore', err);
        });
      }

      if (safetyAssessment.hasCrisisSignals) {
        const crisisResponse = buildCrisisSupportMessage();
        const assistantMsg: ChatMessageWithId = {
          id: getLocalId('assistant'),
          role: 'assistant',
          content: crisisResponse,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setShowCrisisSupport(true);

        if (memoryEnabled) {
          saveAssistantMessage(user, crisisResponse).catch((err) => {
            logger.error('Failed to save crisis support message to Firestore', err);
          });
        }

        options?.onStreamComplete?.(crisisResponse);
        setIsLoading(false);
        return;
      }

      // Step 2: Add typing indicator
      addTypingIndicator();

      try {
        // Step 3: Construct API payload using messagesRef to avoid stale closures
        const apiMessages = buildChatRequestMessages(
          messagesRef.current,
          sanitizedInput,
          pipelineOptions?.traumaSafeMode,
        );
        const safetyIdentifier = createUserSafetyIdentifier(user);

        // Step 4: Call OpenAI (streaming or non-streaming)
        const useStreaming = options?.useStreaming ?? true;

        if (useStreaming) {
          // Streaming mode
          const assistantMsgId = getLocalId('assistant');
          const streamAbortController = new AbortController();
          streamingMessageIdRef.current = assistantMsgId;
          streamAbortControllerRef.current = streamAbortController;
          isStreamingRef.current = true;
          streamingContentRef.current = '';
          if (streamingFrameRef.current !== null) {
            cancelAnimationFrame(streamingFrameRef.current);
            streamingFrameRef.current = null;
          }

          const assistantMsg: ChatMessageWithId = {
            id: assistantMsgId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
          };

          removeTypingIndicator();
          setMessages((prev) => [...prev, assistantMsg]);

          let fullContent = '';
          let hasCompleted = false;
          const clearStreamController = () => {
            if (streamAbortControllerRef.current === streamAbortController) {
              streamAbortControllerRef.current = null;
            }
          };

          const callbacks: StreamCallbacks = {
            onToken: (token: string) => {
              // Only update if still streaming and message exists
              if (
                hasCompleted ||
                streamAbortController.signal.aborted ||
                streamingMessageIdRef.current !== assistantMsgId
              ) {
                return;
              }

              fullContent += token;
              streamingContentRef.current = fullContent;

              if (streamingFrameRef.current === null) {
                streamingFrameRef.current = requestAnimationFrame(() => {
                  streamingFrameRef.current = null;
                  const content = streamingContentRef.current;
                  setMessages((prev) =>
                    prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, content } : msg)),
                  );
                });
              }

              options?.onStreamToken?.(token);
            },
            onMeta: (safety) => {
              if (
                streamAbortController.signal.aborted ||
                streamingMessageIdRef.current !== assistantMsgId
              ) {
                return;
              }

              if (safety.shouldEscalate) {
                setShowCrisisSupport(true);
              }

              if (safety.userFacingMessage) {
                setGuardrailNotice(safety.userFacingMessage);
              }
            },
            onMessageComplete: (fullMessage: string) => {
              if (hasCompleted) return;
              hasCompleted = true;

              if (
                streamAbortController.signal.aborted ||
                streamingMessageIdRef.current !== assistantMsgId
              ) {
                clearStreamController();
                return;
              }

              if (streamingFrameRef.current !== null) {
                cancelAnimationFrame(streamingFrameRef.current);
                streamingFrameRef.current = null;
              }

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: fullMessage, isStreaming: false }
                    : msg,
                ),
              );

              streamingMessageIdRef.current = null;
              isStreamingRef.current = false;
              streamingContentRef.current = '';
              clearStreamController();

              // Save to Firestore (fire and forget)
              if (user && memoryEnabled) {
                saveAssistantMessage(user, fullMessage).catch((err) => {
                  logger.error('Failed to save assistant message to Firestore', err);
                });
              }

              options?.onStreamComplete?.(fullMessage);
            },
            onError: (err: unknown) => {
              hasCompleted = true;
              clearStreamController();

              if (
                streamAbortController.signal.aborted ||
                streamingMessageIdRef.current !== assistantMsgId ||
                isAbortError(err)
              ) {
                return;
              }

              logger.error('Streaming error', err);

              if (streamingFrameRef.current !== null) {
                cancelAnimationFrame(streamingFrameRef.current);
                streamingFrameRef.current = null;
              }

              // Clean up streaming message
              cleanupStreamingMessage(assistantMsgId);
              removeTypingIndicator();

              // Set user-friendly error message
              const errorMessage =
                err instanceof Error
                  ? err.message
                  : typeof err === 'string'
                    ? err
                    : 'Failed to get response. Please try again.';
              setError(errorMessage);

              streamingMessageIdRef.current = null;
              isStreamingRef.current = false;
              streamingContentRef.current = '';
            },
          };

          // Use streaming from chat service
          try {
            await streamChatCompletion(apiMessages, callbacks, {
              safetyIdentifier,
              signal: streamAbortController.signal,
            });
          } catch (streamErr: unknown) {
            if (streamAbortController.signal.aborted || isAbortError(streamErr)) {
              clearStreamController();
              removeTypingIndicator();
              return;
            }

            // Handle errors that weren't caught by onError callback
            logger.error('Stream chat completion error', streamErr);
            hasCompleted = true;
            clearStreamController();
            cleanupStreamingMessage(assistantMsgId);
            removeTypingIndicator();
            setError(
              streamErr instanceof Error
                ? streamErr.message
                : 'Failed to send message. Please try again.',
            );
          }
        } else {
          // Non-streaming mode (fallback)
          removeTypingIndicator();

          try {
            const response = await requestChatCompletion(apiMessages, {
              safetyIdentifier,
            });

            if (response.error) {
              setError(response.error);
            } else {
              if (response.safety?.shouldEscalate) {
                setShowCrisisSupport(true);
              }

              if (response.safety?.userFacingMessage) {
                setGuardrailNotice(response.safety.userFacingMessage);
              }

              const assistantMsg: ChatMessageWithId = {
                id: getLocalId('assistant'),
                role: 'assistant',
                content: response.content,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, assistantMsg]);

              // Save to Firestore (fire and forget)
              if (user && memoryEnabled) {
                saveAssistantMessage(user, response.content).catch((err) => {
                  logger.error('Failed to save assistant message to Firestore', err);
                });
              }

              options?.onStreamComplete?.(response.content);
            }
          } catch (err: unknown) {
            logger.error('Non-streaming chat error', err);
            setError(
              err instanceof Error ? err.message : 'Failed to send message. Please try again.',
            );
          }
        }
      } catch (err: unknown) {
        if (isAbortError(err)) {
          removeTypingIndicator();
          return;
        }

        logger.error('Error sending message', err);
        removeTypingIndicator();

        // Clean up any streaming message that might have been created
        if (streamingMessageIdRef.current) {
          abortActiveStream();
          cleanupStreamingMessage(streamingMessageIdRef.current);
        }

        setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
      } finally {
        setIsLoading(false);
        // Note: streamingMessageIdRef is cleared in cleanupStreamingMessage or onMessageComplete
      }
    },
    [
      isLoading,
      pipelineOptions?.traumaSafeMode,
      user,
      memoryEnabled,
      addTypingIndicator,
      removeTypingIndicator,
      abortActiveStream,
      cleanupStreamingMessage,
      getLocalId,
      isAbortError,
    ],
  );

  // Clear chat
  const clearChat = useCallback(() => {
    // Clean up any ongoing streaming
    if (streamingMessageIdRef.current) {
      abortActiveStream();
      cleanupStreamingMessage(streamingMessageIdRef.current);
    }

    setMessages([]);
    setError(null);
    setGuardrailNotice(null);
    setShowCrisisSupport(false);
    addWelcomeMessage();
  }, [abortActiveStream, addWelcomeMessage, cleanupStreamingMessage]);

  // Generate summary
  const generateSummary = useCallback(async (): Promise<string | null> => {
    if (!user || messagesRef.current.length < 2) return null;

    try {
      // Use messagesRef to get current messages (avoid stale closure)
      const conversationText = buildConversationTranscript(messagesRef.current);

      if (!conversationText) {
        return null;
      }

      const summaryPrompt = `Analyze this mental health conversation and provide a concise summary focusing on:
1. Emotional themes and patterns
2. Key concerns or topics discussed
3. Suggested journal prompts for reflection

Conversation:
${conversationText}

Provide a structured summary in 2-3 paragraphs.`;

      const response = await requestChatCompletion([
        { role: 'system', content: 'You are a mental health conversation analyst.' },
        { role: 'user', content: summaryPrompt },
      ]);

      return response.error ? null : response.content;
    } catch (err) {
      logger.error('Error generating summary', err);
      return null;
    }
  }, [user]);

  return {
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
    clearGuardrailNotice: () => setGuardrailNotice(null),
    dismissCrisisSupport: () => setShowCrisisSupport(false),
    setError,
  };
};
