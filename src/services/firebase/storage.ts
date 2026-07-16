/**
 * Firebase Storage Service
 *
 * Uploads user assets and returns public URLs.
 */

import { storage } from '@/src/config/firebase.config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const AVATAR_FOLDER = 'users';

export const uploadUserAvatar = async (userId: string, uri: string): Promise<string> => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  const response = await fetch(uri);
  const blob = await response.blob();
  const filename = `${AVATAR_FOLDER}/${userId}/avatar-${Date.now()}`;
  const avatarRef = ref(storage, filename);

  try {
    await uploadBytes(avatarRef, blob, {
      contentType: blob.type || 'image/jpeg',
    });
    return await getDownloadURL(avatarRef);
  } finally {
    if ('close' in blob && typeof (blob as { close?: () => void }).close === 'function') {
      (blob as { close: () => void }).close();
    }
  }
};
