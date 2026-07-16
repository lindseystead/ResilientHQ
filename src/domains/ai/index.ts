/**
 * AI Domain Facade
 *
 * Shared entry point for AI/chat operations used outside the chatbot feature.
 */

export type {
  AiProxyChatRequest,
  AiProxyChatResponse,
  AiProxyChatSuccessResponse,
  AiProxyMessage,
  AiProxyStreamEvent,
  AiSafetyResult,
} from './contracts';

export type {
  ChatCompletionResponse,
  ChatMessage,
  ChatRequestOptions,
  StreamCallbacks,
} from './chat';

export {
  deleteChatHistory,
  getChatHistory,
  getUserChatMessages,
  requestChatCompletion,
  saveAssistantMessage,
  saveChatMessage,
  saveUserMessage,
  sendChatMessage,
  streamChatCompletion,
} from './chat';

export { extractAiOutputText, isAiProxySuccessResponse, isAiSafetyResult } from './contracts';
export { getAiProxyAuthToken } from './proxyAuth';
export { createSafetyIdentifier, createUserSafetyIdentifier } from './safetyIdentifier';
export {
  buildLocalizedCrisisSupportMessage,
  getDeviceSafetyContext,
  resolveCrisisSupportRouting,
} from './safetyContext';
