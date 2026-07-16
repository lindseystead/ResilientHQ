/**
 * Protected Screen Component
 *
 * Screen wrapper that extends ScreenLayout.
 * Combines:
 * - AuthGuard (authentication protection)
 * - ScreenLayout (unified layout system)
 * - ScreenHeader (standardized header)
 * - Screen announcements (accessibility)
 * - Haptic feedback integration
 *
 * IMPORTANT: This component extends ScreenLayout, never overrides it.
 * It does NOT nest ScrollViews or create custom scroll implementations.
 */

import React, { ReactNode, useEffect } from 'react';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { announceScreenChange } from '@/src/shared/utils/accessibility';
import { AuthGuard, AuthGuardProps } from './navigation/AuthGuard';
import ScreenLayout, { ScreenLayoutProps } from './layout/ScreenLayout';
import ScreenHeader, { ScreenHeaderProps } from './layout/ScreenHeader';

export interface ProtectedScreenProps
  extends
    Omit<ScreenLayoutProps, 'children' | 'header'>,
    Pick<AuthGuardProps, 'screenTitle' | 'message' | 'fallback'> {
  /**
   * Screen content
   */
  children: ReactNode;
  /**
   * Screen title for header
   */
  title: string;
  /**
   * Screen subtitle (optional)
   */
  subtitle?: string;
  /**
   * Whether to require authentication (default: true)
   */
  requireAuth?: boolean;
  /**
   * Whether to show screen header (default: true)
   */
  showHeader?: boolean;
  /**
   * Screen header props
   */
  headerProps?: Omit<ScreenHeaderProps, 'title' | 'subtitle'>;
  /**
   * Whether to announce screen change for accessibility (default: true)
   */
  announceScreen?: boolean;
  /**
   * Custom announcement text (defaults to title)
   */
  announcementText?: string;
  /**
   * Whether to provide haptic feedback on mount (default: false)
   */
  hapticOnMount?: boolean;
  /**
   * Haptic feedback type on mount (default: 'light')
   */
  hapticType?: 'light' | 'medium' | 'heavy';
}

/**
 * ProtectedScreen Component
 *
 * All-in-one screen wrapper that extends ScreenLayout.
 * Use this for all protected screens that need auth + layout + header.
 *
 * For screens with custom scroll (Chatbot, Journal, Community, Profile):
 * - Set scroll={false} on ProtectedScreen
 * - Implement your own ScrollView/FlatList inside children
 * - Do NOT nest ScrollViews
 */
export const ProtectedScreen: React.FC<ProtectedScreenProps> = ({
  children,
  title,
  subtitle,
  requireAuth = true,
  showHeader = true,
  headerProps,
  announceScreen = true,
  announcementText,
  hapticOnMount = false,
  hapticType = 'light',
  screenTitle,
  message,
  fallback,
  ...screenLayoutProps
}) => {
  const { impact } = useHaptics();

  // Screen announcement for accessibility
  useEffect(() => {
    if (announceScreen) {
      announceScreenChange(announcementText || title);
    }
  }, [announceScreen, announcementText, title]);

  // Haptic feedback on mount
  useEffect(() => {
    if (hapticOnMount) {
      impact(hapticType);
    }
  }, [hapticOnMount, hapticType, impact]);

  // Create header component if needed
  const header = showHeader ? (
    <ScreenHeader title={title} subtitle={subtitle} {...headerProps} />
  ) : undefined;

  // Screen content using ScreenLayout (extends, never overrides)
  const screenContent = (
    <ScreenLayout {...screenLayoutProps} header={header}>
      {children}
    </ScreenLayout>
  );

  // If auth is required, wrap with AuthGuard
  if (requireAuth) {
    return (
      <AuthGuard
        screenTitle={screenTitle || title}
        message={message}
        showHeader={showHeader}
        fallback={fallback}
      >
        {screenContent}
      </AuthGuard>
    );
  }

  // If no auth required, return content directly
  return screenContent;
};
