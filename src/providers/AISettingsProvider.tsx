/**
 * AI Settings Provider
 *
 * Manages AI personalization settings:
 * - AI tone (supportive, direct, professional, coaching)
 * - Response length (short, medium, long)
 * - Journaling prompts enabled/disabled
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { AISettings } from '@/src/types/settings';
import { UserPreferencesStorage } from '@/src/shared/utils/storage/userPreferences';

interface AISettingsContextType {
  settings: AISettings;
  isLoading: boolean;
  updateSettings: (updates: Partial<AISettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const AISettingsContext = createContext<AISettingsContextType | undefined>(undefined);

export function AISettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AISettings>({
    tone: 'supportive',
    responseLength: 'medium',
    journalingPromptsEnabled: true,
    chatMemoryEnabledByDefault: true,
    promptSuggestionsEnabledByDefault: true,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const appSettings = await UserPreferencesStorage.loadSettings();
      setSettings(appSettings.ai);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = useCallback(
    async (updates: Partial<AISettings>) => {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await UserPreferencesStorage.updateSettings({ ai: newSettings });
    },
    [settings],
  );

  const resetToDefaults = useCallback(async () => {
    const defaultSettings: AISettings = {
      tone: 'supportive',
      responseLength: 'medium',
      journalingPromptsEnabled: true,
      chatMemoryEnabledByDefault: true,
      promptSuggestionsEnabledByDefault: true,
    };
    setSettings(defaultSettings);
    await UserPreferencesStorage.updateSettings({ ai: defaultSettings });
  }, []);

  const value: AISettingsContextType = {
    settings,
    isLoading,
    updateSettings,
    resetToDefaults,
  };

  return <AISettingsContext.Provider value={value}>{children}</AISettingsContext.Provider>;
}

export function useAISettings(): AISettingsContextType {
  const context = useContext(AISettingsContext);
  if (!context) {
    throw new Error('useAISettings must be used within AISettingsProvider');
  }
  return context;
}
