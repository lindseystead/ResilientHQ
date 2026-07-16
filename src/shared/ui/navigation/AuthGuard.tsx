/**
 * Auth Guard Component
 *
 * Wraps content and shows sign-in prompt if user is not authenticated.
 * Eliminates repeated authentication checks across screens.
 * Uses the shared app theme.
 */

import { ROUTES } from '@/src/config/navigation';
import { TEXT } from '@/src/config/text';
import { useTypedNavigation } from '@/src/shared/hooks/useTypedNavigation';
import { useAuth } from '@/src/providers/AuthProvider';
import React, { ReactNode } from 'react';
import { ScreenHeader, ScreenLayout } from '../layout';
import EmptyText from '../typography/EmptyText';
import { Button, Card } from '../components';

export interface AuthGuardProps {
  children: ReactNode;
  /**
   * Screen title for the sign-in prompt
   */
  screenTitle?: string;
  /**
   * Custom message to show when not authenticated
   */
  message?: string;
  /**
   * Whether to show the screen header in the sign-in prompt
   */
  showHeader?: boolean;
  /**
   * Custom fallback component to render when not authenticated
   */
  fallback?: ReactNode;
}

/**
 * AuthGuard Component
 *
 * Protects content behind authentication. Shows sign-in prompt if user is not authenticated.
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  screenTitle,
  message,
  showHeader = true,
  fallback,
}) => {
  const navigation = useTypedNavigation();
  const { isAuthenticated, user } = useAuth();

  // If authenticated, render children
  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default sign-in prompt
  return (
    <ScreenLayout>
      {showHeader && screenTitle && <ScreenHeader title={screenTitle} />}
      <Card>
        <EmptyText>{message || TEXT.pleaseSignInAction}</EmptyText>
        <Button
          title={TEXT.signIn}
          onPress={() => navigation.push(ROUTES.login)}
          variant="primary"
          fullWidth
          style={{ marginTop: 20 }}
        />
      </Card>
    </ScreenLayout>
  );
};
