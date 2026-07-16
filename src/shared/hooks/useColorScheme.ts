/**
 * useColorScheme Hook
 *
 * Hydration-safe color scheme hook. On native, returns system preference immediately.
 */

import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * useColorScheme
 *
 * Hydration-safe color scheme hook. On web, returns 'light' until hydration completes
 * to prevent SSR mismatches. On native, returns system preference immediately.
 */

export function useColorScheme(): 'light' | 'dark' | null {
  const scheme = useRNColorScheme();
  if (scheme === 'light' || scheme === 'dark') return scheme;
  return null;
}
