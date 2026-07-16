/**
 * useColorScheme Hook (Web)
 *
 * Hydration-safe color scheme hook for web. Returns 'light' until hydration
 * completes to prevent SSR mismatches.
 */

import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * useColorScheme (Web)
 *
 * Hydration-safe color scheme hook for web. Returns 'light' until hydration completes
 * to prevent SSR mismatches, then returns the actual system preference.
 */

export function useColorScheme(): 'light' | 'dark' | null {
  const [hasHydrated, setHasHydrated] = useState(false);
  const colorScheme = useRNColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Return 'light' during SSR/hydration to prevent mismatches
  if (!hasHydrated) {
    return 'light';
  }

  if (colorScheme === 'light' || colorScheme === 'dark') return colorScheme;
  return null;
}
