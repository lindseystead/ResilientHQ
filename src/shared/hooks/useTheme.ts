/**
 * Theme Hooks
 *
 * Re-exports theme-related hooks for convenient importing.
 * Provides access to color scheme and theme context throughout the app.
 *
 * Note: useTheme is exported from ThemeProvider to avoid require cycles.
 * Import directly from ThemeProvider if you need to avoid the re-export.
 */

export { useColorScheme } from './useColorScheme';
// Re-export useTheme from ThemeProvider (breaks cycle by not importing ThemeProvider here)
export { useTheme } from '@/src/providers/ThemeProvider';
