import { useCallback, useEffect, useRef, useState } from 'react';

interface UseChatSessionPreferencesOptions {
  user: { uid: string } | null;
  isAISettingsLoading: boolean;
  chatMemoryEnabledByDefault: boolean;
  promptSuggestionsEnabledByDefault: boolean;
  privateSessionRequested: boolean;
  memoryEnabled: boolean;
  loadHistory: () => Promise<void>;
  setMemoryEnabled: (nextValue: boolean, options?: { announce?: boolean }) => void;
}

export const useChatSessionPreferences = ({
  user,
  isAISettingsLoading,
  chatMemoryEnabledByDefault,
  promptSuggestionsEnabledByDefault,
  privateSessionRequested,
  memoryEnabled,
  loadHistory,
  setMemoryEnabled,
}: UseChatSessionPreferencesOptions) => {
  const [promptsPaused, setPromptsPaused] = useState<boolean>(
    () => !promptSuggestionsEnabledByDefault,
  );
  const [hasCustomizedSessionPrivacy, setHasCustomizedSessionPrivacy] = useState(false);
  const hasLoadedHistoryRef = useRef(false);

  useEffect(() => {
    if (!isAISettingsLoading && !hasLoadedHistoryRef.current && user && memoryEnabled) {
      hasLoadedHistoryRef.current = true;
      void loadHistory();
    }
  }, [isAISettingsLoading, loadHistory, memoryEnabled, user]);

  useEffect(() => {
    if (!user) {
      hasLoadedHistoryRef.current = false;
      setHasCustomizedSessionPrivacy(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAISettingsLoading || hasCustomizedSessionPrivacy) {
      return;
    }

    setPromptsPaused(!promptSuggestionsEnabledByDefault);
    setMemoryEnabled(chatMemoryEnabledByDefault, { announce: false });
  }, [
    chatMemoryEnabledByDefault,
    hasCustomizedSessionPrivacy,
    isAISettingsLoading,
    promptSuggestionsEnabledByDefault,
    setMemoryEnabled,
  ]);

  useEffect(() => {
    if (!privateSessionRequested) {
      return;
    }

    setHasCustomizedSessionPrivacy(true);
    setPromptsPaused(true);
    setMemoryEnabled(false, { announce: false });
  }, [privateSessionRequested, setMemoryEnabled]);

  const markSessionCustomized = useCallback(() => {
    setHasCustomizedSessionPrivacy(true);
  }, []);

  const resetHistoryLoadState = useCallback(() => {
    hasLoadedHistoryRef.current = false;
  }, []);

  return {
    promptsPaused,
    setPromptsPaused,
    hasCustomizedSessionPrivacy,
    markSessionCustomized,
    resetHistoryLoadState,
  };
};
