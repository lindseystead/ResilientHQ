'use strict';

const http = require('node:http');

const {
  getSemanticModerationMinChars,
  getProxyPort,
  shouldEnableSemanticModeration,
  shouldFailClosedOnModerationError,
  shouldRequireAuth,
  shouldVerifyFirebaseTokens,
  validateRuntimeConfiguration,
} = require('./config');
const { verifyRequestAuth } = require('./auth');
const {
  getResponseHeaders,
  isCorsOriginAllowed,
  readJsonBody,
  writeJson,
  writeSseDone,
  writeSseEvent,
  writeSseHeaders,
} = require('./http');
const { buildRateLimitKey, enforceRateLimit } = require('./rateLimit');
const {
  callOpenAIModeration,
  callOpenAI,
  emitAuditLog,
  parseOpenAIContent,
  streamOpenAIResponse,
} = require('./provider');
const {
  assessAssistantOutputSafety,
  assessMessageSafety,
  buildSemanticModerationSafety,
  buildSafetyResult,
  getLatestUserContent,
  mergeSafetyResults,
  normalizeProxyRequest,
  redactSensitiveText,
  resolveCrisisRoutingContext,
} = require('./safety');

const STREAM_OUTPUT_BUFFER_CHARS = 120;

const createMetadata = (requestBody, provider) => ({
  provider,
  model: requestBody.request.model,
  responsesApi: false,
});

const createProxyErrorBody = (message, safety) => ({
  content: '',
  error: message,
  ...(safety ? { safety } : {}),
});

const buildSemanticModerationFailureSafety = () =>
  buildSafetyResult({
    level: 'blocked',
    blocked: true,
    shouldEscalate: false,
    reasonCodes: ['semantic-moderation-unavailable'],
    userFacingMessage:
      'I can’t continue this response right now. Please try again in a moment or use grounding support.',
  });

const resolveSemanticContentSafety = async (content, options = {}) => {
  const scope = options && options.scope === 'input' ? 'input' : 'output';
  const crisisContext =
    options && options.crisisContext ? resolveCrisisRoutingContext(options.crisisContext) : {};

  if (!shouldEnableSemanticModeration()) {
    return buildSafetyResult();
  }

  try {
    const moderationResult = await callOpenAIModeration(content);
    return buildSemanticModerationSafety(moderationResult, { scope, crisisContext });
  } catch (error) {
    process.stdout.write(
      `[ai-proxy] Warning: ${scope} semantic moderation request failed. ${
        error instanceof Error ? error.message : String(error)
      }\n`,
    );

    if (shouldFailClosedOnModerationError()) {
      return buildSemanticModerationFailureSafety();
    }

    return buildSafetyResult();
  }
};

const resolveSemanticOutputSafety = async (content, crisisContext) =>
  resolveSemanticContentSafety(content, { scope: 'output', crisisContext });

const resolveSemanticInputSafety = async (messages, crisisContext) => {
  const latestUserContent = getLatestUserContent(messages);
  return resolveSemanticContentSafety(latestUserContent, { scope: 'input', crisisContext });
};

const createSemanticModerationGate = (resolver, options = {}) => {
  const evaluateContentSafety =
    typeof resolver === 'function' ? resolver : async () => buildSafetyResult();
  const minChars =
    Number.isFinite(options.minChars) && options.minChars > 0
      ? Math.round(options.minChars)
      : getSemanticModerationMinChars();

  let lastModeratedLength = 0;
  let lastSafety = buildSafetyResult();

  return {
    evaluate: async (content, evaluateOptions = {}) => {
      const normalizedContent = typeof content === 'string' ? content : '';
      const shouldForce = evaluateOptions && evaluateOptions.force === true;

      if (!normalizedContent.trim()) {
        return lastSafety;
      }

      if (!shouldForce && normalizedContent.length - lastModeratedLength < minChars) {
        return lastSafety;
      }

      const nextSafety = await evaluateContentSafety(normalizedContent);
      lastModeratedLength = normalizedContent.length;
      lastSafety = mergeSafetyResults(lastSafety, nextSafety);
      return lastSafety;
    },
  };
};

