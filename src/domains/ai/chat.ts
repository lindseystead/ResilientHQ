/**
 * AI Chat Service
 *
 * Domain-owned streaming chat service with Firestore persistence,
 * rate limiting, and graceful degradation when Firebase is unavailable.
 */

import { buildUrl, openaiConfig } from '@/src/config/api.config';
import { auth, db } from '@/src/config/firebase.config';
import type { AiSafetyResult } from '@/src/domains/ai/contracts';
import {
  extractAiOutputText,
  isAiProxySuccessResponse,
  isAiSafetyResult,
} from '@/src/domains/ai/contracts';
import { getAiProxyAuthToken } from '@/src/domains/ai/proxyAuth';
import { getDeviceSafetyContext } from '@/src/domains/ai/safetyContext';
import { createUserSafetyIdentifier } from '@/src/domains/ai/safetyIdentifier';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';
import { logger } from '@/src/shared/utils/debug';
import { rateLimit } from '@/src/shared/utils/api/rateLimit';
import { User } from 'firebase/auth';
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

export interface ChatMessage {
  id?: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onMeta?: (safety: AiSafetyResult) => void;
  onMessageComplete?: (fullMessage: string) => void;
  onError?: (error: Error | unknown) => void;
}

interface StreamRequestOptions {
  safetyIdentifier?: string;
  safetyLocale?: string;
  safetyCountry?: string;
  authToken?: string;
  signal?: AbortSignal;
}

export interface ChatRequestOptions extends StreamRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResponse {
  content: string;
  error?: string;
  safety?: AiSafetyResult;
  metadata?: {
    provider?: string;
    model?: string;
    responsesApi?: boolean;
  };
}

const isAbortError = (error: unknown, signal?: AbortSignal): boolean => {
  if (signal?.aborted) {
    return true;
  }

  if (error && typeof error === 'object' && 'name' in error) {
    const errorName =
      typeof (error as { name?: unknown }).name === 'string'
        ? ((error as { name?: string }).name as string)
        : '';
    if (errorName === 'AbortError') {
      return true;
    }
  }

  if (error instanceof Error) {
    const lowered = error.message.toLowerCase();
    if (lowered.includes('abort') || lowered.includes('aborted')) {
      return true;
    }
  }

  return false;
};

export const saveUserMessage = async (user: User, content: string): Promise<string | null> => {
  if (!db || !user) return null;

  try {
    const message = {
      userId: user.uid,
      role: 'user',
      content,
      timestamp: serverTimestamp(),
    };

    const messagesCollection = collection(db, 'chats', user.uid, 'messages');
    const docRef = await addDoc(messagesCollection, message);

    return docRef.id;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error?.code === 'unavailable' || error?.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
      return null;
    }

    logger.error('Error saving user message', err instanceof Error ? err : new Error(String(err)));
    return null;
  }
};

export const saveAssistantMessage = async (user: User, content: string): Promise<string | null> => {
  if (!db || !user) return null;

  try {
    const message = {
      userId: user.uid,
      role: 'assistant',
      content,
      timestamp: serverTimestamp(),
    };

    const messagesCollection = collection(db, 'chats', user.uid, 'messages');
    const docRef = await addDoc(messagesCollection, message);

    return docRef.id;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error?.code === 'unavailable' || error?.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
      return null;
    }

    logger.error(
      'Error saving assistant message',
      err instanceof Error ? err : new Error(String(err)),
    );
    return null;
  }
};

export const getChatHistory = async (
  user: User,
  limitCount: number = 50,
): Promise<ChatMessage[]> => {
  if (!db || !user) return [];

  try {
    const messagesCollection = collection(db, 'chats', user.uid, 'messages');
    const historyQuery = query(messagesCollection, orderBy('timestamp', 'asc'), limit(limitCount));

    const snapshot = await getDocs(historyQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        role: data.role,
        content: data.content,
        timestamp: normalizeTimestamp(data.timestamp),
      };
    });
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error?.code === 'unavailable' || error?.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
      return [];
    }

    logger.error('Error loading chat history', err);
    return [];
  }
};

export const getUserChatMessages = getChatHistory;
export const saveChatMessage = saveUserMessage;

