/**
 * Edit Profile Modal Component
 *
 * Reusable modal for editing profile information with animations and validation.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/providers/ThemeProvider';
import { useResponsive, SPACING } from '@/src/shared/utils/responsive';
import { BottomSheet, Input, Button } from '@/src/shared/ui';
import { isValidEmail } from '@/src/shared/utils/validation';
import { TEXT } from '@/src/config/text';

export interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  initialData: {
    name: string;
    email: string;
    age?: string;
    location?: string;
    bio?: string;
  };
  onSave: (data: {
    name: string;
    email: string;
    age?: string;
    location?: string;
    bio?: string;
  }) => Promise<void>;
  isSaving?: boolean;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  initialData,
  onSave,
  isSaving = false,
}) => {
  const { theme } = useTheme();
  const { scaleFont, scaleSpacing } = useResponsive();

  const [formData, setFormData] = useState(initialData);
  const [emailError, setEmailError] = useState<string>('');
  const [privateProfile, setPrivateProfile] = useState<boolean>(false);

  // Slide-up animation
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 12,
        stiffness: 180,
        mass: 1,
        overshootClamping: false,
      });
      opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
      setFormData(initialData);
      setEmailError('');
    } else {
      translateY.value = withTiming(300, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, initialData, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleSave = async () => {
    // Validate email
    if (formData.email && !isValidEmail(formData.email)) {
      setEmailError(TEXT.invalidEmail);
      return;
    }

    setEmailError('');
    await onSave(formData);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Edit Profile" snapPoints={['90%']}>
      <Animated.View style={animatedStyle}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: scaleSpacing(SPACING.xl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Input
            label={TEXT.firstName}
            placeholder="Enter your name"
            value={formData.name}
            onChangeText={(text: string) => {
              setFormData({ ...formData, name: text });
            }}
            containerStyle={styles.inputContainer}
          />

          <Input
            label={TEXT.email}
            placeholder={TEXT.enterEmail}
            value={formData.email}
            onChangeText={(text: string) => {
              setFormData({ ...formData, email: text });
              if (emailError) setEmailError('');
            }}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Age"
            placeholder="Enter your age"
            value={formData.age || ''}
            onChangeText={(text: string) => {
              const numericValue = text.replace(/[^0-9]/g, '');
              setFormData({ ...formData, age: numericValue });
            }}
            keyboardType="number-pad"
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Location"
            placeholder="Enter your location"
            value={formData.location || ''}
            onChangeText={(text: string) => {
              setFormData({ ...formData, location: text });
            }}
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Bio"
            placeholder="Tell us about yourself"
            value={formData.bio || ''}
            onChangeText={(text: string) => {
              setFormData({ ...formData, bio: text });
            }}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            containerStyle={styles.inputContainer}
          />

          {/* Privacy Toggle */}
          <View
            style={[
              styles.toggleRow,
              {
                paddingVertical: scaleSpacing(SPACING.md),
                marginTop: scaleSpacing(SPACING.sm),
              },
            ]}
          >
            <View style={styles.toggleContent}>
              <Text
                style={[
                  styles.toggleLabel,
                  {
                    color: theme.colors.text,
                    fontSize: scaleFont(15),
                  },
                ]}
              >
                Private Profile
              </Text>
              <Text
                style={[
                  styles.toggleHint,
                  {
                    color: theme.colors.text2,
                    fontSize: scaleFont(12),
                    marginTop: scaleSpacing(SPACING.xs),
                  },
                ]}
              >
                Hide your profile from other users
              </Text>
            </View>
            <Switch
              value={privateProfile}
              onValueChange={setPrivateProfile}
              trackColor={{ false: theme.colors.border2, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </View>

          <Button
            title={isSaving ? TEXT.loading : 'Save Changes'}
            onPress={handleSave}
            variant="primary"
            fullWidth
            disabled={isSaving}
            loading={isSaving}
            style={{ marginTop: scaleSpacing(SPACING.lg) }}
          />
        </ScrollView>
      </Animated.View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Padding and margin applied inline
  },
  toggleContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  toggleLabel: {
    fontWeight: '600',
  },
  toggleHint: {
    // Font size, color, and margin applied inline
  },
});

export default EditProfileModal;