const createStreamOutputBlockedError = (safety) => {
  const error = new Error('Assistant output was blocked by safety filters.');
  error.code = 'STREAM_OUTPUT_BLOCKED';
  error.safety = safety;
  return error;
};

const createStreamOutputGate = (baseSafety, crisisContext) => {
  let releasedContent = '';
  let pendingContent = '';

  return {
    push: (token) => {
      pendingContent += token;
      const outputAssessment = assessAssistantOutputSafety(`${releasedContent}${pendingContent}`, {
        crisisContext,
      });
      const effectiveSafety = mergeSafetyResults(baseSafety, outputAssessment.safety);

      if (effectiveSafety.blocked) {
        pendingContent = '';
        return {
          blocked: true,
          safety: effectiveSafety,
        };
      }

      if (pendingContent.length < STREAM_OUTPUT_BUFFER_CHARS) {
        return {
          blocked: false,
          chunk: '',
        };
      }

      const chunk = pendingContent;
      releasedContent += chunk;
      pendingContent = '';

      return {
        blocked: false,
        chunk,
        content: releasedContent,
      };
    },
    flush: () => {
      const outputAssessment = assessAssistantOutputSafety(`${releasedContent}${pendingContent}`, {
        crisisContext,
      });
      const effectiveSafety = mergeSafetyResults(baseSafety, outputAssessment.safety);

      if (effectiveSafety.blocked) {
        pendingContent = '';
        return {
          blocked: true,
          safety: effectiveSafety,
        };
      }

      const chunk = pendingContent;
      releasedContent += chunk;
      pendingContent = '';

      return {
        blocked: false,
        chunk,
        content: releasedContent,
        safety: effectiveSafety,
      };
    },
  };
};

const extractPreferredLocaleFromRequest = (req) => {
  if (!req || !req.headers) {
    return '';
  }

  const raw = req.headers['accept-language'];
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (typeof value !== 'string' || value.trim().length === 0) {
    return '';
  }

  const firstEntry = value.split(',')[0] || '';
  const locale = firstEntry.split(';')[0] || '';
  return locale.trim();
};

const createRequestContext = (body, req) => {
  const normalized = normalizeProxyRequest(body);

  if (normalized.error) {
    return normalized;
  }

  const crisisContext = resolveCrisisRoutingContext({
    locale: normalized.request.safetyLocale || extractPreferredLocaleFromRequest(req),
    countryCode: normalized.request.safetyCountry,
  });
  const safetyAssessment = assessMessageSafety(normalized.request.messages, { crisisContext });

  return {
    request: normalized.request,
    messages: safetyAssessment.sanitizedMessages,
    safety: safetyAssessment.safety,
    crisisContext,
  };
};

const enforceProxyPolicies = async (req, res, requestBody) => {
  const authResult = await verifyRequestAuth(req);

  if (!authResult.allowed) {
    writeJson(res, authResult.status || 401, createProxyErrorBody(authResult.message), req);
    return null;
  }

  let rateLimit;

  try {
    rateLimit = await enforceRateLimit(buildRateLimitKey(req, requestBody.request, authResult));
  } catch (error) {
    writeJson(
      res,
      503,
      createProxyErrorBody(
        error instanceof Error
          ? error.message
          : 'Rate-limit system is unavailable. Please try again shortly.',
      ),
      req,
    );
    return null;
  }

  if (!rateLimit.allowed) {
    writeJson(
      res,
      429,
      createProxyErrorBody(`Rate limit exceeded. Retry in ${rateLimit.retryAfterSeconds} seconds.`),
      req,
    );
    return null;
  }

  return authResult;
};

const writeBlockedStreamEvents = (res, safety) => {
  writeSseEvent(res, { type: 'meta', safety });
  writeSseEvent(res, {
    content: safety.userFacingMessage || 'This request was blocked for safety reasons.',
  });
  writeSseEvent(res, {
    type: 'done',
    content: safety.userFacingMessage || 'This request was blocked for safety reasons.',
    safety,
  });
  writeSseDone(res);
};

