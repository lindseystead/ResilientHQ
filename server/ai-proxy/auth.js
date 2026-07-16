'use strict';

let verifierPromise;

const shouldRequireAuth = () => process.env.AI_PROXY_REQUIRE_AUTH === 'true';
const shouldVerifyFirebaseTokens = () => process.env.AI_PROXY_VERIFY_FIREBASE_TOKENS === 'true';

const getBearerToken = (req) => {
  const authorization = req.headers.authorization;

  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice(7).trim();
  return token || null;
};

const loadFirebaseVerifier = async () => {
  if (verifierPromise) {
    return verifierPromise;
  }

  verifierPromise = (async () => {
    try {
      const adminApp = await import('firebase-admin/app');
      const adminAuth = await import('firebase-admin/auth');

      const app = adminApp.getApps().length > 0 ? adminApp.getApps()[0] : adminApp.initializeApp();

      return adminAuth.getAuth(app);
    } catch {
      return null;
    }
  })();

  return verifierPromise;
};

const verifyRequestAuth = async (req) => {
  if (!shouldRequireAuth()) {
    return {
      allowed: true,
      mode: 'disabled',
      token: null,
      user: null,
    };
  }

  const token = getBearerToken(req);

  if (!token) {
    return {
      allowed: false,
      status: 401,
      message: 'Authorization is required.',
    };
  }

  if (!shouldVerifyFirebaseTokens()) {
    return {
      allowed: true,
      mode: 'header-only',
      token,
      user: null,
    };
  }

  const verifier = await loadFirebaseVerifier();

  if (!verifier) {
    return {
      allowed: false,
      status: 503,
      message:
        'Firebase token verification is enabled, but firebase-admin is not installed or configured.',
    };
  }

  try {
    const decoded = await verifier.verifyIdToken(token, true);

    return {
      allowed: true,
      mode: 'verified',
      token,
      user: {
        uid: decoded.uid,
        email: decoded.email || null,
      },
    };
  } catch {
    return {
      allowed: false,
      status: 401,
      message: 'Invalid or expired authorization token.',
    };
  }
};

module.exports = {
  getBearerToken,
  loadFirebaseVerifier,
  shouldRequireAuth,
  shouldVerifyFirebaseTokens,
  verifyRequestAuth,
};
