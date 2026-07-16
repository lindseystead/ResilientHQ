'use strict';

const { TextDecoder } = require('node:util');

const { buildOpenAIUrl, getOutputModerationModel, getProxyTimeoutMs } = require('./config');

const createAbortController = () => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, getProxyTimeoutMs());

  return {
    controller,
    clear: () => clearTimeout(timer),
  };
};

const buildOpenAIPayload = (requestBody, messages, stream) => ({
  model: requestBody.model,
  messages,
  temperature: requestBody.temperature,
  max_tokens: requestBody.maxTokens,
  stream,
});

const parseOpenAIContent = (data) => {
  if (!data || typeof data !== 'object') {
    return '';
  }

  if (
    Array.isArray(data.choices) &&
    data.choices[0] &&
    data.choices[0].message &&
    typeof data.choices[0].message.content === 'string'
  ) {
    return data.choices[0].message.content;
  }

  if (typeof data.output_text === 'string') {
    return data.output_text;
  }

  if (typeof data.content === 'string') {
    return data.content;
  }

  return '';
};

const emitAuditLog = (details) => {
  const safePayload = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...details,
  });

  process.stdout.write(`${safePayload}\n`);
};

const callOpenAI = async (payload, stream) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const abort = createAbortController();

  try {
    return await fetch(buildOpenAIUrl('/chat/completions'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildOpenAIPayload(payload.request, payload.messages, stream)),
      signal: abort.controller.signal,
    });
  } finally {
    abort.clear();
  }
};

const parseModerationResult = (data) => {
  if (!data || typeof data !== 'object') {
    return {
      flagged: false,
      categories: {},
      raw: null,
    };
  }

  const firstResult =
    Array.isArray(data.results) && data.results[0] && typeof data.results[0] === 'object'
      ? data.results[0]
      : null;

  if (!firstResult) {
    return {
      flagged: false,
      categories: {},
      raw: data,
    };
  }

  const categories =
    firstResult.categories && typeof firstResult.categories === 'object'
      ? firstResult.categories
      : {};

  return {
    flagged: firstResult.flagged === true,
    categories,
    raw: firstResult,
  };
};

const callOpenAIModeration = async (input) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const normalizedInput = typeof input === 'string' ? input : '';

  if (!normalizedInput.trim()) {
    return {
      flagged: false,
      categories: {},
      raw: null,
    };
  }

  const abort = createAbortController();

  try {
    const response = await fetch(buildOpenAIUrl('/moderations'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: getOutputModerationModel(),
        input: normalizedInput,
      }),
      signal: abort.controller.signal,
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const message =
        errorPayload && errorPayload.error && typeof errorPayload.error.message === 'string'
          ? errorPayload.error.message
          : `OpenAI moderation request failed with status ${response.status}.`;
      throw new Error(message);
    }

    const data = await response.json();
    return parseModerationResult(data);
  } finally {
    abort.clear();
  }
};

const streamOpenAIResponse = async (providerResponse, onToken, onMalformedChunk) => {
  const decoder = new TextDecoder();
  const reader = providerResponse.body.getReader();
  let buffer = '';
  let finalContent = '';

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) {
        continue;
      }

      const payload = line.replace('data: ', '').trim();

      if (payload === '[DONE]') {
        return finalContent;
      }

      try {
        const parsed = JSON.parse(payload);
        const token =
          parsed &&
          parsed.choices &&
          parsed.choices[0] &&
          parsed.choices[0].delta &&
          typeof parsed.choices[0].delta.content === 'string'
            ? parsed.choices[0].delta.content
            : typeof parsed.content === 'string'
              ? parsed.content
              : '';

        if (token) {
          finalContent += token;
          await onToken(token);
        }
      } catch {
        await onMalformedChunk();
      }
    }
  }

  return finalContent;
};

module.exports = {
  callOpenAI,
  callOpenAIModeration,
  emitAuditLog,
  parseModerationResult,
  parseOpenAIContent,
  streamOpenAIResponse,
};