const respondWithBlockedStream = (req, res, safety) => {
  writeSseHeaders(res, req);
  writeBlockedStreamEvents(res, safety);
};

const proxyChat = async (req, res, requestBody) => {
  const authContext = await enforceProxyPolicies(req, res, requestBody);
  if (!authContext) {
    return;
  }

  let requestSafety = requestBody.safety;

  if (requestSafety.blocked) {
    emitAuditLog({
      route: '/ai/chat',
      safetyIdentifier: requestBody.request.safetyIdentifier || 'anonymous',
      safety: requestSafety,
      providerCalled: false,
      authMode: authContext.mode,
    });

    writeJson(
      res,
      200,
      {
        content: requestSafety.userFacingMessage || 'This request was blocked for safety reasons.',
        safety: requestSafety,
        metadata: createMetadata(requestBody, 'local-guardrail'),
      },
      req,
    );
    return;
  }

  const semanticInputSafety = await resolveSemanticInputSafety(
    requestBody.messages,
    requestBody.crisisContext,
  );
  requestSafety = mergeSafetyResults(requestSafety, semanticInputSafety);

  if (requestSafety.blocked) {
    emitAuditLog({
      route: '/ai/chat',
      safetyIdentifier: requestBody.request.safetyIdentifier || 'anonymous',
      safety: requestSafety,
      providerCalled: false,
      authMode: authContext.mode,
      uid: authContext.user ? authContext.user.uid : undefined,
    });

    writeJson(
      res,
      200,
      {
        content: requestSafety.userFacingMessage || 'This request was blocked for safety reasons.',
        safety: requestSafety,
        metadata: createMetadata(requestBody, 'local-guardrail'),
      },
      req,
    );
    return;
  }

  let providerResponse;

  try {
    providerResponse = await callOpenAI(requestBody, false);
  } catch (error) {
    // Log provider detail server-side; return a generic message to the client.
    console.error(
      '[ai-proxy] provider request failed:',
      error instanceof Error ? error.message : error,
    );
    writeJson(res, 503, createProxyErrorBody('AI provider request failed.', requestSafety), req);
    return;
  }

  if (!providerResponse.ok) {
    const errorPayload = await providerResponse.json().catch(() => ({}));
    console.error(
      '[ai-proxy] provider returned error status',
      providerResponse.status,
      errorPayload && errorPayload.error ? errorPayload.error.message : '',
    );
    writeJson(
      res,
      providerResponse.status,
      createProxyErrorBody(
        `AI provider request failed with status ${providerResponse.status}.`,
        requestSafety,
      ),
      req,
    );
    return;
  }

  const data = await providerResponse.json();
  const content = parseOpenAIContent(data);
  const outputAssessment = assessAssistantOutputSafety(content, {
    crisisContext: requestBody.crisisContext,
  });
  const heuristicSafety = mergeSafetyResults(requestSafety, outputAssessment.safety);
  const semanticSafety = await resolveSemanticOutputSafety(content, requestBody.crisisContext);
  const responseSafety = mergeSafetyResults(heuristicSafety, semanticSafety);
  const safeContent =
    responseSafety.blocked && responseSafety.userFacingMessage
      ? responseSafety.userFacingMessage
      : content;

  emitAuditLog({
    route: '/ai/chat',
    safetyIdentifier: requestBody.request.safetyIdentifier || 'anonymous',
    safety: responseSafety,
    providerCalled: true,
    outputBlocked: responseSafety.blocked,
    model: requestBody.request.model,
    authMode: authContext.mode,
    uid: authContext.user ? authContext.user.uid : undefined,
  });

  writeJson(
    res,
    200,
    {
      content: safeContent,
      safety: responseSafety,
      metadata: createMetadata(requestBody, 'openai'),
    },
    req,
  );
};

