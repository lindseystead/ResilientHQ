/**
 * AI Proxy Auth Utilities
 *
 * Shared bearer token resolution for first-party AI proxy requests.
 */

import { auth } from '@/src/config/firebase.config';
import { logger } from '@/src/shared/utils/debug';

export const getAiProxyAuthToken = async (providedToken?: string): Promise<string | undefined> => {
  if (providedToken) {
    return providedToken;
  }

  const currentUser = auth?.currentUser;

  // No signed-in user (e.g. local development against an auth-disabled proxy):
  // send without a token and let the server decide.
  if (!currentUser) {
    return undefined;
  }

  try {
    const token = await currentUser.getIdToken();
    if (!token) {
      throw new Error('Empty authentication token.');
    }
    return token;
  } catch (error) {
    logger.debug('Unable to resolve AI proxy auth token', { error });
    // Fail closed: a signed-in user must present a valid token rather than
    // silently falling back to an unauthenticated request.
    throw new Error('Could not verify your session. Please sign in again.');
  }
};
