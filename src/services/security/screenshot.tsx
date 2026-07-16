/**
 * Screenshot Prevention & Screen Blur Service
 *
 * Provides screenshot prevention and screen blur functionality for sensitive screens.
 * Uses react-native-screens for blur and FLAG_SECURE for screenshot prevention.
 *
 * Note: Full functionality requires these packages to be installed:
 * - expo-screen-capture (for screenshot prevention)
 * - expo-blur (for blur effect on background)
 */

import { logger } from '@/src/shared/utils/debug';
import { securityOptionalModules } from './securityOptionalModules';
import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus, Platform, View } from 'react-native';

const { screenCapture: ScreenCapture, BlurView } = securityOptionalModules;

if (!ScreenCapture) {
  logger.debug('expo-screen-capture not available - screenshot prevention disabled');
}

if (!BlurView) {
  logger.debug('expo-blur not available - screen blur disabled');
}

/**
 * Screenshot Prevention Hook
 *
 * Prevents screenshots when enabled. Works on both iOS and Android.
 * Requires expo-screen-capture to be installed.
 */
export const useScreenshotPrevention = (enabled: boolean = false) => {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    setIsAvailable(!!ScreenCapture);
  }, []);

  useEffect(() => {
    if (!enabled || !ScreenCapture) return;

    // Enable screenshot prevention
    const enablePrevention = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        logger.debug('Screenshot prevention enabled');
      } catch (error) {
        logger.error('Failed to enable screenshot prevention', error);
      }
    };

    enablePrevention();

    // Listen for screenshot attempts (optional notification)
    const subscription = ScreenCapture.addScreenshotListener(() => {
      logger.info('Screenshot attempt detected');
      // Could show a toast or notification here
    });

    return () => {
      // Disable screenshot prevention on cleanup
      ScreenCapture?.allowScreenCaptureAsync().catch(() => {
        // Silently fail cleanup
      });
      subscription?.remove();
    };
  }, [enabled]);

  return { isAvailable };
};

/**
 * Screen Blur on Background Hook
 *
 * Shows a blur overlay when app goes to background to protect sensitive content.
 * Returns blur visibility state and BlurOverlay component.
 */
export const useScreenBlur = (enabled: boolean = false) => {
  const [isBlurred, setIsBlurred] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    setIsAvailable(!!BlurView);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsBlurred(false);
      return;
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background - show blur
        setIsBlurred(true);
        logger.debug('App went to background - blur enabled');
      } else if (nextAppState === 'active' && appStateRef.current !== 'active') {
        // App came to foreground - hide blur after short delay
        // Delay helps prevent flash of content
        setTimeout(() => {
          setIsBlurred(false);
          logger.debug('App is active - blur removed');
        }, 100);
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [enabled]);

  // Blur Overlay component to be rendered at the root of the app
  const BlurOverlay = useCallback(() => {
    if (!isBlurred || !BlurView) {
      return null;
    }

    return (
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
        pointerEvents="none"
      >
        <BlurView
          intensity={100}
          tint="dark"
          style={{
            flex: 1,
          }}
        />
      </View>
    );
  }, [isBlurred]);

  return { isBlurred, isAvailable, BlurOverlay };
};

/**
 * Combined Security Hook
 *
 * Combines screenshot prevention and screen blur for convenience.
 */
export const useSecurityFeatures = (options: {
  preventScreenshots?: boolean;
  blurOnBackground?: boolean;
}) => {
  const { preventScreenshots = false, blurOnBackground = false } = options;

  const screenshotPrevention = useScreenshotPrevention(preventScreenshots);
  const screenBlur = useScreenBlur(blurOnBackground);

  return {
    screenshotPrevention: {
      enabled: preventScreenshots,
      isAvailable: screenshotPrevention.isAvailable,
    },
    screenBlur: {
      enabled: blurOnBackground,
      isAvailable: screenBlur.isAvailable,
      isBlurred: screenBlur.isBlurred,
      BlurOverlay: screenBlur.BlurOverlay,
    },
  };
};

/**
 * Check if security features are available
 */
export const getSecurityCapabilities = () => ({
  screenshotPreventionAvailable: !!ScreenCapture,
  screenBlurAvailable: !!BlurView,
  platform: Platform.OS,
});

export default {
  useScreenshotPrevention,
  useScreenBlur,
  useSecurityFeatures,
  getSecurityCapabilities,
};
