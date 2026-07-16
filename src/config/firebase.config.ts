/**
 * Firebase Configuration
 *
 * Fully safe initialization for Expo (iOS/Android/Web).
 * Prevents partial initialization, missing env crashes,
 * and ensures correct React Native Auth persistence.
 */

import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

import { logger } from '@/src/shared/utils/debug';
import { appEnv, firebaseEnv, getMissingEnvVars, isFirebaseConfigured } from './env';

// -------------------------------
// Firebase Config Object
// -------------------------------
export const firebaseConfig = {
  apiKey: firebaseEnv.apiKey,
  authDomain: firebaseEnv.authDomain,
  projectId: firebaseEnv.projectId,
  storageBucket: firebaseEnv.storageBucket,
  messagingSenderId: firebaseEnv.messagingSenderId,
  appId: firebaseEnv.appId,
} as const;

// -------------------------------
// Validate Environment Config
// -------------------------------
if (!isFirebaseConfigured()) {
  const missing = getMissingEnvVars();
  const message = `Firebase configuration is missing. Update .env: ${missing.join(', ')}`;
  if (appEnv.environment === 'production') {
    throw new Error(message);
  }
  logger.error('Firebase configuration missing', new Error(message), { missing });
}

// -------------------------------
// Initialize Firebase App
// -------------------------------
let app: FirebaseApp | null = null;

if (isFirebaseConfigured()) {
  if (getApps().length === 0) {
    try {
      app = initializeApp(firebaseConfig);
      logger.info('Firebase initialized successfully');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Firebase initialization failed', err);
      app = null;
    }
  } else {
    app = getApps()[0];
  }
}

// -------------------------------
// Initialize Firebase Auth
// -------------------------------
let auth: Auth | null = null;

if (app) {
  try {
    // getAuth automatically handles persistence in React Native
    auth = getAuth(app);
  } catch (error: unknown) {
    logger.error(
      'Firebase Auth initialization failed',
      error instanceof Error ? error : new Error(String(error)),
    );
    auth = null;
  }
}

// -------------------------------
// Firestore
// -------------------------------
let db: Firestore | null = null;

if (app) {
  try {
    db = getFirestore(app);
  } catch (error: unknown) {
    logger.error(
      'Firestore initialization failed',
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

// -------------------------------
// Storage
// -------------------------------
let storage: FirebaseStorage | null = null;

if (app) {
  try {
    storage = getStorage(app);
  } catch (error: unknown) {
    logger.error(
      'Firebase Storage initialization failed',
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

// -------------------------------
// Exports
// -------------------------------
export { app, auth, db, storage };
