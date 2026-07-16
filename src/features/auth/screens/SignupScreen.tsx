/**
 * Sign Up Screen
 *
 * Signup experience matching LoginScreen
 */

import { Input } from '@/src/shared/ui';
import { TEXT } from '@/src/config/text';
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

const SignupScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const { theme } = useTheme();
  const { signup } = useAuth();
  const { impact, notification } = useHaptics();
  const handleError = useErrorHandler();
  const { validateSignupForm } = useFormValidation();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const buttonScale = useSharedValue(1);

  useEffect(() => {
    announceScreenChange(TEXT.signUp);
  }, []);

  useEffect(() => {
    if (firstName) setFirstNameError('');
  }, [firstName]);
  useEffect(() => {
    if (lastName) setLastNameError('');
  }, [lastName]);
  useEffect(() => {
    if (email) setEmailError('');
  }, [email]);
  useEffect(() => {
    if (password) setPasswordError('');
  }, [password]);
  useEffect(() => {
    if (confirmPassword) setConfirmPasswordError('');
  }, [confirmPassword]);

  const handleSignup = async () => {
    await impact('medium');

    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    const validation = validateSignupForm(firstName, lastName, email, password, confirmPassword);
    if (!validation.isValid) {
      setFirstNameError(validation.errors.firstName || '');
      setLastNameError(validation.errors.lastName || '');
      setEmailError(validation.errors.email || '');
      setPasswordError(validation.errors.password || '');
      setConfirmPasswordError(validation.errors.confirmPassword || '');
      return;
    }

    setIsLoading(true);
    try {
      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const result = await signup(email.trim(), password, displayName);

      if (result.success) {
        await notification('success');
      } else {
        await notification('error');
        setEmailError(result.error || 'Failed to create account. Please try again.');
      }
    } catch (error) {
      await notification('error');
      handleError(error, { context: 'Signup attempt' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = () => {
    impact('light');
    navigation.back();
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
              width: 300,
              height: 300,
              top: -100,
              left: -100,
              backgroundColor: theme.colors.secondary,
              opacity: 0.06,
            },
          ]}
        />
        <View
          style={[
            styles.decorativeCircle,
            {
              width: 200,
              height: 200,
              bottom: 60,
              right: -80,
              backgroundColor: theme.colors.primary,
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
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 40,
              paddingHorizontal: 24,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.backButtonRow}>
            <TouchableOpacity
              onPress={handleSignIn}
              style={[
                styles.backButton,
                {
                  backgroundColor: theme.colors.surface,
                  shadowColor: theme.colors.black,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                },
              ]}
            >
              <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </Animated.View>

          {/* Logo Section */}
          <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.logoSection}>
            <View
              style={[
                styles.logoContainer,
                {
                  backgroundColor: theme.colors.surface,
                  shadowColor: theme.colors.secondary,
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
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text2 }]}>
              Start your wellness journey today
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
            {/* Name Row */}
            <View style={styles.nameRow}>
              <View style={styles.nameInput}>
                <Input
                  label="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="givenName"
                  error={firstNameError}
                  editable={!isLoading}
                />
              </View>
              <View style={styles.nameInput}>
                <Input
                  label="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="familyName"
                  error={lastNameError}
                  editable={!isLoading}
                />
              </View>
            </View>

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
              error={emailError}
              editable={!isLoading}
            />

            {/* Password Input */}
            <View style={styles.passwordWrapper}>
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                textContentType="newPassword"
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

            {/* Confirm Password Input */}
            <View style={styles.passwordWrapper}>
              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={handleSignup}
                error={confirmPasswordError}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => {
                  impact('light');
                  setShowConfirmPassword(!showConfirmPassword);
                }}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                accessibilityState={{ selected: showConfirmPassword }}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={theme.colors.text2}
                />
              </TouchableOpacity>
            </View>

            {/* Create Account Button */}
            <Animated.View style={[buttonAnimatedStyle, { marginTop: 8 }]}>
              <TouchableOpacity
                onPress={handleSignup}
                onPressIn={handleButtonPressIn}
                onPressOut={handleButtonPressOut}
                disabled={isLoading}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Create account"
                accessibilityHint="Create a new ResilientHQ account"
                style={styles.signUpButton}
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
                  <Text style={[styles.signUpButtonText, { color: theme.colors.white }]}>
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Sign In Link */}
          <Animated.View entering={FadeIn.duration(600).delay(500)} style={styles.signInSection}>
            <Text style={[styles.signInText, { color: theme.colors.text2 }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={handleSignIn} disabled={isLoading}>
              <Text style={[styles.signInLink, { color: theme.colors.primary }]}>Sign In</Text>
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
  },
  backButtonRow: {
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: radius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: font.h1 - 2,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: font.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    borderRadius: radius['3xl'] - 4,
    padding: spacing.xl + spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md + spacing.xs / 2,
  },
  nameInput: {
    flex: 1,
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
  signUpButton: {
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonGradient: {
    borderRadius: radius.lg,
  },
  signUpButtonText: {
    fontSize: font.bodyLarge,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  signInSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl + spacing.sm,
  },
  signInText: {
    fontSize: font.body,
  },
  signInLink: {
    fontSize: font.body,
    fontWeight: '700',
  },
});

export default SignupScreen;
