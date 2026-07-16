/**
 * Reset Password Screen
 *
 * Unified layout system with standard spacing.
 */

import {
  Body,
  Button,
  FormSection,
  HeaderWithLogo,
  Input,
  ScreenLayout,
  Title,
} from '@/src/shared/ui';
import { TEXT } from '@/src/config/text';
import {
  useAuth,
  useErrorHandler,
  useFormValidation,
  useTheme,
  useTypedNavigation,
} from '@/src/shared/hooks';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { announceScreenChange } from '@/src/shared/utils/accessibility';
import { useResponsive } from '@/src/shared/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ResetPasswordScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const { theme } = useTheme();
  const { resetPassword } = useAuth();
  const { impact, notification } = useHaptics();
  const handleError = useErrorHandler();
  const { validateResetPasswordForm } = useFormValidation();
  const { scaleFont, scaleSpacing } = useResponsive();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  React.useEffect(() => {
    announceScreenChange(TEXT.resetPassword);
  }, []);

  // Clear errors when user types
  useEffect(() => {
    if (email) setEmailError('');
  }, [email]);

  const handleResetPassword = async () => {
    await impact('medium');

    // Reset errors
    setEmailError('');

    // Validation using hook
    const validation = validateResetPasswordForm(email);
    if (!validation.isValid) {
      setEmailError(validation.errors.email || '');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(email.trim());
      if (result.success) {
        await notification('success');
        setEmailSent(true);
      } else {
        await notification('error');
        setEmailError(result.error || TEXT.resetLinkError);
      }
    } catch (error) {
      await notification('error');
      handleError(error, { context: 'Password reset attempt' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    impact('light');
    navigation.back();
  };

  return (
    <ScreenLayout
      scroll={true}
      safeAreaTop={true}
      safeAreaBottom={true}
      maxContentWidth={540}
      contentCentered={true}
      includeTabBarPadding={false}
    >
      <View style={[styles.contentWrapper, { paddingTop: scaleSpacing(theme.spacing['3xl']) }]}>
        {/* Header with Logo */}
        <HeaderWithLogo
          logoSource={require('@/src/assets/images/app_logo_mark.png')}
          title={TEXT.resetPasswordTitle}
          subtitle={TEXT.resetPasswordSubtitle}
        />

        {/* Form Card */}
        <FormSection>
          {emailSent ? (
            <View
              style={[styles.successContainer, { paddingVertical: scaleSpacing(theme.spacing.md) }]}
            >
              <View
                style={[
                  styles.successIconContainer,
                  {
                    width: scaleSpacing(120),
                    height: scaleSpacing(120),
                    borderRadius: scaleSpacing(60),
                    backgroundColor: theme.colors.primary + '20',
                    marginBottom: scaleSpacing(theme.spacing.lg),
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={scaleFont(64, 0.3)}
                  color={theme.colors.primary}
                />
              </View>
              <Title
                style={[
                  styles.successTitle,
                  {
                    marginBottom: scaleSpacing(theme.spacing.md),
                    fontSize: scaleFont(24, 0.3),
                  },
                ]}
              >
                Check Your Email
              </Title>
              <Body
                style={[
                  styles.successText,
                  {
                    marginBottom: scaleSpacing(theme.spacing.sm),
                    fontSize: scaleFont(16, 0.3),
                  },
                ]}
              >
                We&apos;ve sent a password reset link to{'\n'}
                <Body style={{ fontWeight: '600' }}>{email}</Body>
              </Body>
              <Body
                style={[
                  styles.successSubtext,
                  {
                    marginBottom: scaleSpacing(theme.spacing['2xl']),
                    fontSize: scaleFont(14, 0.3),
                  },
                ]}
              >
                Please check your inbox and follow the instructions to reset your password.
              </Body>
              <View style={styles.buttonContainer}>
                <Button
                  title="Back to Login"
                  onPress={handleBackToLogin}
                  variant="primary"
                  style={styles.formButton}
                />
              </View>
            </View>
          ) : (
            <>
              <Input
                label={TEXT.email}
                value={email}
                onChangeText={setEmail}
                placeholder={TEXT.enterEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                error={emailError}
                editable={!isLoading}
              />

              <View style={styles.buttonContainer}>
                <Button
                  title={isLoading ? 'Sending...' : 'Send Reset Link'}
                  onPress={handleResetPassword}
                  variant="primary"
                  disabled={isLoading}
                  loading={isLoading}
                  style={styles.formButton}
                />
              </View>

              <TouchableOpacity
                onPress={handleBackToLogin}
                style={[
                  styles.backLink,
                  {
                    marginTop: scaleSpacing(theme.spacing.xl),
                    padding: scaleSpacing(theme.spacing.md),
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Back to login"
                accessibilityHint="Return to the login screen"
                disabled={isLoading}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} // Increase touch target
              >
                <Ionicons
                  name="arrow-back"
                  size={scaleFont(18, 0.3)}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.backLinkText,
                    {
                      color: theme.colors.primary,
                      marginLeft: scaleSpacing(theme.spacing.sm),
                      fontSize: scaleFont(15, 0.3),
                    },
                  ]}
                >
                  Back to Login
                </Text>
              </TouchableOpacity>
            </>
          )}
        </FormSection>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLinkText: {
    fontWeight: '600',
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  formButton: {
    width: '80%',
    maxWidth: 320,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  successText: {
    textAlign: 'center',
    lineHeight: 24,
  },
  successSubtext: {
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ResetPasswordScreen;