export const deleteChatHistory = async (user: User): Promise<number> => {
  if (!db || !user) return 0;

  try {
    const messagesCollection = collection(db, 'chats', user.uid, 'messages');
    const snapshot = await getDocs(messagesCollection);

    if (snapshot.empty) {
      return 0;
    }

    const deleteBatchSize = 400;

    for (let index = 0; index < snapshot.docs.length; index += deleteBatchSize) {
      const batch = writeBatch(db);

      snapshot.docs.slice(index, index + deleteBatchSize).forEach((chatDoc) => {
        batch.delete(chatDoc.ref);
      });

      await batch.commit();
    }

    return snapshot.docs.length;
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error?.code === 'unavailable' || error?.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
      return 0;
    }

    logger.error(
      'Error deleting chat history',
      err instanceof Error ? err : new Error(String(err)),
    );
    return 0;
  }
};

export const requestChatCompletion = async (
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  requestOptions?: ChatRequestOptions,
  retryCount: number = 0,
): Promise<ChatCompletionResponse> => {
  const maxRetries = 1;

  return rateLimit(async () => {
    if (retryCount === 0) {
      logger.debug('AI proxy request', {
        endpoint: openaiConfig.endpoints.aiChat,
      });
    }

    try {
      const authToken = await getAiProxyAuthToken(requestOptions?.authToken);
      const safetyIdentifier =
        requestOptions?.safetyIdentifier ?? createUserSafetyIdentifier(auth?.currentUser ?? null);
      const deviceSafetyContext = getDeviceSafetyContext();
      const response = await fetch(buildUrl(openaiConfig.endpoints.aiChat), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        signal: requestOptions?.signal,
        body: JSON.stringify({
          model: requestOptions?.model ?? openaiConfig.models.chat,
          messages,
          temperature: requestOptions?.temperature ?? openaiConfig.default.temperature,
          maxTokens: requestOptions?.maxTokens ?? openaiConfig.default.maxTokens,
          safetyIdentifier,
          safetyLocale: requestOptions?.safetyLocale ?? deviceSafetyContext.safetyLocale,
          safetyCountry: requestOptions?.safetyCountry ?? deviceSafetyContext.safetyCountry,
        }),
      });

      if (response.status === 429) {
        if (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return requestChatCompletion(messages, requestOptions, retryCount + 1);
        }

        return {
          content: '',
          error: 'AI service rate limit hit (429). Please try again in a few seconds.',
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          typeof errorData.error === 'string'
            ? errorData.error
            : typeof errorData.error?.message === 'string'
              ? errorData.error.message
              : `API request failed with status ${response.status}`;
        return {
          content: '',
          error: errorMessage,
          safety: isAiSafetyResult(errorData.safety) ? errorData.safety : undefined,
        };
      }

      const data = await response.json();
      const content = extractAiOutputText(data);

      if (isAiProxySuccessResponse(data)) {
        return {
          content: data.content,
          safety: data.safety,
          metadata: data.metadata,
        };
      }

      return {
        content,
        safety: isAiSafetyResult((data as { safety?: unknown }).safety)
          ? (data as { safety: AiSafetyResult }).safety
          : undefined,
      };
    } catch (error: unknown) {
      logger.error('AI proxy error', error, { messageCount: messages.length });
      return {
        content: '',
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get response from AI. Please try again.',
      };
    }
  });
};

