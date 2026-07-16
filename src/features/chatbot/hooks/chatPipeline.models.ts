import { User } from 'firebase/auth';

export interface ChatMessageWithId {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  isStreaming?: boolean;
}

export interface UseChatPipelineOptions {
  traumaSafeMode?: boolean;
  defaultMemoryEnabled?: boolean;
}

export interface StreamSendOptions {
  onStreamToken?: (token: string) => void;
  onStreamComplete?: (fullMessage: string) => void;
  useStreaming?: boolean;
}

export interface ChatPipelineContext {
  user: User;
  traumaSafeMode?: boolean;
  memoryEnabled: boolean;
}

export const TYPING_MESSAGE_ID = 'typing-indicator';
export const WELCOME_MESSAGE_ID = 'welcome-message';
