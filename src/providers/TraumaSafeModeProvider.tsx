/**
 * Trauma Safe Mode Provider
 *
 * Exposes a single persisted preference for calmer, more predictable app
 * behavior in sensitive emotional states.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { UserPreferencesStorage } from '@/src/shared/utils/storage/userPreferences';

interface TraumaSafeModeContextType {
  traumaSafeMode: boolean;
  updateTraumaSafeMode: (enabled: boolean, options?: { persist?: boolean }) => Promise<void>;
}

const TraumaSafeModeContext = createContext<TraumaSafeModeContextType | undefined>(undefined);

export function TraumaSafeModeProvider({ children }: { children: ReactNode }) {
  const [traumaSafeMode, setTraumaSafeMode] = useState<boolean>(false);

  const loadSetting = useCallback(async () => {
    const appSettings = await UserPreferencesStorage.loadSettings();
    setTraumaSafeMode(appSettings.appearance.traumaSafeMode);
  }, []);

  useEffect(() => {
    void loadSetting();
  }, [loadSetting]);

  const updateTraumaSafeMode = useCallback(
    async (enabled: boolean, options?: { persist?: boolean }) => {
      setTraumaSafeMode(enabled);
      if (options?.persist === false) {
        return;
      }

      await UserPreferencesStorage.updateSettings({
        appearance: {
          traumaSafeMode: enabled,
        },
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      traumaSafeMode,
      updateTraumaSafeMode,
    }),
    [traumaSafeMode, updateTraumaSafeMode],
  );

  return <TraumaSafeModeContext.Provider value={value}>{children}</TraumaSafeModeContext.Provider>;
}

export function useTraumaSafeMode(): TraumaSafeModeContextType {
  const context = useContext(TraumaSafeModeContext);

  if (!context) {
    throw new Error('useTraumaSafeMode must be used within a TraumaSafeModeProvider');
  }

  return context;
}