export const streamChatCompletion = async (
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  callbacks: StreamCallbacks,
  requestOptions?: StreamRequestOptions,
  retryCount: number = 0,
): Promise<string | void> => {
  const maxRetries = 1;

  return rateLimit(async () => {
    let errorAlreadyReported = false;

    try {
      if (retryCount === 0) {
        logger.debug('AI proxy streaming config', {
          endpoint: openaiConfig.endpoints.aiChatStream,
        });
      }

      const authToken = await getAiProxyAuthToken(requestOptions?.authToken);
      const safetyIdentifier =
        requestOptions?.safetyIdentifier ?? createUserSafetyIdentifier(auth?.currentUser ?? null);
      const deviceSafetyContext = getDeviceSafetyContext();
      const response = await fetch(buildUrl(openaiConfig.endpoints.aiChatStream), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        signal: requestOptions?.signal,
        body: JSON.stringify({
          model: openaiConfig.models.chat,
          stream: true,
          messages,
          safetyIdentifier,
          safetyLocale: requestOptions?.safetyLocale ?? deviceSafetyContext.safetyLocale,
          safetyCountry: requestOptions?.safetyCountry ?? deviceSafetyContext.safetyCountry,
        }),
      });

      if (response.status === 429) {
        if (retryCount < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return streamChatCompletion(messages, callbacks, requestOptions, retryCount + 1);
        }

        const error = new Error(
          'AI service rate limit hit (429). Please try again in a few seconds.',
        );
        callbacks.onError?.(error);
        errorAlreadyReported = true;
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          typeof errorData.error === 'string'
            ? errorData.error
            : typeof errorData.error?.message === 'string'
              ? errorData.error.message
              : `AI proxy error: ${response.status}`;
        const error = new Error(errorMessage);
        callbacks.onError?.(error);
        errorAlreadyReported = true;
        throw error;
      }

      if (!response.body) {
        const error = new Error('Streaming response body is unavailable.');
        callbacks.onError?.(error);
        errorAlreadyReported = true;
        throw error;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullMessage = '';
      let completedFromDoneEvent = false;
      let streamBuffer = '';

      const processSseLine = (line: string) => {
        if (!line.startsWith('data:')) {
          return;
        }

        const json = line.replace(/^data:\s?/, '').trim();

        if (json === '[DONE]' || json.length === 0) {
          return;
        }

        let parsed: Record<string, unknown>;

        try {
          parsed = JSON.parse(json) as Record<string, unknown>;
        } catch {
          // Skip malformed chunks and continue streaming.
          return;
        }

        const eventType = typeof parsed.type === 'string' ? parsed.type : undefined;

        if (eventType === 'meta') {
          if (isAiSafetyResult(parsed.safety)) {
            callbacks.onMeta?.(parsed.safety);
          }
          return;
        }

        if (eventType === 'error') {
          if (isAiSafetyResult(parsed.safety)) {
            callbacks.onMeta?.(parsed.safety);
          }

          const streamError = new Error(
            typeof parsed.error === 'string' ? parsed.error : 'Streaming request failed.',
          );
          callbacks.onError?.(streamError);
          errorAlreadyReported = true;
          throw streamError;
        }

        if (eventType === 'done') {
          if (isAiSafetyResult(parsed.safety)) {
            callbacks.onMeta?.(parsed.safety);
          }

          if (typeof parsed.content === 'string') {
            fullMessage = parsed.content;
          }
          completedFromDoneEvent = true;
          return;
        }

        const choiceList = Array.isArray(parsed.choices) ? parsed.choices : null;
        const firstChoice =
          choiceList && choiceList.length > 0 && typeof choiceList[0] === 'object'
            ? (choiceList[0] as { delta?: { content?: unknown } })
            : null;
        const token =
          typeof parsed.content === 'string'
            ? parsed.content
            : typeof firstChoice?.delta?.content === 'string'
              ? firstChoice.delta.content
              : undefined;

        if (typeof token === 'string' && token.length > 0) {
          fullMessage += token;
          callbacks.onToken(token);
        }
      };

      const processBufferedData = (flush: boolean = false) => {
        const lineBreakPattern = /\r?\n/;
        const lines = streamBuffer.split(lineBreakPattern);
        const trailingFragment = lines.pop();
        streamBuffer = trailingFragment ?? '';

        lines.forEach((rawLine) => {
          processSseLine(rawLine.trimEnd());
        });

        if (flush && streamBuffer.trim().length > 0) {
          processSseLine(streamBuffer.trimEnd());
          streamBuffer = '';
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          streamBuffer += decoder.decode();
          processBufferedData(true);
          break;
        }

        streamBuffer += decoder.decode(value, { stream: true });
        processBufferedData();
      }

      if (!completedFromDoneEvent || fullMessage.length > 0) {
        callbacks.onMessageComplete?.(fullMessage);
      }

      return fullMessage;
    } catch (err: unknown) {
      if (isAbortError(err, requestOptions?.signal)) {
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));
      if (!errorAlreadyReported) {
        callbacks.onError?.(error);
      }
      logger.error('Streaming error', error);
      throw error;
    }
  });
};

export const sendChatMessage = async (
  user: User,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  callbacks: StreamCallbacks,
  requestOptions?: StreamRequestOptions,
) => {
  const lastUserMessage = messages.filter((message) => message.role === 'user').pop();
  if (lastUserMessage) {
    await saveUserMessage(user, lastUserMessage.content);
  }

  const finalMessage = await streamChatCompletion(messages, callbacks, requestOptions);

  if (finalMessage) {
    await saveAssistantMessage(user, finalMessage);
  }

  return finalMessage;
};
