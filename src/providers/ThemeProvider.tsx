/**
 * Theme Context
 *
 * Provides theme context to the entire application.
 * Uses system color scheme by default, allows manual override.
 */

import React, { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { lightTheme, darkTheme, Colors } from '@/src/config/theme';
import { useColorScheme } from '@/src/shared/hooks/useColorScheme';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: typeof lightTheme | typeof darkTheme;
  setTheme: (mode: ThemeMode | null) => void;
  colors: typeof lightTheme.colors | typeof darkTheme.colors;
  isDark: boolean;
  mode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [manualMode, setManualMode] = useState<ThemeMode | null>(null);

  // Use manual mode if set, otherwise use system preference, fallback to 'light'
  const currentMode: ThemeMode = manualMode ?? systemColorScheme ?? 'light';

  // Load theme using Colors[colorScheme] pattern
  const theme = currentMode === 'dark' ? darkTheme : lightTheme;
  const colors = Colors[currentMode];

  // Update theme based on mode
  const updateTheme = (mode: ThemeMode | null) => {
    setManualMode(mode);
  };

  const value: ThemeContextType = useMemo(
    () => ({
      theme,
      setTheme: updateTheme,
      colors,
      isDark: currentMode === 'dark',
      mode: currentMode,
    }),
    [theme, colors, currentMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
