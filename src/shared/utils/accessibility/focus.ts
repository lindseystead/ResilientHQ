/**
 * Focus Management Utilities
 *
 * Provides focus management for accessibility.
 */

import { useEffect, useRef } from 'react';
import { AccessibilityInfo, findNodeHandle } from 'react-native';

type FocusableNode = Exclude<Parameters<typeof findNodeHandle>[0], number | null>;

/**
 * Focus Management Hook
 */
export const useFocusManagement = <T extends FocusableNode = FocusableNode>(
  autoFocus: boolean = false,
) => {
  const focusRef = useRef<T | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const focus = () => {
    if (focusRef.current) {
      const node = findNodeHandle(focusRef.current as Parameters<typeof findNodeHandle>[0]);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    }
  };

  useEffect(() => {
    if (autoFocus) {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      focusTimeoutRef.current = setTimeout(focus, 100);
    }
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [autoFocus]);

  return {
    focusRef,
    focus,
  };
};
