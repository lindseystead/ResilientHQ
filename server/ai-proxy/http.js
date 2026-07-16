'use strict';

const { DEFAULT_MAX_BODY_BYTES, getAllowedOrigins } = require('./config');

const BASE_RESPONSE_HEADERS = {
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '600',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

const getRequestOrigin = (req) =>
  typeof req.headers.origin === 'string' && req.headers.origin.trim().length > 0
    ? req.headers.origin.trim()
    : null;

const isSecureRequest = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];

  if (typeof forwardedProto === 'string') {
    return forwardedProto.split(',')[0].trim().toLowerCase() === 'https';
  }

  return Boolean(req.socket && req.socket.encrypted);
};

const isCorsOriginAllowed = (req) => {
  const origin = getRequestOrigin(req);

  if (!origin) {
    // Native clients generally do not send Origin headers.
    return true;
  }

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
};

const getResponseHeaders = (req) => {
  const origin = getRequestOrigin(req);
  const allowedOrigins = getAllowedOrigins();
  const allowedOrigin =
    origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) ? origin : null;
  const strictTransportSecurity = isSecureRequest(req)
    ? {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      }
    : {};

  return {
    ...BASE_RESPONSE_HEADERS,
    ...strictTransportSecurity,
    ...(allowedOrigin
      ? {
          'Access-Control-Allow-Origin': allowedOrigin,
          Vary: 'Origin',
        }
      : {}),
  };
};

const readJsonBody = (req, maxBytes = DEFAULT_MAX_BODY_BYTES) =>
  new Promise((resolve, reject) => {
    let body = '';

    req.setEncoding('utf8');

    req.on('data', (chunk) => {
      body += chunk;

      if (body.length > maxBytes) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });

    req.on('error', reject);
  });

const writeJson = (res, statusCode, payload, req) => {
  const body = JSON.stringify(payload);

  res.writeHead(statusCode, {
    ...getResponseHeaders(req),
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
};

const writeSseHeaders = (res, req) => {
  res.writeHead(200, {
    ...getResponseHeaders(req),
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });
};

const writeSseEvent = (res, payload) => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const writeSseDone = (res) => {
  res.write('data: [DONE]\n\n');
  res.end();
};

module.exports = {
  getResponseHeaders,
  isCorsOriginAllowed,
  readJsonBody,
  writeJson,
  writeSseDone,
  writeSseEvent,
  writeSseHeaders,
};
