/**
 * useTheme Hook Tests
 *
 * Tests for the theme hook that provides theme context and utilities.
 */

import { useTheme } from '@/src/shared/hooks/useTheme';
import { ThemeProvider } from '@/src/providers/ThemeProvider';
import { act, renderHook } from '@testing-library/react-native';
import React from 'react';

// Mock ThemeProvider context
const createWrapper = () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(ThemeProvider, null, children);
  };
  return Wrapper;
};

describe('useTheme', () => {
  it('should provide theme object', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: createWrapper(),
    });

    expect(result.current.theme).toBeDefined();
    expect(result.current.theme.colors).toBeDefined();
    expect(result.current.theme.spacing).toBeDefined();
    expect(result.current.theme.radius).toBeDefined();
  });

  it('should provide isDark boolean', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.isDark).toBe('boolean');
  });

  it('should provide setTheme function', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.setTheme).toBe('function');
  });

  it('should change theme when setTheme is called', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: createWrapper(),
    });

    const initialIsDark = result.current.isDark;

    act(() => {
      result.current.setTheme(initialIsDark ? 'light' : 'dark');
    });

    expect(result.current.isDark).toBe(!initialIsDark);
  });

  it('should provide consistent theme structure', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: createWrapper(),
    });

    const { theme } = result.current;

    // Verify theme structure
    expect(theme).toHaveProperty('colors');
    expect(theme).toHaveProperty('spacing');
    expect(theme).toHaveProperty('radius');
    expect(theme.colors).toHaveProperty('primary');
    expect(theme.colors).toHaveProperty('background');
    expect(theme.colors).toHaveProperty('text');
  });
});