const proxyChatStream = async (req, res, requestBody) => {
  const authContext = await enforceProxyPolicies(req, res, requestBody);
  if (!authContext) {
    return;
  }

  let requestSafety = requestBody.safety;

  if (requestSafety.blocked) {
    emitAuditLog({
      route: '/ai/chat/stream',
      safetyIdentifier: requestBody.request.safetyIdentifier || 'anonymous',
      safety: requestSafety,
      providerCalled: false,
      authMode: authContext.mode,
    });

    respondWithBlockedStream(req, res, requestSafety);
    return;
  }

  const semanticInputSafety = await resolveSemanticInputSafety(
    requestBody.messages,
    requestBody.crisisContext,
  );
  requestSafety = mergeSafetyResults(requestSafety, semanticInputSafety);

  if (requestSafety.blocked) {
    emitAuditLog({
      route: '/ai/chat/stream',
      safetyIdentifier: requestBody.request.safetyIdentifier || 'anonymous',
      safety: requestSafety,
      providerCalled: false,
      authMode: authContext.mode,
      uid: authContext.user ? authContext.user.uid : undefined,
    });

    respondWithBlockedStream(req, res, requestSafety);
    return;
  }

  let providerResponse;

  try {
    providerResponse = await callOpenAI(requestBody, true);
  } catch (error) {
    // Log provider detail server-side; return a generic message to the client.
    console.error(
      '[ai-proxy] provider request failed:',
      error instanceof Error ? error.message : error,
    );
    writeJson(res, 503, createProxyErrorBody('AI provider request failed.', requestSafety), req);
    return;
  }

  if (!providerResponse.ok || !providerResponse.body) {
    const errorPayload = await providerResponse.json().catch(() => ({}));
    console.error(
      '[ai-proxy] provider stream error status',
      providerResponse.status,
      errorPayload && errorPayload.error ? errorPayload.error.message : '',
    );
    writeJson(
      res,
      providerResponse.status || 502,
      createProxyErrorBody(
        `AI provider stream failed with status ${providerResponse.status}.`,
        requestSafety,
      ),
      req,
    );
    return;
  }

  emitAuditLog({
    route: '/ai/chat/stream',
    safetyIdentifier: requestBody.request.safetyIdentifier || 'anonymous',
    safety: requestSafety,
    providerCalled: true,
    model: requestBody.request.model,
    authMode: authContext.mode,
    uid: authContext.user ? authContext.user.uid : undefined,
  });

  writeSseHeaders(res, req);
  writeSseEvent(res, { type: 'meta', safety: requestSafety });
  const outputGate = createStreamOutputGate(requestSafety, requestBody.crisisContext);
  const semanticGate = createSemanticModerationGate((content) =>
    resolveSemanticOutputSafety(content, requestBody.crisisContext),
  );

  try {
    await streamOpenAIResponse(
      providerResponse,
      async (token) => {
        const gateResult = outputGate.push(token);

        if (gateResult.blocked) {
          throw createStreamOutputBlockedError(gateResult.safety);
        }

        if (gateResult.chunk) {
          const semanticSafety = await semanticGate.evaluate(gateResult.content);
          const effectiveSafety = mergeSafetyResults(requestSafety, semanticSafety);

          if (effectiveSafety.blocked) {
            throw createStreamOutputBlockedError(effectiveSafety);
          }

          writeSseEvent(res, { content: gateResult.chunk });
        }
      },
      () => {
        writeSseEvent(res, {
          type: 'error',
          error: 'Malformed provider stream chunk.',
          safety: requestSafety,
        });
      },
    );
  } catch (error) {
    if (error && error.code === 'STREAM_OUTPUT_BLOCKED') {
      const blockedSafety = mergeSafetyResults(requestSafety, error.safety || buildSafetyResult());

      emitAuditLog({
        route: '/ai/chat/stream',
        safetyIdentifier: requestBody.request.safetyIdentifier || 'anonymous',
        safety: blockedSafety,
        providerCalled: true,
        outputBlocked: true,
        model: requestBody.request.model,
        authMode: authContext.mode,
        uid: authContext.user ? authContext.user.uid : undefined,
      });

      writeBlockedStreamEvents(res, blockedSafety);
      return;
    }

    writeSseEvent(res, {
      type: 'error',
      error: error instanceof Error ? error.message : 'AI provider stream interrupted.',
      safety: requestSafety,
    });
    writeSseDone(res);
    return;
  }

  const flushResult = outputGate.flush();
  const semanticSafety = await semanticGate.evaluate(flushResult.content, { force: true });
  const finalSafety = mergeSafetyResults(flushResult.safety, semanticSafety);

  if (flushResult.blocked || finalSafety.blocked) {
    const blockedSafety = flushResult.blocked ? flushResult.safety : finalSafety;

    emitAuditLog({
      route: '/ai/chat/stream',
      safetyIdentifier: requestBody.request.safetyIdentifier || 'anonymous',
      safety: blockedSafety,
      providerCalled: true,
      outputBlocked: true,
      model: requestBody.request.model,
      authMode: authContext.mode,
      uid: authContext.user ? authContext.user.uid : undefined,
    });

    writeBlockedStreamEvents(res, blockedSafety);
    return;
  }

  if (flushResult.chunk) {
    writeSseEvent(res, { content: flushResult.chunk });
  }

  writeSseEvent(res, {
    type: 'done',
    content: flushResult.content,
    safety: finalSafety,
  });
  writeSseDone(res);
};

