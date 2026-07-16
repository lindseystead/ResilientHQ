/**
 * AI Proxy Contracts
 *
 * Shared request/response contracts between the mobile client and the
 * first-party AI proxy layer.
 */

export type AiProxyRole = 'system' | 'user' | 'assistant';

export interface AiProxyMessage {
  role: AiProxyRole;
  content: string;
}

export type AiSafetyLevel = 'clear' | 'sensitive' | 'blocked' | 'crisis';

export interface AiSafetyResult {
  level: AiSafetyLevel;
  blocked: boolean;
  shouldEscalate: boolean;
  reasonCodes: string[];
  redactedTypes: string[];
  userFacingMessage?: string;
}

export interface AiProxyChatRequest {
  model: string;
  messages: AiProxyMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  safetyIdentifier?: string;
  safetyLocale?: string;
  safetyCountry?: string;
}

export interface AiProxyChatSuccessResponse {
  content: string;
  safety: AiSafetyResult;
  metadata?: {
    provider?: string;
    model?: string;
    responsesApi?: boolean;
  };
}

export interface AiProxyChatErrorResponse {
  content: '';
  error: string;
  safety?: AiSafetyResult;
}

export type AiProxyChatResponse = AiProxyChatSuccessResponse | AiProxyChatErrorResponse;

export type AiProxyStreamEvent =
  | { type: 'meta'; safety: AiSafetyResult }
  | { type: 'token'; content: string }
  | { type: 'done'; content: string; safety: AiSafetyResult }
  | { type: 'error'; error: string; safety?: AiSafetyResult };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object';

export const isAiSafetyResult = (value: unknown): value is AiSafetyResult => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.level === 'string' &&
    typeof value.blocked === 'boolean' &&
    typeof value.shouldEscalate === 'boolean' &&
    Array.isArray(value.reasonCodes) &&
    Array.isArray(value.redactedTypes)
  );
};

export const isAiProxySuccessResponse = (value: unknown): value is AiProxyChatSuccessResponse => {
  if (!isRecord(value) || typeof value.content !== 'string') {
    return false;
  }

  return isAiSafetyResult(value.safety);
};

export const extractAiOutputText = (data: unknown): string => {
  if (!isRecord(data)) {
    return 'No response generated.';
  }

  if (typeof data.content === 'string') {
    return data.content;
  }

  if (typeof data.output_text === 'string') {
    return data.output_text;
  }

  if (isRecord(data.message) && typeof data.message.content === 'string') {
    return data.message.content;
  }

  if (
    Array.isArray(data.choices) &&
    isRecord(data.choices[0]) &&
    isRecord(data.choices[0].message) &&
    typeof data.choices[0].message.content === 'string'
  ) {
    return data.choices[0].message.content;
  }

  return 'No response generated.';
};
