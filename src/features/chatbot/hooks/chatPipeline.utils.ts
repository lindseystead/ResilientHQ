import { ChatMessage } from '@/src/domains/ai';
import { normalizeTimestamp } from '@/src/shared/utils/dates/normalizeTimestamp';

import { buildChatSystemPrompt } from '../utils/experience';
import { sanitizeChatText } from '../utils/guardrails';
import { ChatMessageWithId, TYPING_MESSAGE_ID, WELCOME_MESSAGE_ID } from './chatPipeline.models';

type ChatRequestMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export const createWelcomeMessage = (traumaSafeMode?: boolean): ChatMessageWithId => ({
  id: WELCOME_MESSAGE_ID,
  role: 'assistant',
  content: traumaSafeMode
    ? 'Hello. We can keep this simple and low pressure. Share only what feels okay, and I can help with one calm next step.'
    : "Hello! I'm here to support you. How are you feeling today? Feel free to share what's on your mind.",
  timestamp: new Date(),
});

const normalizeStoredMessageTimestamp = (timestamp: ChatMessage['timestamp']): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  return normalizeTimestamp(timestamp);
};

export const formatHistoryMessages = (
  history: ChatMessage[],
  existingMessages: ChatMessageWithId[],
): ChatMessageWithId[] => {
  const formattedMessages = history.map((message, index) => {
    const timestamp = normalizeStoredMessageTimestamp(message.timestamp);

    return {
      id: message.id || `${message.role}-${timestamp.getTime()}-${index}`,
      role: message.role,
      content: message.content,
      timestamp,
    };
  });

  if (existingMessages.length === 0) {
    return formattedMessages;
  }

  const mergedById = new Map<string, ChatMessageWithId>();
  formattedMessages.forEach((message) => mergedById.set(message.id, message));
  existingMessages.forEach((message) => mergedById.set(message.id, message));

  return Array.from(mergedById.values()).sort(
    (left, right) => left.timestamp.getTime() - right.timestamp.getTime(),
  );
};

export const getPersistedConversationMessages = (messages: ChatMessageWithId[]) =>
  messages.filter(
    (message) =>
      message.id !== TYPING_MESSAGE_ID && message.id !== WELCOME_MESSAGE_ID && !message.isStreaming,
  );

export const buildChatRequestMessages = (
  messages: ChatMessageWithId[],
  currentInput: string,
  traumaSafeMode?: boolean,
): ChatRequestMessage[] => {
  const apiMessages: ChatRequestMessage[] = [
    {
      role: 'system',
      content: buildChatSystemPrompt(traumaSafeMode ?? false),
    },
  ];

  getPersistedConversationMessages(messages).forEach((message) => {
    if (!message.isTyping && message.content.trim()) {
      apiMessages.push({
        role: message.role,
        content:
          message.role === 'user'
            ? sanitizeChatText(message.content).sanitizedContent
            : message.content,
      });
    }
  });

  apiMessages.push({ role: 'user', content: currentInput });

  return apiMessages;
};

export const buildConversationTranscript = (messages: ChatMessageWithId[]) => {
  const transcript = getPersistedConversationMessages(messages)
    .map((message) => {
      const content =
        message.role === 'user'
          ? sanitizeChatText(message.content).sanitizedContent
          : message.content;
      return `${message.role}: ${content}`;
    })
    .join('\n');

  return transcript.trim() ? transcript : null;
};
