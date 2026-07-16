/**
 * App Security Provider
 *
 * Manages security-related settings and functionality:
 * - Biometric authentication
 * - Screenshot prevention
 * - Screen blur on background
 * - Authentication requirements
 */

import { useAuth } from '@/src/providers/AuthProvider';
import { BiometricService } from '@/src/services/security/biometric';
import {
  useScreenBlur,
  useScreenshotPrevention,
  getSecurityCapabilities,
} from '@/src/services/security/screenshot';
import { SecuritySettings } from '@/src/types/settings';
import { UserPreferencesStorage } from '@/src/shared/utils/storage/userPreferences';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, View } from 'react-native';

interface SecurityCapabilities {
  biometricAvailable: boolean;
  screenshotPreventionAvailable: boolean;
  screenBlurAvailable: boolean;
}

interface AppSecurityContextType {
  settings: SecuritySettings;
  updateSettings: (updates: Partial<SecuritySettings>) => Promise<void>;
  isBiometricAvailable: boolean;
  capabilities: SecurityCapabilities;
  checkBiometricAvailability: () => Promise<void>;
  authenticateWithBiometric: (reason?: string) => Promise<boolean>;
}

const AppSecurityContext = createContext<AppSecurityContextType | undefined>(undefined);

export function AppSecurityProvider({ children }: { children: ReactNode }) {
  const { signOut, isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<SecuritySettings>({
    biometricEnabled: false,
    requireAuthOnOpen: false,
    blurScreenOnBackground: false,
    preventScreenshots: false,
  });
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [capabilities, setCapabilities] = useState<SecurityCapabilities>({
    biometricAvailable: false,
    screenshotPreventionAvailable: false,
    screenBlurAvailable: false,
  });
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const authInProgressRef = useRef(false);

  const checkBiometricAvailability = useCallback(async () => {
    const available = await BiometricService.isAvailable();
    setIsBiometricAvailable(available);
    setCapabilities((prev) => ({ ...prev, biometricAvailable: available }));
  }, []);

  // Check security capabilities on mount
  useEffect(() => {
    const securityCaps = getSecurityCapabilities();
    setCapabilities((prev) => ({
      ...prev,
      screenshotPreventionAvailable: securityCaps.screenshotPreventionAvailable,
      screenBlurAvailable: securityCaps.screenBlurAvailable,
    }));
  }, []);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    checkBiometricAvailability();
  }, [checkBiometricAvailability]);

  // Apply screenshot prevention
  const { isAvailable: screenshotPrevAvailable } = useScreenshotPrevention(
    settings.preventScreenshots,
  );

  // Apply screen blur
  const { BlurOverlay, isAvailable: blurAvailable } = useScreenBlur(
    settings.blurScreenOnBackground,
  );

  // Update capabilities when hooks report availability
  useEffect(() => {
    setCapabilities((prev) => ({
      ...prev,
      screenshotPreventionAvailable: screenshotPrevAvailable,
      screenBlurAvailable: blurAvailable,
    }));
  }, [screenshotPrevAvailable, blurAvailable]);

  const loadSettings = async () => {
    const appSettings = await UserPreferencesStorage.loadSettings();
    setSettings(appSettings.security);
  };

  const updateSettings = useCallback(
    async (updates: Partial<SecuritySettings>) => {
      const merged = { ...settings, ...updates };
      const newSettings = merged.biometricEnabled
        ? merged
        : { ...merged, requireAuthOnOpen: false };
      setSettings(newSettings);
      await UserPreferencesStorage.updateSettings({ security: newSettings });
    },
    [settings],
  );

  const authenticateWithBiometric = useCallback(
    async (reason?: string): Promise<boolean> => {
      if (!settings.biometricEnabled) {
        return false;
      }

      const result = await BiometricService.authenticate(reason);
      return result.success;
    },
    [settings.biometricEnabled],
  );

  useEffect(() => {
    if (!settings.requireAuthOnOpen || !settings.biometricEnabled || !isBiometricAvailable) {
      return;
    }

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextAppState;

      if (!wasBackground || nextAppState !== 'active') return;
      if (!isAuthenticated || authInProgressRef.current) return;

      authInProgressRef.current = true;
      const success = await authenticateWithBiometric('Unlock ResilientHQ');
      authInProgressRef.current = false;

      if (!success) {
        await signOut();
      }
    });

    return () => subscription.remove();
  }, [
    authenticateWithBiometric,
    isAuthenticated,
    isBiometricAvailable,
    settings.biometricEnabled,
    settings.requireAuthOnOpen,
    signOut,
  ]);

  const value: AppSecurityContextType = {
    settings,
    updateSettings,
    isBiometricAvailable,
    capabilities,
    checkBiometricAvailability,
    authenticateWithBiometric,
  };

  return (
    <AppSecurityContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {/* Render blur overlay when app is in background */}
        <BlurOverlay />
      </View>
    </AppSecurityContext.Provider>
  );
}

export function useAppSecurity(): AppSecurityContextType {
  const context = useContext(AppSecurityContext);
  if (!context) {
    throw new Error('useAppSecurity must be used within AppSecurityProvider');
  }
  return context;
}
