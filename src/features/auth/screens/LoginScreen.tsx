/**
 * Login Screen
 *
 * Login experience with:
 * - Clean gradient background
 * - Card design
 * - Smooth animations
 * - Responsive and accessible
 */

import { Input } from '@/src/shared/ui';
import { TEXT } from '@/src/config/text';
import { ROUTES } from '@/src/config/navigation';
import { animation, font, radius, spacing } from '@/src/config/theme';
import {
  useAuth,
  useErrorHandler,
  useFormValidation,
  useTheme,
  useTypedNavigation,
} from '@/src/shared/hooks';
import { useHaptics } from '@/src/shared/hooks/haptics';
import { announceScreenChange } from '@/src/shared/utils/accessibility';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LoginScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const { theme } = useTheme();
  const { login } = useAuth();
  const { impact, notification } = useHaptics();
  const handleError = useErrorHandler();
  const { validateLoginForm } = useFormValidation();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const buttonScale = useSharedValue(1);

  useEffect(() => {
    announceScreenChange(TEXT.signIn);
  }, []);

  useEffect(() => {
    if (email) setEmailError('');
  }, [email]);

  useEffect(() => {
    if (password) setPasswordError('');
  }, [password]);

  const handleLogin = async () => {
    await impact('medium');

    setEmailError('');
    setPasswordError('');

    const validation = validateLoginForm(email, password);
    if (!validation.isValid) {
      setEmailError(validation.errors.email || '');
      setPasswordError(validation.errors.password || '');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        await notification('success');
      } else {
        await notification('error');
        setPasswordError(result.error || 'Failed to login. Please try again.');
      }
    } catch (error) {
      await notification('error');
      handleError(error, { context: 'Login attempt' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    impact('light');
    navigation.push(ROUTES.signup);
  };

  const handleForgotPassword = () => {
    impact('light');
    navigation.push(ROUTES.resetPassword);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleButtonPressIn = () => {
    buttonScale.value = withSpring(0.97, animation.springConfig);
  };

  const handleButtonPressOut = () => {
    buttonScale.value = withSpring(1, animation.springConfig);
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={theme.colors.canvasGradient}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative circles */}
      <View style={styles.decorativeContainer} pointerEvents="none">
        <View
          style={[
            styles.decorativeCircle,
            {
              width: 350,
              height: 350,
              top: -120,
              right: -120,
              backgroundColor: theme.colors.primary,
              opacity: 0.06,
            },
          ]}
        />
        <View
          style={[
            styles.decorativeCircle,
            {
              width: 250,
              height: 250,
              bottom: 80,
              left: -100,
              backgroundColor: theme.colors.secondary,
              opacity: 0.05,
            },
          ]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 48,
              paddingBottom: insets.bottom + 48,
              paddingHorizontal: 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.logoSection}>
            <View
              style={[
                styles.logoContainer,
                {
                  backgroundColor: theme.colors.surface,
                  shadowColor: theme.colors.primary,
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.15,
                  shadowRadius: 28,
                  elevation: 12,
                },
              ]}
            >
              <Image
                source={require('@/src/assets/images/app_logo_mark.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="ResilientHQ logo"
              />
            </View>
          </Animated.View>

          {/* Title Section */}
          <Animated.View entering={FadeIn.duration(600).delay(200)} style={styles.titleSection}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text2 }]}>
              Sign in to continue your wellness journey
            </Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(300)}
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.surface,
                shadowColor: theme.colors.black,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.06,
                shadowRadius: 24,
                elevation: 6,
              },
            ]}
          >
            {/* Email Input */}
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              error={emailError}
              editable={!isLoading}
            />

            {/* Password Input */}
            <View style={styles.passwordWrapper}>
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                error={passwordError}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => {
                  impact('light');
                  setShowPassword(!showPassword);
                }}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                accessibilityState={{ selected: showPassword }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={theme.colors.text2}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotButton}
              disabled={isLoading}
            >
              <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                onPress={handleLogin}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={isLoading}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                accessibilityHint="Sign in to your existing ResilientHQ account"
                style={styles.signInButton}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[StyleSheet.absoluteFill, styles.buttonGradient]}
                />
                {isLoading ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
                ) : (
                  <Text style={[styles.signInButtonText, { color: theme.colors.white }]}>
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Sign Up Link */}
          <Animated.View entering={FadeIn.duration(600).delay(500)} style={styles.signUpSection}>
            <Text style={[styles.signUpText, { color: theme.colors.text2 }]}>
              {"Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
              <Text style={[styles.signUpLink, { color: theme.colors.primary }]}>Create one</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  decorativeContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: radius.round,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  logoContainer: {
    width: 112,
    height: 112,
    borderRadius: radius['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 92,
    height: 92,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontSize: font.displaySmall - 2,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: font.body + 1,
    lineHeight: 24,
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius['3xl'] - 4,
    padding: spacing['2xl'],
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.lg,
    top: 38,
    padding: spacing.sm - spacing.xs / 2,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 28,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: font.bodySmall + 1,
    fontWeight: '600',
  },
  signInButton: {
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonGradient: {
    borderRadius: radius.lg,
  },
  signInButtonText: {
    fontSize: font.bodyLarge,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  signUpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
  signUpText: {
    fontSize: font.body,
  },
  signUpLink: {
    fontSize: font.body,
    fontWeight: '700',
  },
});

export default LoginScreen;
