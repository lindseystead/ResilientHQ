/**
 * Error Boundary Component
 *
 * Catches React component errors and reports them to Sentry.
 * Provides a fallback UI for users when errors occur.
 */

import { useTheme } from '@/src/providers/ThemeProvider';
import { getSentryClient } from '@/src/services/observability/sentryAdapter';
import { logger } from '@/src/shared/utils/debug';
import { useResponsive } from '@/src/shared/utils/responsive';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Sentry = getSentryClient();

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to Sentry if available
    if (Sentry) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          errorBoundary: true,
        },
      });
    }

    logger.error('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const { theme } = useTheme();
  const { scaleSpacing, scaleFont } = useResponsive();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          padding: scaleSpacing(theme.spacing.xl),
        },
      ]}
    >
      <View
        style={[
          styles.content,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: scaleSpacing(theme.radius.lg),
            padding: scaleSpacing(theme.spacing.xl),
          },
        ]}
      >
        <Text
          style={[
            styles.title,
            {
              color: theme.colors.text,
              fontSize: scaleFont(24),
              marginBottom: scaleSpacing(theme.spacing.md),
            },
          ]}
        >
          Something went wrong
        </Text>
        <Text
          style={[
            styles.message,
            {
              color: theme.colors.text2,
              fontSize: scaleFont(16),
              marginBottom: scaleSpacing(theme.spacing.xl),
            },
          ]}
        >
          We&apos;re sorry for the inconvenience. The error has been reported and we&apos;ll look
          into it.
        </Text>
        {__DEV__ && error && (
          <Text
            style={[
              styles.errorText,
              {
                color: theme.colors.error,
                fontSize: scaleFont(12),
                marginBottom: scaleSpacing(theme.spacing.xl),
              },
            ]}
          >
            {error.message}
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: scaleSpacing(theme.radius.sm),
              paddingVertical: scaleSpacing(theme.spacing.md),
              paddingHorizontal: scaleSpacing(theme.spacing.xl),
            },
          ]}
          onPress={onReset}
          accessibilityLabel="Try again"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: theme.colors.white,
                fontSize: scaleFont(16),
              },
            ]}
          >
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // padding applied inline with theme tokens
  },
  content: {
    // borderRadius and padding applied inline with theme tokens
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    // fontSize and marginBottom applied inline with theme tokens
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    // fontSize and marginBottom applied inline with theme tokens
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    // fontSize and marginBottom applied inline with theme tokens
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  button: {
    // padding and borderRadius applied inline with theme tokens
    minWidth: 120,
  },
  buttonText: {
    // fontSize applied inline with theme tokens
    fontWeight: '600',
    textAlign: 'center',
  },
});

// Export the ErrorBoundary class directly
// Sentry error capture is handled in componentDidCatch
export const ErrorBoundary = ErrorBoundaryClass;

export default ErrorBoundary;