const requestHandler = async (req, res) => {
  if (!isCorsOriginAllowed(req)) {
    writeJson(res, 403, createProxyErrorBody('CORS origin not allowed.'), req);
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    writeJson(
      res,
      200,
      {
        ok: true,
        auth: {
          required: shouldRequireAuth(),
          verification: shouldVerifyFirebaseTokens() ? 'firebase' : 'header-only',
        },
      },
      req,
    );
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, getResponseHeaders(req));
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    writeJson(res, 405, createProxyErrorBody('Method not allowed.'), req);
    return;
  }

  const isChatRoute = req.url === '/ai/chat';
  const isStreamRoute = req.url === '/ai/chat/stream';

  if (!isChatRoute && !isStreamRoute) {
    writeJson(res, 404, createProxyErrorBody('Route not found.'), req);
    return;
  }

  let body;

  try {
    body = await readJsonBody(req);
  } catch (error) {
    writeJson(
      res,
      400,
      createProxyErrorBody(error instanceof Error ? error.message : 'Invalid request body.'),
      req,
    );
    return;
  }

  const context = createRequestContext(body, req);

  if (context.error) {
    writeJson(res, 400, createProxyErrorBody(context.error), req);
    return;
  }

  if (isChatRoute) {
    await proxyChat(req, res, context);
    return;
  }

  await proxyChatStream(req, res, context);
};

const createServer = () =>
  http.createServer((req, res) => {
    requestHandler(req, res).catch((error) => {
      // Log the detail server-side; return a fixed generic message to the client.
      console.error(
        '[ai-proxy] unhandled request error:',
        error instanceof Error ? error.message : error,
      );
      writeJson(
        res,
        500,
        createProxyErrorBody('Internal AI proxy error.', buildSafetyResult()),
        req,
      );
    });
  });

const startServer = () => {
  const validation = validateRuntimeConfiguration();

  if (validation.errors.length > 0) {
    throw new Error(`AI proxy configuration error: ${validation.errors.join(' ')}`);
  }

  validation.warnings.forEach((warning) => {
    process.stdout.write(`[ai-proxy] Warning: ${warning}\n`);
  });

  const server = createServer();
  const port = getProxyPort();

  server.listen(port, () => {
    process.stdout.write(`AI proxy listening on http://localhost:${port}\n`);
  });

  return server;
};

module.exports = {
  assessAssistantOutputSafety,
  assessMessageSafety,
  buildSemanticModerationSafety,
  buildSafetyResult,
  createSemanticModerationGate,
  createStreamOutputGate,
  createRequestContext,
  createServer,
  mergeSafetyResults,
  normalizeProxyRequest,
  redactSensitiveText,
  resolveSemanticInputSafety,
  resolveSemanticContentSafety,
  resolveSemanticOutputSafety,
  requestHandler,
  startServer,
};
