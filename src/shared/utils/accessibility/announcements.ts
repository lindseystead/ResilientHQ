/**
 * Accessibility Announcements
 *
 * Provides screen reader announcements for dynamic content changes.
 */

import { AccessibilityInfo } from 'react-native';

/**
 * Announce to screen reader
 */
export const announce = (message: string): void => {
  // Check if AccessibilityInfo and the method exist before calling
  if (!AccessibilityInfo || typeof AccessibilityInfo.announceForAccessibility !== 'function') {
    return; // Silently return if not available
  }

  try {
    AccessibilityInfo.announceForAccessibility(message);
  } catch {
    // Silently fail - no error handling to avoid any toast/console output
  }
};

/**
 * Announce screen change
 */
export const announceScreenChange = (screenName: string): void => {
  announce(`${screenName} screen`);
};
