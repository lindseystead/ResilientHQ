/**
 * App Entry Point
 *
 * Main application entry point using React Navigation.
 * Replaces Expo Router with a clean, professional navigation structure.
 * Preserves all existing providers, splash screen logic, and initialization.
 */

import * as SplashScreenNative from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary, SplashScreen } from '@/src/shared/ui';
import { lightTheme } from '@/src/config/theme';
import { initSentry } from '@/src/config/sentry.config';
import { RootNavigator } from '@/src/navigation/RootNavigator';
import { AISettingsProvider } from '@/src/providers/AISettingsProvider';
import { AppSecurityProvider } from '@/src/providers/AppSecurityProvider';
import { AuthProvider } from '@/src/providers/AuthProvider';
import { ThemeProvider } from '@/src/providers/ThemeProvider';
import { TraumaSafeModeProvider } from '@/src/providers/TraumaSafeModeProvider';
import { initAnalytics } from '@/src/shared/utils/analytics';
import { installFirestoreBlockedErrorSuppression } from '@/src/shared/utils/runtime/firestoreErrorSuppression';

// Initialize monitoring services
if (typeof window !== 'undefined' || Platform.OS !== 'web') {
  initSentry();
  initAnalytics();
}

// Prevent auto-hide on native only
if (Platform.OS !== 'web') {
  SplashScreenNative.preventAutoHideAsync();
}

// Splash duration constant
const SPLASH_DURATION = Platform.OS === 'web' ? 1000 : 3500;

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);

  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    installFirestoreBlockedErrorSuppression();
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise<void>((resolve) => setTimeout(resolve, 800));
      } finally {
        if (Platform.OS !== 'web') {
          await SplashScreenNative.hideAsync();
        }
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showSplash && (
        <View style={[styles.splashOverlay, { pointerEvents: 'none' }]}>
          {isWeb ? (
            <View style={styles.webSplash}>
              <ActivityIndicator size="large" color={lightTheme.colors.primary} />
              <Text style={styles.webSplashText}>Loading ResilientHQ...</Text>
            </View>
          ) : (
            <SplashScreen />
          )}
        </View>
      )}

      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              <TraumaSafeModeProvider>
                <AppSecurityProvider>
                  <AISettingsProvider>
                    <AppContent />
                  </AISettingsProvider>
                </AppSecurityProvider>
              </TraumaSafeModeProvider>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  splashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  webSplash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: lightTheme.colors.surface,
  },
  webSplashText: {
    marginTop: 12,
    fontSize: 16,
    color: lightTheme.colors.text2,
  },
});
