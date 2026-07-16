import type React from 'react';
import { loadOptionalModule } from '@/src/shared/utils/runtime/optionalModule';

export interface ScreenCaptureModule {
  preventScreenCaptureAsync: () => Promise<void>;
  allowScreenCaptureAsync: () => Promise<void>;
  addScreenshotListener: (callback: () => void) => { remove: () => void };
}

interface BlurModule {
  BlurView?: React.ComponentType<{
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    style?: object;
  }>;
}

const screenCapture = loadOptionalModule<ScreenCaptureModule>('expo-screen-capture');
const blurModule = loadOptionalModule<BlurModule>('expo-blur');

export const securityOptionalModules = {
  screenCapture,
  BlurView: blurModule?.BlurView ?? null,
};
